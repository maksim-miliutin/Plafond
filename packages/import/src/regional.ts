import type { FeeZone } from "@plafond/domain";

import { readRows } from "./csv.js";

// Part 1 of the annex to décret n° 2013-392 is the tense zone of loi n° 89-462: the shorter notice of article 15 and the
// decree on reletting rents follow it. Part 2 adds communes for the tax on empty dwellings only. Both parts make a
// commune tense for the caps on agency fees of décret n° 2014-890, which zone A bis makes very tense.
export type TensePart = 0 | 1 | 2;
export type AbcZone = "Abis" | "A" | "B1" | "B2" | "C";

export interface RegionalCommune
{
    code: string;  // INSEE code, kept as text
    name: string;
    department: string;
    grandParis: boolean;
    tensePart: TensePart;  // as the list stands since 24 December 2025, 0 when the commune is in neither part
    abcZone: AbcZone;  // since 26 June 2026
    veryTenseBefore: boolean;  // in zone A bis from 7 September 2025 to 25 June 2026
    pastTense?: readonly (TensePart | null)[];  // by the older versions of the list, as ZoneLists.tenseHistory orders them
    pastVeryTense?: readonly (boolean | null)[];  // by the older versions of zone A bis; null where the commune merged parts apart
}

export class RegionalError extends Error
{
    constructor(problem: string)
    {
        super(`regional zones: ${problem}`);
        this.name = "RegionalError";
    }
}

const header = "code;nom;departement;grand_paris;tlv_part;abc_zone;a_bis_2025";
const departments = new Set(["75", "77", "78", "91", "92", "93", "94", "95"]);
const abc = new Set(["Abis", "A", "B1", "B2", "C"]);

// The communes of Île-de-France with the zones each rule reads, from the ministry's tables on data.gouv.fr.
export function regionalCommunesOf(text: string): RegionalCommune[]
{
    const [names, ...rows] = readRows(text.trimEnd() + "\n").filter((row) => row.some((field) => field !== ""));
    if (names?.join(";") !== header)
    {
        throw new RegionalError(`the first line is not ${header}`);
    }

    const seen = new Set<string>();

    return rows.map((row, index) =>
    {
        const [code = "", name = "", department = "", grandParis = "", part = "", zone = "", before = ""] = row;
        const where = `line ${index + 2}`;
        if (row.length !== 7 || !/^\d{5}$/.test(code) || name.trim() === "" || !departments.has(department) || !code.startsWith(department))
        {
            throw new RegionalError(`${where} is not a commune of Île-de-France with its code, name and department`);
        }

        if (!/^[01]$/.test(grandParis) || !/^[012]$/.test(part) || !abc.has(zone) || !/^[01]$/.test(before))
        {
            throw new RegionalError(`${where} has a flag, a part or a zone it cannot read`);
        }

        if (seen.has(code))
        {
            throw new RegionalError(`${where} gives ${code} a second time`);
        }

        seen.add(code);

        return {
            code,
            name,
            department,
            grandParis: grandParis === "1",
            tensePart: Number(part) as TensePart,
            abcZone: zone as AbcZone,
            veryTenseBefore: before === "1",
        };
    });
}

// The zone of décret n° 2014-890 by the latest versions of both lists: zone A bis first, then either part of the list.
export function latestFeeZone(commune: RegionalCommune): FeeZone
{
    if (commune.abcZone === "Abis")
    {
        return "very-tense";
    }

    return commune.tensePart === 0 ? "other" : "tense";
}

export interface ZoneHistory
{
    tense: (TensePart | null)[];
    veryTense: (boolean | null)[];
}

// The older versions of both lists for each commune, read from the two history tables by the columns the lists name.
// A commune merged since a version, whose former parts it treated apart, reads "mixed": the zone then depends on the
// former commune the dwelling stands in, so it is null.
export function zoneHistoryOf(tenseText: string, veryTenseText: string, tenseColumns: readonly string[], veryTenseColumns: readonly string[]): Map<string, ZoneHistory>
{
    const tableOf = (text: string, columns: readonly string[], read: (value: string) => TensePart | boolean | null | undefined) =>
    {
        const [names = [], ...rows] = readRows(text.trimEnd() + "\n").filter((row) => row.some((field) => field !== ""));
        const at = columns.map((column) => names.indexOf(column));
        if (names[0] !== "code" || at.some((index) => index < 0))
        {
            throw new RegionalError(`a history table lacks the columns ${columns.join(", ")}`);
        }

        return new Map(rows.map((row, index) =>
        {
            const values = at.map((column) => read(row[column] ?? ""));
            if (!/^\d[\dAB]\d{3}$/.test(row[0] ?? "") || values.some((value) => value === undefined))
            {
                throw new RegionalError(`line ${index + 2} of a history table has a code or a value it cannot read`);
            }

            return [row[0]!, values as (TensePart | boolean | null)[]];
        }));
    };
    const tense = tableOf(tenseText, tenseColumns, (value) => (/^[012]$/.test(value) ? Number(value) as TensePart : undefined));
    const veryTense = tableOf(veryTenseText, veryTenseColumns, (value) => (value === "1" ? true : value === "0" ? false : value === "mixed" ? null : undefined));
    if (tense.size !== veryTense.size || [...tense.keys()].some((code) => !veryTense.has(code)))
    {
        throw new RegionalError("the two history tables do not hold the same communes");
    }

    return new Map([...tense].map(([code, values]) => [code, { tense: values as (TensePart | null)[], veryTense: veryTense.get(code) as (boolean | null)[] }]));
}
