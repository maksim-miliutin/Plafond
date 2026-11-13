import type { Decree, Period, Quartier, Rate, Rooms } from "@plafond/domain";

import { readRows } from "./csv.js";

type Position = [number, number];

interface Rents
{
    reference: number;
    majored: number;
    minored: number;
}

export interface LyonTable
{
    zones: Map<number, number>;  // IRIS code to zone, for the year of the file
    values: Map<number, unknown>;  // zone to its published rents, as the file nests them
    communes: Map<number, string>;
    rings: Map<number, Position[][]> | null;  // the earliest file draws no outline
}

export class LyonError extends Error
{
    constructor(problem: string)
    {
        super(`lyon: ${problem}`);
        this.name = "LyonError";
    }
}

export const lyonRooms: Readonly<Record<string, Rooms>> = { "1": 1, "2": 2, "3": 3, "4 et plus": 4 };
export const lyonPeriods: Readonly<Record<string, Period>> = {
    "avant 1946": "before-1946",
    "1946-1970": "1946-1970",
    "1971-1990": "1971-1990",
    "1991-2005": "1991-2005",
    "après 2005": "after-2005",
};
const lettings: Record<string, boolean> = { "non meuble": false, "meuble": true };

// The Métropole publishes each year in a different shape: GeoJSON, a CSV of JSON, and first a semicolon CSV of Python dicts.
export function lyonTable(text: string): LyonTable
{
    const body = text.replace(/^\uFEFF/, "");
    const rows = body.trimStart().startsWith("{") ? featuresOf(body) : rowsOf(body);
    const table: LyonTable = { zones: new Map(), values: new Map(), communes: new Map(), rings: rows.every((row) => row.rings !== null) ? new Map() : null };

    for (const row of rows)
    {
        const known = table.values.get(row.zone);
        if (known !== undefined && JSON.stringify(known) !== JSON.stringify(row.values))
        {
            throw new LyonError(`IRIS ${row.iris} gives zone ${row.zone} other rents than the IRIS before it`);
        }

        table.zones.set(row.iris, row.zone);
        table.values.set(row.zone, row.values);
        table.communes.set(row.iris, row.commune);
        if (table.rings !== null && row.rings !== null)
        {
            table.rings.set(row.iris, row.rings);
        }
    }

    return table;
}

export function lyonRates(table: LyonTable, decree: Decree): Rate[]
{
    return [...table.zones].flatMap(([iris, zone]) =>
    {
        const nested = table.values.get(zone);

        return Object.entries(lyonRooms).flatMap(([size, rooms]) =>
            Object.entries(lyonPeriods).flatMap(([age, period]) =>
                Object.entries(lettings).map(([letting, furnished]) => ({
                    flat: { city: "lyon" as const, quartier: iris, rooms, period, furnished },
                    ...rentsAt(nested, [size, age, letting], iris),
                    decree,
                }))));
    });
}

export function lyonOutlines(table: LyonTable): Quartier[]
{
    if (table.rings === null)
    {
        throw new LyonError("this year's file draws no outline; take them from a later year");
    }

    return [...table.rings].map(([iris, rings]) => ({ number: iris, name: table.communes.get(iris)!, rings }));
}

interface Row
{
    iris: number;
    zone: number;
    commune: string;
    values: unknown;
    rings: Position[][] | null;
}

function featuresOf(text: string): Row[]
{
    const collection = JSON.parse(text) as { features?: { properties?: Record<string, unknown>; geometry?: { type?: string; coordinates?: unknown } }[] };
    if (!Array.isArray(collection.features))
    {
        throw new LyonError("this GeoJSON holds no features");
    }

    return collection.features.map((feature) =>
    {
        const properties = feature.properties ?? {};
        const geometry = feature.geometry;
        if (geometry?.type !== "Polygon")
        {
            throw new LyonError(`IRIS ${String(properties.codeiris)} is drawn as ${String(geometry?.type)}, not a polygon`);
        }

        return rowFrom(properties.codeiris, properties.zonage, properties.commune, properties.valeurs, geometry.coordinates as Position[][]);
    });
}

function rowsOf(text: string): Row[]
{
    const header = text.slice(0, text.indexOf("\n"));
    const separator = header.split(";").length > header.split(",").length ? ";" : ",";

    const [names = [], ...lines] = readRows(text, separator).filter((line) => line.some((field) => field !== ""));
    const at = (line: readonly string[], name: string) => line[names.indexOf(name)];

    return lines.map((line) =>
    {
        const outline = at(line, "the_geom");

        return rowFrom(at(line, "codeiris"), at(line, "zonage"), at(line, "commune"), at(line, "valeurs"), outline === undefined ? null : ringsOf(outline));
    });
}

function rowFrom(iris: unknown, zone: unknown, commune: unknown, values: unknown, rings: Position[][] | null): Row
{
    const code = Number(iris);
    const area = Number(zone);
    if (!Number.isInteger(code) || !Number.isInteger(area) || typeof commune !== "string")
    {
        throw new LyonError(`a row names IRIS "${String(iris)}" in zone "${String(zone)}" of "${String(commune)}"`);
    }

    return { iris: code, zone: area, commune, values: typeof values === "string" ? JSON.parse(values.replace(/'/g, "\"")) : values, rings };
}

function ringsOf(wkt: string): Position[][]
{
    const inner = /^POLYGON\s*\(\((.*)\)\)$/s.exec(wkt.trim());
    if (inner === null)
    {
        throw new LyonError(`an outline is not a WKT polygon: ${wkt.slice(0, 40)}`);
    }

    return inner[1]!.split(/\)\s*,\s*\(/).map((ring) => ring.split(",").map((pair) => pair.trim().split(/\s+/).map(Number) as Position));
}

function rentsAt(nested: unknown, path: readonly string[], iris: number): Rents
{
    const leaf = path.reduce<unknown>((node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined), nested);
    const read = (key: string) => (typeof leaf === "object" && leaf !== null ? (leaf as Record<string, unknown>)[key] : undefined);
    const [reference, majored, minored] = ["loyer_reference", "loyer_reference_majore", "loyer_reference_minore"].map(read);
    if (typeof reference !== "number" || typeof majored !== "number" || typeof minored !== "number")
    {
        throw new LyonError(`IRIS ${iris} has no rents for ${path.join(", ")}`);
    }

    return { reference: Math.round(reference * 100), majored: Math.round(majored * 100), minored: Math.round(minored * 100) };
}
