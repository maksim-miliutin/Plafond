import type { FeeZone } from "@plafond/domain";

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
