import type { Decree, Rate } from "@plafond/domain";

import { annexRates } from "./annex.js";
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
