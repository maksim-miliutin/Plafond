"use client";

import { useEffect, useState } from "react";

import type { FeeCaps } from "@plafond/domain";

import { feesStart, nextFees, type FeesEvent, type FeesStep } from "../lib/fees-flow";
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

export function Honoraires({ caps, needs = live }: { caps: readonly FeeCaps[]; needs?: FeesNeeds })
{
    const [step, setStep] = useState<FeesStep>(feesStart);

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
            return <FeesFormStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} />;

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
