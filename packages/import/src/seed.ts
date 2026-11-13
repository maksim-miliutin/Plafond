import type { Decree, Quartier, Rate } from "@plafond/domain";

import { annexRates, lyonAnnexRates, lyonSectors } from "./annex.js";
import { decreesOf } from "./decrees.js";
import { lyonOutlines, lyonRates, lyonTable } from "./lyon.js";
import { parseParis } from "./paris.js";
import { quartiersOf } from "./quartiers.js";

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
    annexes: ReadonlyMap<number, LyonAnnex>;
    decrees: ReadonlyMap<number, Decree>;
}

export interface LyonAnnex
{
    annex: string;    // the decree's rents, in the layout of the Paris annex
    sectors: string;  // each IRIS with the sector the decree's maps give it
}

export interface LyonRates
{
    rates: Rate[];
    outlines: Quartier[];
    zoning: ReadonlyMap<number, number>;  // IRIS to zone, in the latest year
}

interface LyonYear
{
    year: number;
    zones: ReadonlyMap<number, number>;
    rates: Rate[];
}

export function lyonSeed({ tables, annexes, decrees }: LyonSeed): LyonRates
{
    const decreeOf = (year: number) =>
    {
        const decree = decrees.get(year);
        if (decree === undefined)
        {
            throw new SeedError(`the Lyon rents for ${year} have no decree`);
        }

        return decree;
    };

    const read = [...tables].map(([year, text]) => ({ year, table: lyonTable(text), decree: decreeOf(year) })).sort((a, b) => a.year - b.year);
    const drawn = [...read].reverse().find(({ table }) => table.rings !== null);
    if (drawn === undefined)
    {
        throw new SeedError("no Lyon table draws the outlines");
    }

    const doubled = [...annexes.keys()].find((year) => tables.has(year));
    if (doubled !== undefined)
    {
        throw new SeedError(`${doubled} is given both as a published table and as the decree's annex`);
    }

    const located = new Set(drawn.table.rings!.keys());
    const annexed = [...annexes].map(([year, { annex, sectors }]) => ({ year, annex, zones: lyonSectors(sectors) }));
    const misplaced = annexed.find(({ zones }) => zones.size !== located.size || [...zones.keys()].some((iris) => !located.has(iris)));
    if (misplaced !== undefined)
    {
        throw new SeedError(`the ${misplaced.year} sectors do not place exactly the IRIS the outlines draw`);
    }

    const years: LyonYear[] = [
        ...read.map(({ year, table, decree }) => ({ year, zones: table.zones, rates: lyonRates(table, decree) })),
        ...annexed.map(({ year, annex, zones }) => ({ year, zones, rates: lyonAnnexRates(annex, zones, decreeOf(year)) })),
    ].sort((a, b) => a.year - b.year);

    return {
        rates: years.flatMap(({ rates }) => rates),
        outlines: lyonOutlines(drawn.table),
        zoning: years.at(-1)!.zones,
    };
}

export interface Seeds
{
    paris: Rate[];
    quartiers: Quartier[];
    lyon: LyonRates;
}

const lyonTables = new Map([
    [2022, "lyon-2022-2023.csv"],
    [2023, "lyon-2023-2024.geojson"],
    [2024, "lyon-2024-2025.geojson"],
    [2025, "lyon-2025-2026.csv"],
]);

// The Métropole has not published the rents from 1 November 2026 yet, so they are copied from the decree's annexes.
const lyonAnnexes = new Map([[2026, { annex: "lyon-annex-2026.csv", sectors: "lyon-sectors-2026.csv" }]]);

export function seedsFrom(read: (name: string) => string): Seeds
{
    return {
        paris: parisRates({
            table: read("paris-rates.csv"),
            annex: read("paris-annex-2026.csv"),
            sectors: read("paris-sectors-2026.csv"),
            decrees: decreesOf(JSON.parse(read("paris-decrees.json"))),
        }),
        quartiers: quartiersOf(JSON.parse(read("paris-quartiers.json"))),
        lyon: lyonSeed({
            tables: new Map([...lyonTables].map(([year, name]) => [year, read(name)])),
            annexes: new Map([...lyonAnnexes].map(([year, files]) => [year, { annex: read(files.annex), sectors: read(files.sectors) }])),
            decrees: decreesOf(JSON.parse(read("lyon-decrees.json"))),
        }),
    };
}
