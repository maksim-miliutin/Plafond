"use client";

import { useEffect, useState } from "react";

import type { CommuneZone, ZoneLists } from "@plafond/import";

import type { FeeCaps } from "@plafond/domain";

import { feesStart, nextFees, type FeesEvent, type FeesStep } from "../lib/fees-flow";
import { communeFrom } from "../lib/commune-zone";
import { helpers } from "../lib/help";
import { todayInParis } from "../lib/today";
import { FeesFormStep } from "./FeesFormStep";
import { FeesResultStep } from "./FeesResultStep";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";

export interface FeesNeeds
{
    now: () => Date;
}

const live: FeesNeeds = { now: () => new Date() };

export interface ZoneNeeds
{
    communes: readonly CommuneZone[];
    lists: ZoneLists;
}

export function Honoraires({ caps, zones, needs = live }: { caps: readonly FeeCaps[]; zones?: ZoneNeeds; needs?: FeesNeeds })
{
    const [step, setStep] = useState<FeesStep>(feesStart);
    const [commune, setCommune] = useState<CommuneZone | undefined>(undefined);

    // The link's code is read in the browser: the page is built once for every commune.
    useEffect(() =>
    {
        setCommune(zones === undefined ? undefined : communeFrom(window.location.search, zones.communes));
    }, [zones]);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: FeesEvent)
    {
        setStep((current) => nextFees(current, event, { on: todayInParis(needs.now()), caps }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return (
                <FeesFormStep
                    fields={step.fields}
                    errors={step.errors}
                    onAnswer={(fields) => go({ type: "answered", fields })}
                    commune={commune === undefined || zones === undefined ? undefined : { commune, lists: zones.lists }}
                    today={todayInParis(needs.now())}
                />
            );

        case "result":
            return (
                <FeesResultStep
                    paid={step.paid}
                    check={step.check}
                    writable={step.letter !== null}
                    onWrite={() => go({ type: "wrote" })}
                    onHelp={() => go({ type: "helped" })}
                    onBack={back}
                />
            );

        case "letter":
            return <LetterStep letter={step.letter} to="à l'agence" onBack={back} />;

        case "help":
            return <HelpStep helpers={helpers} onBack={back} />;
    }
}
