import { arrondissementOf, type Quartier } from "@plafond/domain";

export class QuartiersError extends Error
{
    constructor(problem: string)
    {
        super(`quartiers: ${problem}`);
        this.name = "QuartiersError";
    }
}

type Fields = Record<string, unknown>;
type Position = [number, number];

const count = 80;
const places = 6;  // decimals of a degree kept: about a tenth of a metre in Paris

export function quartiersOf(source: unknown): Quartier[]
{
    if (!isFields(source) || source.type !== "FeatureCollection" || !Array.isArray(source.features))
    {
        throw new QuartiersError("the outlines are not a GeoJSON feature collection");
    }

    const quartiers = source.features.map((item: unknown, index: number) => quartierOf(item, index));
    const seen = new Set<number>();
    for (const quartier of quartiers)
    {
        if (seen.has(quartier.number))
        {
            throw new QuartiersError(`quartier ${quartier.number} appears twice`);
        }

        seen.add(quartier.number);
    }

    if (quartiers.length !== count)
    {
        throw new QuartiersError(`expected ${count} quartiers, found ${quartiers.length}`);
    }

    return [...quartiers].sort((a, b) => a.number - b.number);
}

function quartierOf(item: unknown, index: number): Quartier
{
    const fields = isFields(item) && isFields(item.properties) ? item.properties : null;
    const geometry = isFields(item) && isFields(item.geometry) ? item.geometry : null;
    if (fields === null || geometry === null)
    {
        throw new QuartiersError(`feature ${index} has no properties or no geometry`);
    }

    const number = Number(fields.c_qu);
    if (!Number.isInteger(number) || number < 1 || number > count || typeof fields.l_qu !== "string" || fields.l_qu === "")
    {
        throw new QuartiersError(`feature ${index} has no quartier number from 1 to ${count} or no name`);
    }

    if (Number(fields.c_ar) !== arrondissementOf(number))
    {
        throw new QuartiersError(`quartier ${number} is filed under arrondissement ${String(fields.c_ar)}`);
    }

    return { number, name: fields.l_qu, rings: ringsOf(geometry, number) };
}

function ringsOf(geometry: Fields, number: number): Position[][]
{
    const pieces = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : null;
    if (!Array.isArray(pieces) || !pieces.every((piece) => Array.isArray(piece)))
    {
        throw new QuartiersError(`quartier ${number} is neither a polygon nor a multipolygon`);
    }

    return (pieces as unknown[][]).flat().map((ring) =>
    {
        if (!Array.isArray(ring) || !ring.every(isPosition))
        {
            throw new QuartiersError(`quartier ${number} has a ring that is not a list of positions`);
        }

        return ring.map(([lon, lat]: Position): Position => [rounded(lon), rounded(lat)]);
    });
}

function isPosition(value: unknown): value is Position
{
    return Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1]);
}

function rounded(degrees: number): number
{
    return Math.round(degrees * 10 ** places) / 10 ** places;
}

function isFields(value: unknown): value is Fields
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
