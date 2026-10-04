"use client";

import { useEffect, useState } from "react";

import { chargesStart, nextCharges, type ChargesEvent, type ChargesStep } from "../lib/charges-flow";
import { helpers } from "../lib/help";
import { todayInParis } from "../lib/today";
import { ChargesFormStep } from "./ChargesFormStep";
import { ChargesResultStep } from "./ChargesResultStep";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";

export interface ChargesNeeds
{
    now: () => Date;
}

const live: ChargesNeeds = { now: () => new Date() };

export function Decompte({ needs = live }: { needs?: ChargesNeeds })
{
    const [step, setStep] = useState<ChargesStep>(chargesStart);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: ChargesEvent)
    {
        setStep((current) => nextCharges(current, event, { on: todayInParis(needs.now()) }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return <ChargesFormStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} />;

        case "result":
            return (
                <ChargesResultStep
                    regularised={step.regularised}
                    check={step.check}
                    on={step.on}
                    writable={step.letter !== null}
                    onWrite={() => go({ type: "wrote" })}
                    onHelp={() => go({ type: "helped" })}
                    onBack={back}
                />
            );

        case "letter":
            return <LetterStep letter={step.letter} onBack={back} />;

        case "help":
            return <HelpStep helpers={helpers} onBack={back} />;
    }
}
