import { decency, dpeLetter, increase, isDay } from "@plafond/domain";
import type { DecencyFinding, Day, IncreaseFinding, Letter, Tenancy } from "@plafond/domain";
import type { Listing } from "@plafond/ademe";

import type { DpeProblem, Searched } from "./dpe-search";

export interface DpeFields
{
    signedOn: string;
    furnished: string;
    landlord: string;
    raised: string;
    raisedOn: string;
}

export type DpeErrors = Partial<Record<keyof DpeFields, string>>;

interface Chosen
{
    typed: string;
    listing: Listing;
}

interface Judged extends Chosen
{
    fields: DpeFields;
    tenancy: Tenancy;
    raisedOn: Day | null;
    decency: DecencyFinding;
    increase: IncreaseFinding | null;
}

export type DpeStep =
    | { at: "find"; typed: string; problem: DpeProblem | null }
    | { at: "choose"; typed: string; listings: Listing[] }
    | ({ at: "lease"; fields: DpeFields; errors: DpeErrors; listings: Listing[] } & Chosen)
    | ({ at: "result"; letter: Letter | null; listings: Listing[] } & Judged)
    | ({ at: "letter"; letter: Letter; listings: Listing[] } & Judged)
    | { at: "help"; from: Extract<DpeStep, { at: "result" }> };

export type DpeEvent =
    | { type: "searched"; typed: string; outcome: Searched }
    | { type: "chose"; index: number }
    | { type: "answered"; fields: DpeFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export const dpeStart: DpeStep = { at: "find", typed: "", problem: null };

export const dpeQuestions: Record<keyof DpeFields, string> = {
    signedOn: "Indiquez la date de signature du bail.",
    furnished: "Indiquez si le logement est loué vide ou meublé.",
    landlord: "Indiquez qui vous loue le logement.",
    raised: "Indiquez si votre loyer a augmenté depuis la signature.",
    raisedOn: "Indiquez la date de l'augmentation.",
};

const empty: DpeFields = { signedOn: "", furnished: "", landlord: "", raised: "", raisedOn: "" };

export function nextDpe(step: DpeStep, event: DpeEvent, world: { on: Day }): DpeStep
{
    switch (event.type)
    {
        case "searched":
            return step.at === "find" ? searched(event.typed, event.outcome) : step;

        case "chose":
        {
            const listing = step.at === "choose" ? step.listings[event.index] : undefined;

            return step.at === "choose" && listing !== undefined
                ? { at: "lease", typed: step.typed, listings: step.listings, listing, fields: empty, errors: {} }
                : step;
        }

        case "answered":
            return step.at === "lease" ? answered(step, event.fields, world.on) : step;

        case "wrote":
            return step.at === "result" && step.letter !== null ? { ...step, at: "letter", letter: step.letter } : step;

        case "helped":
            return step.at === "result" ? { at: "help", from: step } : step;

        case "back":
            return back(step);
    }
}

function searched(typed: string, outcome: Searched): DpeStep
{
    return outcome.kind === "listed" ? { at: "choose", typed, listings: outcome.listings } : { at: "find", typed, problem: outcome.problem };
}

function answered(step: Extract<DpeStep, { at: "lease" }>, fields: DpeFields, on: Day): DpeStep
{
    const raised = fields.raised === "yes" ? true : fields.raised === "no" ? false : null;
    const errors: DpeErrors = {
        ...(isDay(fields.signedOn) ? {} : { signedOn: dpeQuestions.signedOn }),
        ...(fields.furnished === "yes" || fields.furnished === "no" ? {} : { furnished: dpeQuestions.furnished }),
        ...(fields.landlord === "person" || fields.landlord === "company" ? {} : { landlord: dpeQuestions.landlord }),
        ...(raised === null ? { raised: dpeQuestions.raised } : {}),
        ...(raised === true && !isDay(fields.raisedOn) ? { raisedOn: dpeQuestions.raisedOn } : {}),
    };
    if (Object.keys(errors).length > 0)
    {
        return { ...step, fields, errors };
    }

    const { dpe, address } = step.listing;
    const tenancy: Tenancy = { signedOn: fields.signedOn, furnished: fields.furnished === "yes", company: fields.landlord === "company", on };
    const raisedOn = raised === true ? fields.raisedOn : null;
    const judged = { decency: decency(dpe, tenancy), increase: raisedOn === null ? null : increase(dpe, tenancy, raisedOn) };
    const written = dpeLetter({ dpe, tenancy, address, raisedOn, ...judged });

    return {
        at: "result",
        typed: step.typed,
        listings: step.listings,
        listing: step.listing,
        fields,
        tenancy,
        raisedOn,
        ...judged,
        letter: written.kind === "letter" ? written : null,
    };
}

function back(step: DpeStep): DpeStep
{
    switch (step.at)
    {
        case "find":
            return step;

        case "choose":
            return { at: "find", typed: step.typed, problem: null };

        case "lease":
            return { at: "choose", typed: step.typed, listings: step.listings };

        case "result":
            return { at: "lease", typed: step.typed, listings: step.listings, listing: step.listing, fields: step.fields, errors: {} };

        case "letter":
            return { ...step, at: "result" };

        case "help":
            return step.from;
    }
}
