"use client";

import { useEffect, useRef, useState } from "react";

import { geoplateforme, type Geocoder } from "@plafond/address";

import { next, start, type Event, type Step } from "../lib/flow";
import { loadTables, type Tables, type Unreachable } from "../lib/load";
import { todayInParis } from "../lib/today";
import { AddressStep } from "./AddressStep";
import { LeaseStep } from "./LeaseStep";
import { LetterStep } from "./LetterStep";
import { QuartierStep } from "./QuartierStep";
import { ResultStep } from "./ResultStep";

export interface Needs
{
    geocoder: Geocoder;
    tables: () => Promise<Tables | Unreachable>;
    now: () => Date;
}

// The tables sit at the root of the site, empty locally and /Plafond on GitHub Pages, while this page lives at /loyer/.
const siteRoot = process.env.NEXT_PUBLIC_SITE_ROOT ?? "";

// GitHub Pages lets a browser keep a file for ten minutes; asking first keeps an old table out of a fresh check.
const live: Needs = {
    geocoder: geoplateforme((url) => fetch(url)),
    tables: () => loadTables((file) => fetch(`${siteRoot}/${file}`, { cache: "no-cache" })),
    now: () => new Date(),
};

const none: Tables = { rates: [], quartiers: [] };

export function Plafond({ needs = live }: { needs?: Needs })
{
    const [step, setStep] = useState<Step>(start);
    const [tables, setTables] = useState<Tables | Unreachable | null>(null);
    const [busy, setBusy] = useState(false);
    const loading = useRef<Promise<Tables | Unreachable> | null>(null);

    function loaded(): Promise<Tables | Unreachable>
    {
        loading.current ??= needs.tables().then((result) =>
        {
            setTables(result);

            return result;
        });

        return loading.current;
    }

    useEffect(() =>
    {
        void loaded();
    }, []);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: Event, world: Tables)
    {
        setStep((current) => next(current, event, { ...world, on: todayInParis(needs.now()) }));
    }

    async function find(typed: string)
    {
        setBusy(true);
        const [lookup, ready] = await Promise.all([needs.geocoder.locate(typed), loaded()]);
        setBusy(false);
        if ("kind" in ready)
        {
            return;
        }

        go({ type: "located", typed, lookup }, ready);
    }

    if (tables !== null && "kind" in tables)
    {
        return <Unavailable />;
    }

    const world = tables ?? none;
    const back = () => go({ type: "back" }, world);

    switch (step.at)
    {
        case "address":
            return <AddressStep typed={step.typed} problem={step.problem} busy={busy} onFind={find} />;

        case "quartier":
            return (
                <QuartierStep
                    quartier={step.place.quartier}
                    around={step.place.around}
                    address={step.place.label}
                    point={step.place.point}
                    onConfirm={() => go({ type: "confirmed" }, world)}
                    onBack={back}
                />
            );

        case "lease":
            return (
                <LeaseStep
                    fields={step.fields}
                    errors={step.errors}
                    noRate={step.noRate}
                    onAnswer={(fields) => go({ type: "answered", fields }, world)}
                    onBack={back}
                />
            );

        case "result":
            return (
                <ResultStep
                    check={step.check}
                    claim={step.claim}
                    quartier={step.place.quartier.name}
                    writable={step.letter !== null}
                    onWrite={() => go({ type: "wrote" }, world)}
                    onBack={back}
                />
            );

        case "letter":
            return <LetterStep letter={step.letter} onBack={back} />;
    }
}

function Unavailable()
{
    return (
        <main className="screen">
            <p className="wordmark">Plafond</p>
            <h1 className="title">Plafond est momentanément indisponible</h1>
            <p className="lead">
                Les loyers de référence et le plan des quartiers n'ont pas pu être chargés. Vérifiez votre connexion,
                puis rechargez la page.
            </p>
        </main>
    );
}
