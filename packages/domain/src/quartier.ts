export interface Point
{
    lon: number;  // degrees east, WGS 84, as the geocoder returns it
    lat: number;
}

type Position = readonly [number, number];

export interface Quartier
{
    number: number;
    name: string;
    rings: readonly (readonly Position[])[];  // outer rings and holes of every piece, as GeoJSON [lon, lat]
}

export interface Found
{
    kind: "found";
    quartier: number;
}

export interface Border
{
    kind: "border";
    quartiers: number[];
}

export interface Outside
{
    kind: "outside";
}

// Published outlines of neighbouring quartiers leave gaps and overlaps well under a metre;
// a point that close to an outline is taken to lie on it.
const tolerance = 1;
const metresPerDegree = 111_320;

// Paris numbers its eighty administrative quartiers four to an arrondissement, in order.
export function arrondissementOf(quartier: number): number
{
    return Math.ceil(quartier / 4);
}

export function quartierAt(point: Point, quartiers: readonly Quartier[]): Found | Border | Outside
{
    const holding = quartiers
        .filter((q) => contains(q, point) || nearest(q, point) <= tolerance)
        .map((q) => q.number)
        .sort((a, b) => a - b);

    if (holding.length === 0)
    {
        return { kind: "outside" };
    }

    if (holding.length === 1)
    {
        return { kind: "found", quartier: holding[0]! };
    }

    return { kind: "border", quartiers: holding };
}

function contains(quartier: Quartier, point: Point): boolean
{
    return outline(quartier).filter(([a, b]) => crosses(point, a, b)).length % 2 === 1;
}

function crosses(point: Point, a: Position, b: Position): boolean
{
    const [aLon, aLat] = a;
    const [bLon, bLat] = b;
    if ((aLat > point.lat) === (bLat > point.lat))
    {
        return false;
    }

    return point.lon < aLon + (point.lat - aLat) * (bLon - aLon) / (bLat - aLat);
}

function nearest(quartier: Quartier, point: Point): number
{
    const scale = Math.cos(point.lat * Math.PI / 180);
    const metres = ([lon, lat]: Position): Position =>
        [(lon - point.lon) * scale * metresPerDegree, (lat - point.lat) * metresPerDegree];

    return outline(quartier).reduce((best, [a, b]) => Math.min(best, fromOrigin(metres(a), metres(b))), Infinity);
}

function fromOrigin(a: Position, b: Position): number
{
    const [ax, ay] = a;
    const [dx, dy] = [b[0] - ax, b[1] - ay];
    const length = dx * dx + dy * dy;
    const along = length === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / length));

    return Math.hypot(ax + along * dx, ay + along * dy);
}

function outline(quartier: Quartier): [Position, Position][]
{
    return quartier.rings.flatMap((ring) => ring.map((a, i): [Position, Position] => [a, ring[(i + 1) % ring.length]!]));
}
