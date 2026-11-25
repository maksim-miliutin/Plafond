"use client";

import { useEffect, useState } from "react";

import type { CommuneZone, ZoneLists } from "@plafond/import";

import { communeFrom } from "../lib/commune-zone";
import { helpers } from "../lib/help";
import { nextNotice, noticeStart, type NoticeEvent, type NoticeStep } from "../lib/notice-flow";
import { todayInParis } from "../lib/today";
import type { ZoneNeeds } from "./Honoraires";
import { HelpStep } from "./HelpStep";
import { LetterStep } from "./LetterStep";
import { NoticeFormStep } from "./NoticeFormStep";
import { NoticeResultStep } from "./NoticeResultStep";

export interface NoticeNeeds
{
    now: () => Date;
}

const live: NoticeNeeds = { now: () => new Date() };

export function Preavis({ zones, needs = live }: { zones?: ZoneNeeds; needs?: NoticeNeeds })
{
    const [step, setStep] = useState<NoticeStep>(noticeStart);
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

    function go(event: NoticeEvent)
    {
        setStep((current) => nextNotice(current, event, { on: todayInParis(needs.now()) }));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return (
                <NoticeFormStep
                    fields={step.fields}
                    errors={step.errors}
                    onAnswer={(fields) => go({ type: "answered", fields })}
                    commune={commune === undefined || zones === undefined ? undefined : { commune, lists: zones.lists }}
                    today={todayInParis(needs.now())}
                />
            );

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
