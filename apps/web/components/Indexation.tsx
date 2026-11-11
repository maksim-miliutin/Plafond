"use client";

import { useEffect, useState } from "react";

import type { IndexRow } from "@plafond/domain";

import { helpers } from "../lib/help";
import { nextRevision, revisionStart, type RevisionEvent, type RevisionStep } from "../lib/revision-flow";
import { todayInParis } from "../lib/today";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";
import { RevisionFormStep } from "./RevisionFormStep";
import { RevisionResultStep } from "./RevisionResultStep";

export interface RevisionNeeds
{
    now: () => Date;
}

const live: RevisionNeeds = { now: () => new Date() };

export function Indexation({ index, needs = live }: { index: readonly IndexRow[]; needs?: RevisionNeeds })
{
    const [step, setStep] = useState<RevisionStep>(revisionStart);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: RevisionEvent)
    {
        setStep((current) => nextRevision(current, event, { on: todayInParis(needs.now()), index }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return <RevisionFormStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} />;

        case "result":
            return (
                <RevisionResultStep
                    lease={step.lease}
                    clauseAssumed={step.clauseAssumed}
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
