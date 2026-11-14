import { expect, test } from "vitest";

import { OutlineError, outlineOf } from "../src/outline.js";
import type { Quartier } from "../src/quartier.js";

const side = 0.001;

function square(x: number, y: number, shift = 0): Quartier
{
    const [west, south] = [2 + x * side + shift, 48 + y * side + shift];

    return { number: x * 10 + y, name: `${x},${y}`, rings: [[[west, south], [west + side, south], [west + side, south + side], [west, south + side], [west, south]]] };
}

function corners(ring: readonly (readonly [number, number])[]): Set<string>
{
    return new Set(ring.map(([lon, lat]) => `${lon.toFixed(6)},${lat.toFixed(6)}`));
}

test("two areas sharing a side make one closed outline around both", () =>
{
    const rings = outlineOf([square(0, 0), square(1, 0)]);

    expect(rings).toHaveLength(1);
    expect(rings[0]![0]).toEqual(rings[0]!.at(-1));
    expect(corners(rings[0]!)).toEqual(new Set(["2.000000,48.000000", "2.001000,48.000000", "2.002000,48.000000", "2.002000,48.001000", "2.001000,48.001000", "2.000000,48.001000"]));
});

test("three areas in an L make one outline", () =>
{
    const rings = outlineOf([square(0, 0), square(1, 0), square(0, 1)]);

    expect(rings).toHaveLength(1);
    expect(corners(rings[0]!).size).toBe(8);
});

test("eight areas around an empty one make an outline and a hole", () =>
{
    const cells = [0, 1, 2].flatMap((x) => [0, 1, 2].map((y) => [x, y] as const)).filter(([x, y]) => x !== 1 || y !== 1);
    const rings = outlineOf(cells.map(([x, y]) => square(x, y)));

    expect(rings.map((one) => corners(one).size).sort((a, b) => a - b)).toEqual([4, 12]);
});

test("corners that differ by less than a millionth of a degree are one corner", () =>
{
    expect(outlineOf([square(0, 0), square(1, 0, 3e-8)])).toHaveLength(1);
});

test("areas that do not meet side to side are a breakage", () =>
{
    const above: Quartier = { number: 99, name: "above", rings: [[[2, 48.001], [2.002, 48.001], [2.002, 48.002], [2, 48.002], [2, 48.001]]] };

    expect(() => outlineOf([square(0, 0), square(1, 0), above])).toThrow(OutlineError);
    expect(() => outlineOf([square(0, 0), square(1, 0), above])).toThrow(/^outline: /);
});

test("no area at all is a breakage", () =>
{
    expect(() => outlineOf([])).toThrow(OutlineError);
});

test("a ring drawn the other way round gives the same outline", () =>
{
    const turned = square(1, 0);
    const reversed: Quartier = { ...turned, rings: [[...turned.rings[0]!].reverse()] };

    expect(corners(outlineOf([square(0, 0), reversed])[0]!)).toEqual(corners(outlineOf([square(0, 0), square(1, 0)])[0]!));
});

test("areas that only touch at a corner are a breakage, not two outlines joined at a point", () =>
{
    expect(() => outlineOf([square(0, 0), square(1, 1)])).toThrow(OutlineError);
});

// Two copies of one area share every side, so every side was dropped and an empty outline came back without a word.
test("areas that cancel each other out, such as one area given twice, are a breakage", () =>
{
    expect(() => outlineOf([square(0, 0), square(0, 0)])).toThrow(OutlineError);
});
