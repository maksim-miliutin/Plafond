import { periods, rooms } from "./labels.js";
import type { Decree, Period, Rate, Rooms } from "./rates.js";

export class PackedError extends Error
{
    constructor(problem: string)
    {
        super(`packed: ${problem}`);
        this.name = "PackedError";
    }
}

// quartier, rooms, period, furnished as 1 or 0, the three rents in cents per m², the index of the decree.
type Row = [number, Rooms, Period, 0 | 1, number, number, number, number];

export interface Packed
{
    version: 1;
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

        return [flat.quartier, flat.rooms, flat.period, flat.furnished ? 1 : 0, reference, majored, minored, at];
    });

    return { version: 1, decrees, rows };
}

export function unpack(source: unknown): Rate[]
{
    if (!isTable(source))
    {
        throw new PackedError("this is not a packed rates table of version 1");
    }

    return source.rows.map((row, index) =>
    {
        if (!isRow(row) || source.decrees[row[7]] === undefined)
        {
            throw new PackedError(`row ${index} cannot be read back`);
        }

        const [quartier, rooms, period, furnished, reference, majored, minored, at] = row;

        return { flat: { quartier, rooms, period, furnished: furnished === 1 }, reference, majored, minored, decree: source.decrees[at]! };
    });
}

function isTable(source: unknown): source is { decrees: Decree[]; rows: unknown[] }
{
    return typeof source === "object"
        && source !== null
        && "version" in source
        && source.version === 1
        && "decrees" in source
        && Array.isArray(source.decrees)
        && "rows" in source
        && Array.isArray(source.rows);
}

function isRow(row: unknown): row is Row
{
    if (!Array.isArray(row) || row.length !== 8)
    {
        return false;
    }

    const [quartier, room, period, furnished, ...rest] = row;

    return Number.isInteger(quartier)
        && typeof room === "number"
        && Object.hasOwn(rooms, String(room))
        && typeof period === "string"
        && Object.hasOwn(periods, period)
        && (furnished === 0 || furnished === 1)
        && rest.every((value) => Number.isInteger(value));
}
