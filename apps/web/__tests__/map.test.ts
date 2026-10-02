import { expect, test } from "vitest";

import type { Quartier } from "@plafond/domain";

import { drawing, mercator } from "../lib/map";

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

// Counted apart from our code, with the asinh form of the projection: the tile numbers OpenStreetMap and IGN use at zoom 16.
test("known places land on the tiles the map servers number them with", () =>
{
    const tile = (lon: number, lat: number) => [Math.floor(mercator(lon, lat).x * 2 ** 16), Math.floor(mercator(lon, lat).y * 2 ** 16)];

    expect(tile(2.3499, 48.853)).toEqual([33195, 22547]);
    expect(tile(2.2945, 48.8584)).toEqual([33185, 22545]);
});

test("the tiles cover the whole frame, all from one zoom, never stretched past their own pixels", () =>
{
    for (const shape of [frame, { width: 400, height: 200 }, { width: 382, height: 300 }])
    {
        const { tiles } = drawing(own, [beside], { lon: 2.341, lat }, shape);

        expect(new Set(tiles.map((t) => t.z)).size).toBe(1);
        expect(Math.min(...tiles.map((t) => t.left))).toBeLessThanOrEqual(0);
        expect(Math.min(...tiles.map((t) => t.top))).toBeLessThanOrEqual(0);
        expect(Math.max(...tiles.map((t) => t.left + t.size))).toBeGreaterThanOrEqual(shape.width);
        expect(Math.max(...tiles.map((t) => t.top + t.size))).toBeGreaterThanOrEqual(shape.height);
        expect(tiles.every((t) => t.size > 128 && t.size <= 256)).toBe(true);
    }
});

test("the tile drawn under the pin is the tile that holds the address", () =>
{
    const point = { lon: 2.3412, lat: lat + north / 3 };
    const { tiles, pin } = drawing(own, [], point, frame);
    const under = tiles.find((t) => pin.x >= t.left && pin.x < t.left + t.size && pin.y >= t.top && pin.y < t.top + t.size);
    const count = 2 ** under!.z;

    const at = mercator(point.lon, point.lat);

    expect([under!.x, under!.y]).toEqual([Math.floor(at.x * count), Math.floor(at.y * count)]);
    expect(pin.x - under!.left).toBeCloseTo((at.x * count - under!.x) * under!.size, 2);
    expect(pin.y - under!.top).toBeCloseTo((at.y * count - under!.y) * under!.size, 2);
});

