"use client";

import { useEffect, useState } from "react";

import { helpers } from "../lib/help";
import { nextNotice, noticeStart, type NoticeEvent, type NoticeStep } from "../lib/notice-flow";
import { todayInParis } from "../lib/today";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";
import { NoticeFormStep } from "./NoticeFormStep";
import { NoticeResultStep } from "./NoticeResultStep";

export interface NoticeNeeds
{
    now: () => Date;
}

const live: NoticeNeeds = { now: () => new Date() };

export function Preavis({ needs = live }: { needs?: NoticeNeeds })
{
    const [step, setStep] = useState<NoticeStep>(noticeStart);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: NoticeEvent)
    {
        setStep((current) => nextNotice(current, event, { on: todayInParis(needs.now()) }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return <NoticeFormStep fields={step.fields} errors={step.errors} onAnswer={(fields) => go({ type: "answered", fields })} />;

        case "result":
            return (
                <NoticeResultStep
                    check={step.check}
                    receivedOn={step.fields.receivedOn}
                    ifTense={step.ifTense}
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
