import { isDay, type RelocationPeriod } from "@plafond/domain";

export class RelocationRulesError extends Error
{
    constructor(problem: string)
    {
        super(`relocation rules: ${problem}`);
        this.name = "RelocationRulesError";
    }
}

// The leases each yearly version of décret n° 2017-1198 covers, with the decree that set it: from the first day signed,
// up to the last one excluded.
export function relocationRulesOf(source: unknown): RelocationPeriod[]
{
    const listed = typeof source === "object" && source !== null ? (source as Record<string, unknown>)["periods"] : undefined;
    if (!Array.isArray(listed))
    {
        throw new RelocationRulesError("there is no list of periods");
    }

    const periods = listed.map((item: unknown, index) =>
    {
        const { from, until, title, url } = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
        if (typeof from !== "string" || !isDay(from) || typeof until !== "string" || !isDay(until))
        {
            throw new RelocationRulesError(`entry ${index + 1}: a day it starts or ends is missing or not a calendar day`);
        }

        if (until <= from)
        {
            throw new RelocationRulesError(`entry ${index + 1}: it ends on ${until}, no later than it starts`);
        }

        if (typeof title !== "string" || title === "" || typeof url !== "string" || !url.startsWith("https://"))
        {
            throw new RelocationRulesError(`entry ${index + 1}: it has no title or no secure link to its source`);
        }

        return { from, until, title, url };
    }).sort((a, b) => a.from.localeCompare(b.from));

    for (const [index, period] of periods.slice(1).entries())
    {
        if (period.from < periods[index]!.until)
        {
            throw new RelocationRulesError(`${period.title} overlaps ${periods[index]!.title}`);
        }
    }

    return periods;
}
