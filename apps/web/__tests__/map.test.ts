import { expect, test } from "vitest";

import type { Quartier } from "@plafond/domain";

import { drawing } from "../lib/map";

// 300 metres a side at the latitude of Paris: a degree of longitude is shorter there than a degree of latitude.
const lat = 48.86;
const north = 300 / 111_320;
const east = north / Math.cos((lat * Math.PI) / 180);

function square(number: number, west: number, south: number): Quartier
{
    const ring: [number, number][] = [
        [west, south],
        [west + east, south],
        [west + east, south + north],
        [west, south + north],
        [west, south],
    ];

    return { number, name: `Q${number}`, rings: [ring] };
}

const own = square(1, 2.34, lat);
const beside = square(2, 2.34 + east, lat);
const frame = { width: 400, height: 400 };

function corners(path: string): [number, number][]
{
    return [...path.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

test("a quartier square on the ground stays square on the map", () =>
{
    const points = corners(drawing(own, [], { lon: 2.341, lat: lat + north / 2 }, frame).paths[0]!.d);
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);

    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(Math.max(...ys) - Math.min(...ys), 0);
});

test("the quartier fits the frame with room around it, however the frame is shaped", () =>
{
    for (const shape of [frame, { width: 400, height: 200 }, { width: 200, height: 400 }])
    {
        for (const [x, y] of corners(drawing(own, [], { lon: 2.341, lat }, shape).paths[0]!.d))
        {
            expect(x).toBeGreaterThan(0);
            expect(x).toBeLessThan(shape.width);
            expect(y).toBeGreaterThan(0);
            expect(y).toBeLessThan(shape.height);
        }
    }
});

test("north is up and east is right", () =>
{
    const map = drawing(own, [beside], { lon: 2.34 + east / 2, lat: lat + north / 2 }, frame);
    const low = drawing(own, [], { lon: 2.34 + east / 2, lat: lat + north / 4 }, frame);

    expect(low.pin.y).toBeGreaterThan(map.pin.y);
    expect(corners(map.paths[1]!.d)[1]![0]).toBeGreaterThan(corners(map.paths[0]!.d)[1]![0]);
});

test("only the quartier itself is marked as the one found", () =>
{
    const map = drawing(own, [beside], { lon: 2.341, lat }, frame);

    expect(map.paths.map((path) => [path.number, path.own])).toEqual([[1, true], [2, false]]);
});
