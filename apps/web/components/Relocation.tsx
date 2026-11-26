"use client";

import { useEffect, useMemo, useState } from "react";

import { communeFrom } from "../lib/commune-zone";
import { helpers } from "../lib/help";
import { labelOf, unpackRegion } from "../lib/region";
import { nextRelocation, relocationStart, type RelocationEvent, type RelocationStep, type RelocationWorld } from "../lib/relocation-flow";
import { HelpStep } from "./HelpStep";
import { RelocationFormStep } from "./RelocationFormStep";
import { RelocationResultStep } from "./RelocationResultStep";

export function Relocation({ rules }: { rules: Omit<RelocationWorld, "communes"> & { communes: string } })
{
    const world = useMemo(() => ({ ...rules, communes: unpackRegion(rules.communes) }), [rules]);
    const [step, setStep] = useState<RelocationStep>(relocationStart);

    // The link's code is read in the browser: the page is built once for every commune. An unknown code leaves the choice open.
    useEffect(() =>
    {
        const commune = communeFrom(window.location.search, world.communes);
        if (commune !== undefined)
        {
            setStep((current) => current.at === "form" && current.fields.commune === "" ? { ...current, fields: { ...current.fields, commune: labelOf(commune) } } : current);
        }
    }, [world.communes]);

    useEffect(() =>
    {
        document.documentElement.scrollTop = 0;
    }, [step.at]);

    function go(event: RelocationEvent)
    {
        setStep((current) => nextRelocation(current, event, world));
    }

    const back = () => go({ type: "back" });

    switch (step.at)
    {
        case "form":
            return <RelocationFormStep fields={step.fields} errors={step.errors} communes={world.communes} onAnswer={(fields) => go({ type: "answered", fields })} />;

        case "result":
            return (
                <RelocationResultStep
                    communeName={step.commune.name}
                    capped={step.capped}
                    lease={step.lease}
                    firstAssumed={step.firstAssumed}
                    basisAssumed={step.basisAssumed}
                    check={step.check}
                    onHelp={() => go({ type: "helped" })}
                    onBack={back}
                />
            );

        case "help":
            return <HelpStep helpers={helpers} onBack={back} />;
    }
}
