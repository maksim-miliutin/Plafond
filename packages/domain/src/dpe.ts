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
    company: boolean;
    on: Day;
}

export type DecencyFinding =
    | { kind: "not-decent"; since: Day }
    | { kind: "from"; on: Day }
    | { kind: "decent" };

export type IncreaseFinding =
    | { kind: "forbidden"; since: Day }
    | { kind: "allowed"; reason: "label" | "before-freeze" | "term-before-freeze" }
    | { kind: "unknown"; reason: "dpe-after-increase" };

// Loi Climat et résilience, article 159: no rise for an F or G flat in a lease signed, renewed or tacitly renewed from this day.
export const freezeFrom: Day = "2022-08-24";

// Loi du 16 août 2022 pour le pouvoir d'achat: no complement may be applied to an F or G flat in a lease signed from this day.
export const noComplementFrom: Day = "2022-08-18";
const frozen: readonly Label[] = ["F", "G"];

// Loi Climat et résilience, article 160: a flat of these classes is no longer decent in a lease signed or renewed from these days.
const undecent: readonly { label: Label; from: Day }[] = [
    { label: "G", from: "2025-01-01" },
    { label: "F", from: "2028-01-01" },
    { label: "E", from: "2034-01-01" },
];

export function undecentFrom(label: Label): Day | null
{
    return undecent.find((row) => row.label === label)?.from ?? null;
}

export function decency(dpe: Dpe, tenancy: Tenancy): DecencyFinding
{
    const from = undecentFrom(dpe.label);
    if (from === null)
    {
        return { kind: "decent" };
    }

    const reached = termStarts(tenancy, tenancy.on).find((start) => start >= from);
    if (reached !== undefined)
    {
        return { kind: "not-decent", since: reached };
    }

    return { kind: "from", on: firstTermFrom(tenancy, from) };
}

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

function termStarts(tenancy: Tenancy, until: Day): Day[]
{
    const starts: Day[] = [];
    for (let count = 0; termStart(tenancy, count) <= until; count++)
    {
        starts.push(termStart(tenancy, count));
    }

    return starts;
}

function firstTermFrom(tenancy: Tenancy, from: Day): Day
{
    let count = 0;
    while (termStart(tenancy, count) < from)
    {
        count++;
    }

    return termStart(tenancy, count);
}

// An empty flat runs for 3 years when a person lets it and 6 when a company does, a furnished one for 1; each renews for the same span.
function termStart(tenancy: Tenancy, count: number): Day
{
    const months = tenancy.furnished ? 12 : tenancy.company ? 72 : 36;

    return addMonths(tenancy.signedOn, months * count);
}
