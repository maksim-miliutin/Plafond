"use client";

import { useEffect, useState } from "react";

import { depositStart, nextDeposit, type DepositEvent, type DepositStep } from "../lib/deposit-flow";
import { helpers } from "../lib/help";
import { todayInParis } from "../lib/today";
import { DepositFormStep } from "./DepositFormStep";
import { DepositResultStep } from "./DepositResultStep";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";

export interface DepositNeeds
{
    now: () => Date;
}

const live: DepositNeeds = { now: () => new Date() };

export function Caution({ needs = live }: { needs?: DepositNeeds })
{
    const [step, setStep] = useState<DepositStep>(depositStart);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: DepositEvent)
    {
        setStep((current) => nextDeposit(current, event, { on: todayInParis(needs.now()) }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return <DepositFormStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} />;

        case "result":
            return (
                <DepositResultStep
                    held={step.held}
                    check={step.check}
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
