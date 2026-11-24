import type { Quartier } from "@plafond/domain";

// The outline of a commune or a département, read from the Contours administratifs of data.gouv.fr (ODbL 1.0).
export interface Contour
{
    code: string;  // INSEE code: five characters for a commune, two for a département
    name: string;
    rings: Quartier["rings"];  // outer rings and holes of every piece, as GeoJSON [lon, lat]
}

export class ContoursError extends Error
{
    constructor(problem: string)
    {
        super(`contours: ${problem}`);
        this.name = "ContoursError";
    }
}

type Fields = Record<string, unknown>;
type Position = [number, number];

const insee = /^(\d{2}|2[AB]|\d[\dAB]\d{3})$/;

// Reads a feature collection of outlines. Given the codes it must hold, refuses one that holds others or misses one.
export function contoursOf(source: unknown, expected?: readonly string[]): Contour[]
{
    if (!isFields(source) || source.type !== "FeatureCollection" || !Array.isArray(source.features))
    {
        throw new ContoursError("the outlines are not a GeoJSON feature collection");
    }

    const contours = source.features.map((item: unknown, index: number) => contourOf(item, index));
    const seen = new Set<string>();
    for (const contour of contours)
    {
        if (seen.has(contour.code))
        {
            throw new ContoursError(`${contour.code} is outlined twice`);
        }

        seen.add(contour.code);
    }

    if (expected !== undefined)
    {
        const missing = expected.filter((code) => !seen.has(code));
        const extra = [...seen].filter((code) => !expected.includes(code));
        if (missing.length > 0 || extra.length > 0)
        {
            throw new ContoursError(`the outlines miss ${missing.join(", ") || "none"} and add ${extra.join(", ") || "none"}`);
        }
    }

    return contours;
}

function contourOf(item: unknown, index: number): Contour
{
    const fields = isFields(item) && isFields(item.properties) ? item.properties : null;
    const geometry = isFields(item) && isFields(item.geometry) ? item.geometry : null;
    if (fields === null || geometry === null)
    {
        throw new ContoursError(`feature ${index} has no properties or no geometry`);
    }

    const { code, nom } = fields;
    if (typeof code !== "string" || !insee.test(code) || typeof nom !== "string" || nom.trim() === "")
    {
        throw new ContoursError(`feature ${index} has no INSEE code or no name`);
    }

    return { code, name: nom, rings: ringsOf(geometry, code) };
}

function ringsOf(geometry: Fields, code: string): Position[][]
{
    const pieces = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.type === "MultiPolygon" ? geometry.coordinates : null;
    if (!Array.isArray(pieces) || pieces.length === 0 || !pieces.every((piece) => Array.isArray(piece) && piece.length > 0))
    {
        throw new ContoursError(`${code} is neither a polygon nor a multipolygon`);
    }

    return (pieces as unknown[][]).flat().map((ring) =>
    {
        if (!Array.isArray(ring) || ring.length < 4 || !ring.every(isPosition))
        {
            throw new ContoursError(`${code} has a ring that is not a list of at least four positions`);
        }

        const [first, last] = [ring[0] as Position, ring.at(-1) as Position];
        if (first[0] !== last[0] || first[1] !== last[1])
        {
            throw new ContoursError(`${code} has a ring that does not close`);
        }

        return ring.map(([lon, lat]: Position): Position => [lon, lat]);
    });
}

function isPosition(value: unknown): value is Position
{
    return Array.isArray(value) && value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])
        && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;
}

function isFields(value: unknown): value is Fields
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
