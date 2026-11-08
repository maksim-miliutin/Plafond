import { periods, rooms } from "./labels.js";
import type { Quartier } from "./quartier.js";
import { periodsOf, type City, type Decree, type Period, type Rate, type Rooms } from "./rates.js";

export class PackedError extends Error
{
    constructor(problem: string)
    {
        super(`packed: ${problem}`);
        this.name = "PackedError";
    }
}

// city, area, rooms, period, furnished as 1 or 0, the three rents in cents per m², the index of the decree.
type Row = [City, number, Rooms, Period, 0 | 1, number, number, number, number];

export interface Packed
{
    version: 2;
    decrees: Decree[];
    rows: Row[];
}

export function pack(rates: readonly Rate[]): Packed
{
    const decrees: Decree[] = [];
    const places = new Map<string, number>();

    const rows = rates.map(({ flat, reference, majored, minored, decree }): Row =>
    {
        let at = places.get(decree.from);
        if (at === undefined)
        {
            at = decrees.push(decree) - 1;
            places.set(decree.from, at);
        }

        return [flat.city, flat.quartier, flat.rooms, flat.period, flat.furnished ? 1 : 0, reference, majored, minored, at];
    });

    return { version: 2, decrees, rows };
}

export function unpack(source: unknown): Rate[]
{
    if (!isTable(source))
    {
        throw new PackedError("this is not a packed rates table of version 2");
    }

    return source.rows.map((row, index) =>
    {
        if (!isRow(row) || source.decrees[row[8]] === undefined)
        {
            throw new PackedError(`row ${index} cannot be read back`);
        }

        const [city, quartier, rooms, period, furnished, reference, majored, minored, at] = row;

        return { flat: { city, quartier, rooms, period, furnished: furnished === 1 }, reference, majored, minored, decree: source.decrees[at]! };
    });
}

function isTable(source: unknown): source is { decrees: Decree[]; rows: unknown[] }
{
    return typeof source === "object"
        && source !== null
        && "version" in source
        && source.version === 2
        && "decrees" in source
        && Array.isArray(source.decrees)
        && "rows" in source
        && Array.isArray(source.rows);
}

function isRow(row: unknown): row is Row
{
    if (!Array.isArray(row) || row.length !== 9)
    {
        return false;
    }

    const [city, quartier, room, period, furnished, ...rest] = row;

    return typeof city === "string"
        && Object.hasOwn(periodsOf, city)
        && Number.isInteger(quartier)
        && typeof room === "number"
        && Object.hasOwn(rooms, String(room))
        && typeof period === "string"
        && Object.hasOwn(periods, period)
        && (furnished === 0 || furnished === 1)
        && rest.every((value) => Number.isInteger(value));
}

export interface PackedQuartiers
{
    version: 1;
    quartiers: Quartier[];
}

export function packQuartiers(quartiers: readonly Quartier[]): PackedQuartiers
{
    return { version: 1, quartiers: [...quartiers] };
}

export function unpackQuartiers(source: unknown): Quartier[]
{
    if (typeof source !== "object" || source === null || !("version" in source) || source.version !== 1
        || !("quartiers" in source) || !Array.isArray(source.quartiers))
    {
        throw new PackedError("these are not packed outlines of version 1");
    }

    return source.quartiers.map((quartier: unknown, index: number) =>
    {
        if (!isQuartier(quartier))
        {
            throw new PackedError(`quartier ${index} cannot be read back`);
        }

        return quartier;
    });
}

function isQuartier(value: unknown): value is Quartier
{
    if (typeof value !== "object" || value === null || !("number" in value) || !("name" in value) || !("rings" in value))
    {
        return false;
    }

    const ringsRead = Array.isArray(value.rings) && value.rings.every((ring: unknown) =>
        Array.isArray(ring) && ring.every((at: unknown) =>
            Array.isArray(at) && at.length === 2 && at.every((degrees: unknown) => Number.isFinite(degrees))));

    return Number.isInteger(value.number) && typeof value.name === "string" && value.name !== "" && ringsRead;
}
