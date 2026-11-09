"use client";

import { useEffect, useRef, useState } from "react";

import { geoplateforme, type Geocoder } from "@plafond/address";
import type { City } from "@plafond/domain";

import { next, start, type Event, type Step } from "../lib/flow";
import { loadCity, type Tables, type Unreachable } from "../lib/load";
import { cityOf } from "../lib/cities";
import { todayInParis } from "../lib/today";
import { helpers, parisRent } from "../lib/help";
import { AddressStep } from "./AddressStep";
import { HelpStep } from "./HelpStep";
import { LeaseStep } from "./LeaseStep";
import { LetterStep } from "./LetterStep";
import { QuartierStep } from "./QuartierStep";
import { ResultStep } from "./ResultStep";
import { Brand } from "./Brand";

export interface Needs
{
    geocoder: Geocoder;
    tables: (city: City) => Promise<Tables | Unreachable>;
    now: () => Date;
}

// The tables sit at the root of the site, empty locally and /Plafond on GitHub Pages, while this page lives at /loyer/.
const siteRoot = process.env.NEXT_PUBLIC_SITE_ROOT ?? "";

// GitHub Pages lets a browser keep a file for ten minutes; asking first keeps an old table out of a fresh check.
const live: Needs = {
    geocoder: geoplateforme((url) => fetch(url), "rent"),
    tables: (city) => loadCity((file) => fetch(`${siteRoot}/${file}`, { cache: "no-cache" }), city),
    now: () => new Date(),
};

const none: Tables = { rates: [], quartiers: [] };

export function Plafond({ needs = live }: { needs?: Needs })
{
    const [step, setStep] = useState<Step>(start);
    const [worlds, setWorlds] = useState<Partial<Record<City, Tables | Unreachable>>>({});
    const [busy, setBusy] = useState(false);
    const loading = useRef<Partial<Record<City, Promise<Tables | Unreachable>>>>({});

    function loaded(city: City): Promise<Tables | Unreachable>
    {
        loading.current[city] ??= needs.tables(city).then((result) =>
        {
            setWorlds((known) => ({ ...known, [city]: result }));

            return result;
        });

        return loading.current[city];
    }

    useEffect(() =>
    {
        void loaded("paris");
    }, []);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: Event, city: City, world: Tables)
    {
        setStep((current) => next(current, event, { ...world, city, on: todayInParis(needs.now()) }));
    }

    async function find(typed: string)
    {
        setBusy(true);
        const lookup = await needs.geocoder.locate(typed);
        const city = lookup.kind === "located" ? cityOf(lookup.citycode) : "paris";
        const ready = await loaded(city);
        setBusy(false);
        go({ type: "located", typed, lookup: "kind" in ready ? { kind: "unreachable" } : lookup }, city, "kind" in ready ? none : ready);
    }

    const paris = worlds.paris;
    if (paris !== undefined && "kind" in paris)
    {
        return <Unavailable />;
    }

    const city: City = "place" in step ? step.place.city : step.at === "help" ? step.from.place.city : "paris";
    const known = worlds[city];
    const world = known === undefined || "kind" in known ? none : known;
    const back = () => go({ type: "back" }, city, world);

    switch (step.at)
    {
        case "address":
            return <AddressStep typed={step.typed} problem={step.problem} busy={busy} onFind={find} />;

        case "quartier":
            return (
                <QuartierStep
                    city={step.place.city}
                    quartier={step.place.quartier}
                    around={step.place.around}
                    address={step.place.label}
                    point={step.place.point}
                    onConfirm={() => go({ type: "confirmed" }, city, world)}
                    onBack={back}
                />
            );

        case "lease":
            return (
                <LeaseStep
                    city={step.place.city}
                    fields={step.fields}
                    errors={step.errors}
                    noRate={step.noRate}
                    onAnswer={(fields) => go({ type: "answered", fields }, city, world)}
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
                    onWrite={() => go({ type: "wrote" }, city, world)}
                    onHelp={() => go({ type: "helped" }, city, world)}
                    onBack={back}
                />
            );

        case "letter":
            return <LetterStep letter={step.letter} city={step.place.city} onBack={back} />;

        case "help":
            return <HelpStep helpers={city === "paris" ? [parisRent, ...helpers] : helpers} onBack={back} />;
    }
}

function Unavailable()
{
    return (
        <main className="screen">
            <Brand />
            <h1 className="title">Plafond est momentanément indisponible</h1>
            <p className="lead">
                Les loyers de référence et le plan des quartiers n'ont pas pu être chargés. Vérifiez votre connexion,
                puis rechargez la page.
            </p>
        </main>
    );
}
