"use client";

import { useEffect, useState } from "react";

import { ademe, type DpeSource } from "@plafond/ademe";
import { geoplateforme, type Geocoder } from "@plafond/address";

import { dpeStart, nextDpe, type DpeEvent, type DpeStep } from "../lib/dpe-flow";
import { search } from "../lib/dpe-search";
import { todayInParis } from "../lib/today";
import { DpeChooseStep } from "./DpeChooseStep";
import { DpeFindStep } from "./DpeFindStep";
import { DpeLeaseStep } from "./DpeLeaseStep";
import { DpeResultStep } from "./DpeResultStep";
import { LetterStep } from "./LetterStep";

export interface EnergyNeeds
{
    geocoder: Geocoder;
    source: DpeSource;
    now: () => Date;
}

const live: EnergyNeeds = {
    geocoder: geoplateforme((url) => fetch(url), "mainland"),
    source: ademe((url) => fetch(url)),
    now: () => new Date(),
};

export function Energie({ needs = live }: { needs?: EnergyNeeds })
{
    const [step, setStep] = useState<DpeStep>(dpeStart);
    const [busy, setBusy] = useState(false);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: DpeEvent)
    {
        setStep((current) => nextDpe(current, event, { on: todayInParis(needs.now()) }));
    }

    async function find(typed: string)
    {
        setBusy(true);
        const outcome = await search(typed, needs);
        setBusy(false);
        go({ type: "searched", typed, outcome });
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "find":
            return <DpeFindStep typed={step.typed} problem={step.problem} busy={busy} onSearch={find} />;

        case "choose":
            return <DpeChooseStep listings={step.listings} onChoose={(index) => go({ type: "chose", index })} onBack={back} />;

        case "lease":
            return <DpeLeaseStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} onBack={back} />;

        case "result":
            return (
                <DpeResultStep
                    listing={step.listing}
                    raisedOn={step.raisedOn}
                    decency={step.decency}
                    increase={step.increase}
                    writable={step.letter !== null}
                    onWrite={() => go({ type: "wrote" })}
                    onBack={back}
                />
            );

        case "letter":
            return <LetterStep letter={step.letter} onBack={back} />;
    }
}
