import { addMonths, type Day } from "./day.js";

export type Label = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export interface Dpe
{
    number: string;
    label: Label;
    establishedOn: Day;
    validUntil: Day;
}

export interface Tenancy
{
    signedOn: Day;
    furnished: boolean;
    on: Day;
}

export type IncreaseFinding =
    | { kind: "forbidden"; since: Day }
    | { kind: "allowed"; reason: "label" | "before-freeze" | "term-before-freeze" }
    | { kind: "unknown"; reason: "dpe-after-increase" };

// Loi Climat et résilience, article 159: no rise for an F or G flat in a lease signed, renewed or tacitly renewed from this day.
const freezeFrom: Day = "2022-08-24";
const frozen: readonly Label[] = ["F", "G"];

export function increase(dpe: Dpe, tenancy: Tenancy, raisedOn: Day): IncreaseFinding
{
    if (dpe.establishedOn > raisedOn)
    {
        return { kind: "unknown", reason: "dpe-after-increase" };
    }

    if (!frozen.includes(dpe.label))
    {
        return { kind: "allowed", reason: "label" };
    }

    if (raisedOn < freezeFrom)
    {
        return { kind: "allowed", reason: "before-freeze" };
    }

    const term = termStarts(tenancy, raisedOn).at(-1) ?? tenancy.signedOn;
    if (term < freezeFrom)
    {
        return { kind: "allowed", reason: "term-before-freeze" };
    }

    return { kind: "forbidden", since: term };
}

// An empty flat let by a person runs for 3 years, a furnished one for 1, each renewed tacitly for the same span.
export function termStarts(tenancy: Tenancy, until: Day): Day[]
{
    const months = tenancy.furnished ? 12 : 36;
    const starts: Day[] = [];
    for (let start = tenancy.signedOn, count = 1; start <= until; start = addMonths(tenancy.signedOn, months * count++))
    {
        starts.push(start);
    }

    return starts;
}
