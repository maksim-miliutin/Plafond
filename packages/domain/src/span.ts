import { dayBefore, type Day } from "./day.js";
import { lawOn, type LawPeriod } from "./law.js";
import type { City, Rate } from "./rates.js";

export interface Span
{
    from: Day;
    lastDay: Day;
}

export class SpanError extends Error
{
    constructor(problem: string)
    {
        super(`span: ${problem}`);
        this.name = "SpanError";
    }
}

interface Stretch
{
    from: Day;
    until: Day;
}

export function checkedSpans(city: City, rates: readonly Rate[], law: readonly LawPeriod[]): Span[]
{
    const priced = joined(rates.filter((rate) => rate.flat.city === city).map((rate) => rate.decree));
    if (priced.length === 0)
    {
        throw new SpanError(`no rent of ${city} was given`);
    }

    if (law.length === 0)
    {
        throw new SpanError("no period of the law was given");
    }

    // Not an overlap with the law periods: lawOn lets days before the law through, and the page must agree with the check.
    const edges = law.flatMap((period) => [period.from, period.until]);
    const pieces = priced.flatMap((stretch) =>
    {
        const cuts = [stretch.from, ...edges.filter((day) => stretch.from < day && day < stretch.until).sort(), stretch.until];

        return cuts.slice(1).map((until, i) => ({ from: cuts[i]!, until }));
    });
    const open = pieces.filter((piece) => !isLapsed(lawOn(piece.from, law)));
    if (open.length === 0)
    {
        throw new SpanError(`every rent of ${city} falls after the law lapsed`);
    }

    return joined(open).map((stretch) => ({ from: stretch.from, lastDay: dayBefore(stretch.until) }));
}

function isLapsed(found: ReturnType<typeof lawOn>): boolean
{
    return found !== null && "kind" in found;
}

function joined(stretches: readonly Stretch[]): Stretch[]
{
    const sorted = [...stretches].sort((a, b) => a.from.localeCompare(b.from));
    const merged: Stretch[] = [];
    for (const stretch of sorted)
    {
        const last = merged.at(-1);
        if (last === undefined || stretch.from > last.until)
        {
            merged.push({ from: stretch.from, until: stretch.until });
            continue;
        }

        merged[merged.length - 1] = { from: last.from, until: stretch.until > last.until ? stretch.until : last.until };
    }

    return merged;
}
