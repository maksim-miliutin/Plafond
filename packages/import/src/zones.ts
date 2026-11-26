import { isDay, type Day, type FeeZone } from "@plafond/domain";

import { readRows } from "./csv.js";

// The zone of a commune as the rules a tenant meets there read it: the list of décret n° 2013-392 makes it tense, and
// zone A bis of the arrêté of 1 August 2014 makes it very tense for the caps on agency fees of décret n° 2014-890.
export interface CommuneZone
{
    code: string;  // INSEE code, kept as text
    name: string;
    zone: FeeZone;
}

export class ZonesError extends Error
{
    constructor(problem: string)
    {
        super(`zones: ${problem}`);
        this.name = "ZonesError";
    }
}

const header = "code;nom;tendue;tres_tendue";
const flag = /^[01]$/;

export function zonesOf(text: string): CommuneZone[]
{
    const [names, ...rows] = readRows(text.trimEnd() + "\n").filter((row) => row.some((field) => field !== ""));
    if (names?.join(";") !== header)
    {
        throw new ZonesError(`the first line is not ${header}`);
    }

    const seen = new Set<string>();

    return rows.map((row, index) =>
    {
        const [code = "", name = "", tense = "", veryTense = ""] = row;
        const where = `line ${index + 2}`;
        if (row.length !== 4 || !/^\d[\dAB]\d{3}$/.test(code) || name.trim() === "" || !flag.test(tense) || !flag.test(veryTense))
        {
            throw new ZonesError(`${where} is not a commune's code, its name and two flags of 0 or 1`);
        }

        if (seen.has(code))
        {
            throw new ZonesError(`${where} gives ${code} a second time`);
        }

        // In both métropoles every commune of zone A bis is also on the décret's list, so a row that says otherwise is a slip.
        if (veryTense === "1" && tense === "0")
        {
            throw new ZonesError(`${where} puts ${name} in zone A bis but outside the tense zone`);
        }

        seen.add(code);

        return { code, name, zone: veryTense === "1" ? "very-tense" : tense === "1" ? "tense" : "other" };
    });
}

// The version of each list that commune-zones.csv copies, and the day it took effect: a lease signed before that day may
// have fallen under another version, so the zone is not filled in for it.
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
