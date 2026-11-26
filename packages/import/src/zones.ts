import { isDay, type Day } from "@plafond/domain";

export class ZonesError extends Error
{
    constructor(problem: string)
    {
        super(`zones: ${problem}`);
        this.name = "ZonesError";
    }
}

// The version of each list the zone tables copy, and the day it took effect: a lease signed before that day falls under
// an older version, which the history tables give.
export interface ZoneList
{
    from: Day;
    title: string;
    url: string;
}

// An older version of a list, up to its last day excluded, and the column of the history table that holds it.
export interface PastList extends ZoneList
{
    until: Day;
    column: string;
}

export interface ZoneLists
{
    tense: ZoneList;
    veryTense: ZoneList;
    earlierVeryTense: ZoneList & { until: Day };  // the version of zone A bis before the current one, up to its last day excluded
    tenseHistory: PastList[];  // the versions of the list before the current one, oldest first
    veryTenseHistory: PastList[];  // the versions of zone A bis before the earlier one, oldest first
}

export function zoneListsOf(source: unknown): ZoneLists
{
    const listOf = (name: keyof ZoneLists): ZoneList =>
    {
        const list = typeof source === "object" && source !== null ? (source as Record<string, unknown>)[name] : undefined;
        const { from, title, url } = (typeof list === "object" && list !== null ? list : {}) as Record<string, unknown>;
        if (typeof from !== "string" || !isDay(from) || typeof title !== "string" || title === "" || typeof url !== "string" || !url.startsWith("https://"))
        {
            throw new ZonesError(`the ${name} list has no day it took effect, no title or no link`);
        }

        return { from, title, url };
    };

    const tense = listOf("tense");
    const veryTense = listOf("veryTense");
    const earlier = listOf("earlierVeryTense");
    const until = ((source as Record<string, Record<string, unknown>>)["earlierVeryTense"] ?? {})["until"];
    if (typeof until !== "string" || !isDay(until) || until !== veryTense.from)
    {
        throw new ZonesError("the earlier version of zone A bis does not end the day the current one starts");
    }

    const historyOf = (name: "tenseHistory" | "veryTenseHistory", next: Day): PastList[] =>
    {
        const listed = (source as Record<string, unknown>)[name];
        if (!Array.isArray(listed))
        {
            throw new ZonesError(`there is no ${name}`);
        }

        const versions = listed.map((item: unknown, index): PastList =>
        {
            const fields = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
            const { title, url, column } = fields;
            const from = fields["from"];
            const last = fields["until"];
            if (typeof from !== "string" || !isDay(from) || typeof last !== "string" || !isDay(last) || last <= from)
            {
                throw new ZonesError(`${name}, entry ${index + 1}: its days are missing or out of order`);
            }

            if (typeof title !== "string" || title === "" || typeof url !== "string" || !url.startsWith("https://") || typeof column !== "string" || column === "")
            {
                throw new ZonesError(`${name}, entry ${index + 1}: it has no title, no link or no column`);
            }

            return { from, until: last, title, url, column };
        });
        const ends = [...versions.slice(1).map((version) => version.from), next];
        if (versions.some((version, index) => version.until !== ends[index]))
        {
            throw new ZonesError(`the versions of ${name} do not follow each other up to ${next}`);
        }

        return versions;
    };

    return {
        tense,
        veryTense,
        earlierVeryTense: { ...earlier, until },
        tenseHistory: historyOf("tenseHistory", tense.from),
        veryTenseHistory: historyOf("veryTenseHistory", earlier.from),
    };
}
