import type { Decree, Quartier, Rate } from "@plafond/domain";

import { annexRates } from "./annex.js";
import { lyonOutlines, lyonRates, lyonTable } from "./lyon.js";
import { parseParis } from "./paris.js";

export class SeedError extends Error
{
    constructor(problem: string)
    {
        super(`seed: ${problem}`);
        this.name = "SeedError";
    }
}

export interface ParisSeed
{
    table: string;
    annex: string;
    sectors: string;
    decrees: ReadonlyMap<number, Decree>;
}

// The City's open table ends with 2025, so the 2026 rents are read from the decree's own annexes.
const annexYear = 2026;

export function parisRates({ table, annex, sectors, decrees }: ParisSeed): Rate[]
{
    const decree = decrees.get(annexYear);
    if (decree === undefined)
    {
        throw new SeedError(`the decrees list none for ${annexYear}, the year the annex prices`);
    }

    return [...parseParis(table, decrees), ...annexRates(annex, sectors, decree)];
}

export interface LyonSeed
{
    tables: ReadonlyMap<number, string>;  // the year a decree starts, to the file published for it
    decrees: ReadonlyMap<number, Decree>;
}

export interface LyonRates
{
    rates: Rate[];
    outlines: Quartier[];
    zoning: ReadonlyMap<number, number>;  // IRIS to zone, in the latest year
}

export function lyonSeed({ tables, decrees }: LyonSeed): LyonRates
{
    const read = [...tables].sort(([a], [b]) => a - b).map(([year, text]) =>
    {
        const decree = decrees.get(year);
        if (decree === undefined)
        {
            throw new SeedError(`the Lyon table for ${year} has no decree`);
        }

        return { table: lyonTable(text), decree };
    });
    const drawn = [...read].reverse().find(({ table }) => table.rings !== null);
    if (drawn === undefined)
    {
        throw new SeedError("no Lyon table draws the outlines");
    }

    return {
        rates: read.flatMap(({ table, decree }) => lyonRates(table, decree)),
        outlines: lyonOutlines(drawn.table),
        zoning: read.at(-1)!.table.zones,
    };
}

