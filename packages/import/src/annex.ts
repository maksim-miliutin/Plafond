import type { Decree, Period, Rate, Rooms } from "@plafond/domain";

import { readRows } from "./csv.js";

export class AnnexError extends Error
{
    constructor(problem: string)
    {
        super(`annex: ${problem}`);
        this.name = "AnnexError";
    }
}

interface Rents
{
    reference: number;
    majored: number;
    minored: number;
}

interface Category
{
    sector: number;
    rooms: Rooms;
    period: Period;
    empty: Rents;
    furnished: Rents;
}

const quartiers = 80;
const categories = 16;

const rooms = new Map<string, Rooms>([["1", 1], ["2", 2], ["3", 3], ["4 et +", 4]]);

const periods = new Map<string, Period>([
    ["< 1946", "before-1946"],
    ["1946-1970", "1946-1970"],
    ["1971-1990", "1971-1990"],
    ["> 1990", "after-1990"],
]);

export function annexRates(annex: string, sectors: string, decree: Decree): Rate[]
{
    const priced = categoriesOf(annex);
    const placed = sectorsOf(sectors);

    return [...placed].flatMap(([quartier, sector]) =>
    {
        const own = priced.filter((category) => category.sector === sector);
        if (own.length !== categories)
        {
            throw new AnnexError(`quartier ${quartier} lies in sector ${sector}, which the annex prices in ${own.length} categories`);
        }

        return own.flatMap(({ rooms: count, period, empty, furnished }) => [
            { flat: { quartier, rooms: count, period, furnished: false }, ...empty, decree },
            { flat: { quartier, rooms: count, period, furnished: true }, ...furnished, decree },
        ]);
    });
}

function categoriesOf(annex: string): Category[]
{
    const seen = new Set<string>();

    return rowsAfterHeader(annex).map((fields, line): Category =>
    {
        const [sector, count, built, ...prices] = fields;
        const parsed = { sector: Number(sector), rooms: rooms.get(count ?? ""), period: periods.get(built ?? "") };
        if (!Number.isInteger(parsed.sector) || parsed.rooms === undefined || parsed.period === undefined || prices.length !== 7)
        {
            throw new AnnexError(`line ${line + 2} is not a sector, a number of rooms, a period and seven rents`);
        }

        const key = `${parsed.sector} ${parsed.rooms} ${parsed.period}`;
        if (seen.has(key))
        {
            throw new AnnexError(`line ${line + 2} prices sector ${parsed.sector}, ${count} rooms, ${built} a second time`);
        }

        seen.add(key);

        const [emptyMinored, emptyReference, emptyMajored, supplement, furnishedMinored, furnishedReference, furnishedMajored] =
            prices.map((price) => tenthsOf(price, line)) as [number, number, number, number, number, number, number];
        if (emptyReference + supplement !== furnishedReference)
        {
            throw new AnnexError(`line ${line + 2}: the furnished reference is not the empty one plus the supplement`);
        }

        const empty = rentsOf(emptyReference, emptyMajored, emptyMinored, line);
        const furnished = rentsOf(furnishedReference, furnishedMajored, furnishedMinored, line);

        return { sector: parsed.sector, rooms: parsed.rooms, period: parsed.period, empty, furnished };
    });
}

// The decree sets the majored rent 20 percent above the reference and the reduced one 30 percent below, printed to the tenth.
function rentsOf(reference: number, majored: number, minored: number, line: number): Rents
{
    if (Math.abs(majored * 100 - reference * 120) > 50)
    {
        throw new AnnexError(`line ${line + 2}: the majored rent is not the reference plus 20 percent`);
    }

    if (Math.abs(minored * 100 - reference * 70) > 50)
    {
        throw new AnnexError(`line ${line + 2}: the reduced rent is not the reference minus 30 percent`);
    }

    return { reference: reference * 10, majored: majored * 10, minored: minored * 10 };
}

function sectorsOf(sectors: string): Map<number, number>
{
    const placed = new Map<number, number>();
    for (const [number, , sector] of rowsAfterHeader(sectors))
    {
        const quartier = Number(number);
        if (!Number.isInteger(quartier) || quartier < 1 || quartier > quartiers || placed.has(quartier) || !Number.isInteger(Number(sector)))
        {
            throw new AnnexError(`quartier ${number} is not a quartier from 1 to ${quartiers} given once with its sector`);
        }

        placed.set(quartier, Number(sector));
    }

    if (placed.size !== quartiers)
    {
        throw new AnnexError(`the sectors place ${placed.size} quartiers, not ${quartiers}`);
    }

    return placed;
}

function tenthsOf(price: string, line: number): number
{
    const match = /^(\d+),(\d)$/.exec(price);
    if (match === null)
    {
        throw new AnnexError(`line ${line + 2}: ${price} is not a rent in euros and tenths`);
    }

    return Number(match[1]) * 10 + Number(match[2]);
}

function rowsAfterHeader(text: string): string[][]
{
    return readRows(text.trimEnd() + "\n").slice(1).filter((row) => row.some((field) => field !== ""));
}
