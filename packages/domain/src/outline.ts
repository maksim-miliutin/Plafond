import type { Quartier } from "./quartier.js";

type Position = Quartier["rings"][number][number];

// Corners are kept in millionths of a degree, about 10 cm, so that copies of one corner left a hair apart by float arithmetic still meet.
const grid = 1e6;

export class OutlineError extends Error
{
    constructor(problem: string)
    {
        super(`outline: ${problem}`);
        this.name = "OutlineError";
    }
}

export function outlineOf(areas: readonly Quartier[]): Quartier["rings"]
{
    if (areas.length === 0)
    {
        throw new OutlineError("no area was given");
    }

    const owners = new Map<string, number>();
    for (const side of areas.flatMap((area) => area.rings.flatMap(sidesOf)))
    {
        owners.set(side, (owners.get(side) ?? 0) + 1);
    }

    const ends = new Map<string, string[]>();
    for (const [side] of [...owners].filter(([, count]) => count === 1))
    {
        const [one, other] = side.split(" ") as [string, string];
        ends.set(one, [...(ends.get(one) ?? []), other]);
        ends.set(other, [...(ends.get(other) ?? []), one]);
    }

    const loose = [...ends].find(([, next]) => next.length !== 2);
    if (loose !== undefined)
    {
        throw new OutlineError(`the areas do not meet side to side at ${positionOf(loose[0]).join(", ")}`);
    }

    return ringsOf(ends);
}

function sidesOf(ring: readonly Position[]): string[]
{
    const corners = ring.map(cornerOf);
    const pairs = corners.slice(1).map((end, i) => [corners[i]!, end].sort());

    return pairs.filter(([start, end]) => start !== end).map((pair) => pair.join(" "));
}

function ringsOf(ends: ReadonlyMap<string, readonly string[]>): Position[][]
{
    const walked = new Set<string>();
    const rings: Position[][] = [];
    for (const start of ends.keys())
    {
        if (walked.has(start))
        {
            continue;
        }

        const ring = walk(start, ends);
        ring.forEach((corner) => walked.add(corner));
        rings.push([...ring, start].map(positionOf));
    }

    return rings;
}

function walk(start: string, ends: ReadonlyMap<string, readonly string[]>): string[]
{
    const ring = [start];
    let before = start;
    let here = ends.get(start)![0]!;
    while (here !== start)
    {
        ring.push(here);
        const [one, other] = ends.get(here)!;
        [before, here] = [here, one === before ? other! : one!];
    }

    return ring;
}

function cornerOf([lon, lat]: Position): string
{
    return `${Math.round(lon * grid)},${Math.round(lat * grid)}`;
}

function positionOf(corner: string): Position
{
    const [lon, lat] = corner.split(",").map(Number) as [number, number];

    return [lon / grid, lat / grid];
}
