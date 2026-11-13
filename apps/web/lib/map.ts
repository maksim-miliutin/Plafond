import type { Point, Quartier } from "@plafond/domain";

export interface Frame
{
    width: number;
    height: number;
}

export interface Outline
{
    number: number;
    own: boolean;
    d: string;
}

export interface Tile
{
    z: number;
    x: number;
    y: number;
    left: number;
    top: number;
    size: number;
}

export interface Drawing
{
    paths: Outline[];
    pin: { x: number; y: number };
    tiles: Tile[];
}

interface Unit
{
    x: number;
    y: number;
}

const margin = 0.25;  // share of the quartier's size left clear on each side
const padding = 3;  // pixels left clear around a silhouette
const thinnest = 0.5;  // pixels: a corner closer than this to the last one kept is dropped
const tilePixels = 256;
export const deepest = 18;

// Web Mercator, the projection map tiles are cut in: the world as a unit square, x eastward and y southward.
export function mercator(lon: number, lat: number): Unit
{
    const radians = (lat * Math.PI) / 180;

    return {
        x: (lon + 180) / 360,
        y: (1 - Math.log(Math.tan(radians) + 1 / Math.cos(radians)) / Math.PI) / 2,
    };
}

export function drawing(own: Quartier, around: readonly Quartier[], point: Point, frame: Frame): Drawing
{
    const corners = own.rings.flat().map(([lon, lat]) => mercator(lon, lat));
    const west = Math.min(...corners.map((c) => c.x));
    const east = Math.max(...corners.map((c) => c.x));
    const north = Math.min(...corners.map((c) => c.y));
    const south = Math.max(...corners.map((c) => c.y));

    const scale = Math.min(frame.width / ((east - west) * (1 + 2 * margin)), frame.height / ((south - north) * (1 + 2 * margin)));
    const corner = { x: (west + east) / 2 - frame.width / 2 / scale, y: (north + south) / 2 - frame.height / 2 / scale };

    const place = ({ x, y }: Unit) => ({ x: (x - corner.x) * scale, y: (y - corner.y) * scale });

    const outline = (quartier: Quartier): Outline => ({
        number: quartier.number,
        own: quartier === own,
        d: quartier.rings
            .map((ring) => "M" + ring.map(([lon, lat]) => spot(place(mercator(lon, lat)))).join("L") + "Z")
            .join(""),
    });

    return {
        paths: [own, ...around].map(outline),
        pin: place(mercator(point.lon, point.lat)),
        tiles: tilesFor(scale, corner, frame),
    };
}

export function silhouette(outlines: readonly Quartier["rings"][], size: number): string
{
    const corners = outlines.flat(2).map(([lon, lat]) => mercator(lon, lat));
    const west = Math.min(...corners.map((c) => c.x));
    const east = Math.max(...corners.map((c) => c.x));
    const north = Math.min(...corners.map((c) => c.y));
    const south = Math.max(...corners.map((c) => c.y));

    const scale = (size - 2 * padding) / Math.max(east - west, south - north);
    const corner = { x: west - (size / scale - (east - west)) / 2, y: north - (size / scale - (south - north)) / 2 };
    const place = ({ x, y }: Unit) => ({ x: (x - corner.x) * scale, y: (y - corner.y) * scale });

    return outlines
        .flat()
        .map((ring) => "M" + thinned(ring.map(([lon, lat]) => place(mercator(lon, lat)))).map(spot).join("L") + "Z")
        .join("");
}

// IGN serves Plan IGN free and without a key, from the same Géoplateforme as the geocoder, asking only for credit.
const planIgnLayer = new URLSearchParams({
    SERVICE: "WMTS",
    REQUEST: "GetTile",
    VERSION: "1.0.0",
    LAYER: "GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2",
    STYLE: "normal",
    FORMAT: "image/png",
    TILEMATRIXSET: "PM",
});

export const planIgnTemplate = `https://data.geopf.fr/wmts?${planIgnLayer}&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}`;

export function planIgn(tile: Tile): string
{
    return planIgnTemplate.replace("{z}", String(tile.z)).replace("{y}", String(tile.y)).replace("{x}", String(tile.x));
}

function tilesFor(scale: number, corner: Unit, frame: Frame): Tile[]
{
    const z = Math.min(deepest, Math.max(0, Math.ceil(Math.log2(scale / tilePixels))));
    const count = 2 ** z;
    const first = { x: Math.floor(corner.x * count), y: Math.floor(corner.y * count) };
    const last = { x: Math.floor((corner.x + frame.width / scale) * count), y: Math.floor((corner.y + frame.height / scale) * count) };

    const tiles: Tile[] = [];
    for (let x = first.x; x <= last.x; x++)
    {
        for (let y = first.y; y <= last.y; y++)
        {
            tiles.push({ z, x, y, left: (x / count - corner.x) * scale, top: (y / count - corner.y) * scale, size: scale / count });
        }
    }

    return tiles;
}

function spot({ x, y }: { x: number; y: number }): string
{
    return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function thinned(points: readonly Unit[]): Unit[]
{
    const kept: Unit[] = [];
    for (const point of points)
    {
        const last = kept.at(-1);
        if (last === undefined || Math.hypot(point.x - last.x, point.y - last.y) >= thinnest)
        {
            kept.push(point);
        }
    }

    return kept;
}
