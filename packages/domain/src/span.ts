import { dayBefore, type Day } from "./day.js";
import type { LawPeriod } from "./law.js";
import { controlledSince, type City, type Decree } from "./rates.js";

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

export function checkedSpan(city: City, decrees: readonly Decree[], law: readonly LawPeriod[]): Span
{
    if (decrees.length === 0)
    {
        throw new SpanError(`no decree of ${city} was given`);
    }

    if (law.length === 0)
    {
        throw new SpanError("no period of the law was given");
    }

    const decreesEnd = latest(decrees.map((decree) => decree.until));
    const lawEnd = latest(law.map((period) => period.until));

    return { from: controlledSince[city], lastDay: dayBefore(decreesEnd < lawEnd ? decreesEnd : lawEnd) };
}

function latest(days: readonly Day[]): Day
{
    return [...days].sort().at(-1)!;
}
