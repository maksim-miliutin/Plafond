import { dayBefore, type Day } from "./day.js";

export interface LawPeriod
{
    from: Day;
    until: Day;  // the first day the law no longer covers
    title: string;
    url: string;
}

export interface Lapsed
{
    kind: "lapsed";
    lastDay: Day;
    title: string;
    url: string;
}

export class LawError extends Error
{
    constructor(problem: string)
    {
        super(`law: ${problem}`);
        this.name = "LawError";
    }
}

export function lawOn(on: Day, law: readonly LawPeriod[]): LawPeriod | Lapsed | null
{
    if (law.length === 0)
    {
        throw new LawError("no period of the law was given");
    }

    const latest = law.filter((period) => period.from <= on).sort((a, b) => a.from.localeCompare(b.from)).at(-1);
    if (latest === undefined)
    {
        // Before the law there is nothing to lapse: the decree table tells when control began.
        return null;
    }

    if (on < latest.until)
    {
        return latest;
    }

    return { kind: "lapsed", lastDay: dayBefore(latest.until), title: latest.title, url: latest.url };
}
