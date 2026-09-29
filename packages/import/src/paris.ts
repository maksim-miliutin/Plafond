import type { Decree, Flat, Period, Rate, Rooms } from "@plafond/domain";

import { readRows } from "./csv.js";

export class ParisError extends Error
{
    constructor(problem: string)
    {
        super(`paris: ${problem}`);
        this.name = "ParisError";
    }
}

const columns = {
    year: "Année",
    quartier: "Numéro du quartier",
    rooms: "Nombre de pièces principales",
    period: "Epoque de construction",
    letting: "Type de location",
    reference: "Loyers de référence",
    majored: "Loyers de référence majorés",
    minored: "Loyers de référence minorés",
} as const;

type Fields = Record<keyof typeof columns, string>;

// Paris is cut into 80 administrative quartiers, numbered 1 to 80 across the arrondissements.
const quartiers = 80;

const rooms = new Map<string, Rooms>([["1", 1], ["2", 2], ["3", 3], ["4", 4]]);

const periods = new Map<string, Period>([
    ["Avant 1946", "before-1946"],
    ["1946-1970", "1946-1970"],
    ["1971-1990", "1971-1990"],
    ["Apres 1990", "after-1990"],
]);

const lettings = new Map<string, boolean>([["meublé", true], ["non meublé", false]]);

const perYear = quartiers * rooms.size * periods.size * lettings.size;

export function parseParis(table: string, decrees: ReadonlyMap<number, Decree>): Rate[]
{
    const [head, ...body] = readRows(table);
    if (head === undefined)
    {
        throw new ParisError("the table is empty");
    }

    const read = reader(head);
    const seen = new Map<string, Set<string>>();
    const rates: Rate[] = [];

    for (const [index, cells] of body.entries())
    {
        const row = index + 2;
        const fields = read(cells);
        const rate = rateOf(fields, row, decrees);

        const flats = seen.get(fields.year) ?? new Set<string>();
        const key = JSON.stringify(rate.flat);
        if (flats.has(key))
        {
            throw new ParisError(`row ${row}: a second rate for ${describe(rate.flat)} in ${fields.year}`);
        }

        seen.set(fields.year, flats.add(key));
        rates.push(rate);
    }

    for (const [year, flats] of seen)
    {
        if (flats.size !== perYear)
        {
            throw new ParisError(`${year} has ${flats.size} rates where ${perYear} are expected`);
        }
    }

    return rates;
}

function reader(head: readonly string[]): (cells: readonly string[]) => Fields
{
    const missing = Object.values(columns).filter((name) => !head.includes(name));
    if (missing.length > 0)
    {
        throw new ParisError(`the table lacks the columns ${missing.join(", ")}`);
    }

    const position = (name: string) => head.indexOf(name);
    const at = Object.fromEntries(Object.entries(columns).map(([field, name]) => [field, position(name)]));

    return (cells) => Object.fromEntries(Object.entries(at).map(([field, index]) => [field, cells[index] ?? ""])) as Fields;
}

function rateOf(fields: Fields, row: number, decrees: ReadonlyMap<number, Decree>): Rate
{
    const decree = decrees.get(Number(fields.year));
    if (decree === undefined)
    {
        throw new ParisError(`row ${row}: no decree for the year "${fields.year}"`);
    }

    return {
        flat: {
            quartier: quartierOf(fields.quartier, row),
            rooms: labelled(rooms, fields.rooms, row),
            period: labelled(periods, fields.period, row),
            furnished: labelled(lettings, fields.letting, row),
        },
        reference: cents(fields.reference, row),
        majored: cents(fields.majored, row),
        minored: cents(fields.minored, row),
        decree,
    };
}

function quartierOf(text: string, row: number): number
{
    const quartier = /^\d+$/.test(text) ? Number(text) : 0;
    if (quartier < 1 || quartier > quartiers)
    {
        throw new ParisError(`row ${row}: "${text}" is not a quartier from 1 to ${quartiers}`);
    }

    return quartier;
}

function labelled<T>(known: ReadonlyMap<string, T>, label: string, row: number): T
{
    const value = known.get(label);
    if (value === undefined)
    {
        throw new ParisError(`row ${row}: unknown value "${label}"`);
    }

    return value;
}

// Read as text on purpose: 35.3 times 100 in floating point is 3529.999...,
// and cutting it to a whole number loses a cent.
function cents(text: string, row: number): number
{
    const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text);
    if (match === null)
    {
        throw new ParisError(`row ${row}: "${text}" is not a rent in euros and cents`);
    }

    return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

function describe(flat: Flat): string
{
    const letting = flat.furnished ? "furnished" : "unfurnished";

    return `quartier ${flat.quartier}, ${flat.rooms} rooms, ${flat.period}, ${letting}`;
}
