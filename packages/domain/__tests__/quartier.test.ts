import { expect, test } from "vitest";

import { quartierAt, type Quartier } from "../src/quartier.js";

type Position = readonly [number, number];

// Near Paris a thousandth of a degree is about 73 metres east-west and 111 north-south,
// and a hundred-thousandth of a degree of longitude is about 0.73 metres.
const west = 2.33;
const south = 48.85;
const side = 0.01;

function square(left: number, bottom: number, size: number): Position[]
{
    return [[left, bottom], [left + size, bottom], [left + size, bottom + size], [left, bottom + size], [left, bottom]];
}

const one: Quartier = { number: 1, name: "One", rings: [square(west, south, side)] };
const two: Quartier = { number: 2, name: "Two", rings: [square(west + side, south, side)] };
const quartiers = [one, two];

test("a point well inside one quartier is found there", () =>
{
    expect(quartierAt({ lon: west + 0.005, lat: south + 0.005 }, quartiers)).toEqual({ kind: "found", quartier: 1 });
    expect(quartierAt({ lon: west + 0.015, lat: south + 0.005 }, quartiers)).toEqual({ kind: "found", quartier: 2 });
});

test("a point outside every quartier is outside paris", () =>
{
    expect(quartierAt({ lon: west + 0.05, lat: south + 0.005 }, quartiers)).toEqual({ kind: "outside" });
});

test("a point on the shared border belongs to both, and the person chooses", () =>
{
    expect(quartierAt({ lon: west + side, lat: south + 0.005 }, quartiers)).toEqual({ kind: "border", quartiers: [1, 2] });
});

test("within a metre of the border is on it, a few metres away is not", () =>
{
    expect(quartierAt({ lon: west + side - 0.000005, lat: south + 0.005 }, quartiers)).toEqual({ kind: "border", quartiers: [1, 2] });
    expect(quartierAt({ lon: west + side - 0.0001, lat: south + 0.005 }, quartiers)).toEqual({ kind: "found", quartier: 1 });
});

test("a thin gap between neighbours does not throw a point out of paris", () =>
{
    const apart: Quartier = { number: 2, name: "Two", rings: [square(west + side + 0.000004, south, side)] };

    expect(quartierAt({ lon: west + side + 0.000002, lat: south + 0.005 }, [one, apart])).toEqual({ kind: "border", quartiers: [1, 2] });
});

test("a hole is not part of the quartier around it", () =>
{
    const ring: Quartier = { number: 3, name: "Ring", rings: [square(west, south, side), square(west + 0.003, south + 0.003, 0.004)] };
    const island: Quartier = { number: 4, name: "Island", rings: [square(west + 0.003, south + 0.003, 0.004)] };

    expect(quartierAt({ lon: west + 0.005, lat: south + 0.005 }, [ring])).toEqual({ kind: "outside" });
    expect(quartierAt({ lon: west + 0.005, lat: south + 0.005 }, [ring, island])).toEqual({ kind: "found", quartier: 4 });
    expect(quartierAt({ lon: west + 0.001, lat: south + 0.001 }, [ring, island])).toEqual({ kind: "found", quartier: 3 });
});

test("a quartier in several pieces is found in each of them", () =>
{
    const split: Quartier = { number: 5, name: "Split", rings: [square(west, south, 0.004), square(west + 0.006, south, 0.004)] };

    expect(quartierAt({ lon: west + 0.002, lat: south + 0.002 }, [split])).toEqual({ kind: "found", quartier: 5 });
    expect(quartierAt({ lon: west + 0.008, lat: south + 0.002 }, [split])).toEqual({ kind: "found", quartier: 5 });
    expect(quartierAt({ lon: west + 0.005, lat: south + 0.002 }, [split])).toEqual({ kind: "outside" });
});

test("a point level with a corner is counted once, not twice", () =>
{
    const diamond: Quartier = {
        number: 6,
        name: "Diamond",
        rings: [[[west, south + 0.005], [west + 0.005, south], [west + 0.01, south + 0.005], [west + 0.005, south + 0.01], [west, south + 0.005]]],
    };

    expect(quartierAt({ lon: west + 0.005, lat: south + 0.005 }, [diamond])).toEqual({ kind: "found", quartier: 6 });
    expect(quartierAt({ lon: west - 0.005, lat: south + 0.005 }, [diamond])).toEqual({ kind: "outside" });
});

test("an outline that does not repeat its first corner is still closed", () =>
{
    const open: Quartier = { number: 7, name: "Open", rings: [square(west, south, side).slice(0, 4)] };

    expect(quartierAt({ lon: west + 0.005, lat: south + 0.005 }, [open])).toEqual({ kind: "found", quartier: 7 });
    expect(quartierAt({ lon: west - 0.005, lat: south + 0.005 }, [open])).toEqual({ kind: "outside" });
});

// 0.000012 degrees of longitude is about 0.88 metres in Paris but 1.34 at the equator.
test("a metre east to west is measured at the latitude of paris", () =>
{
    expect(quartierAt({ lon: west + side - 0.000012, lat: south + 0.005 }, quartiers)).toEqual({ kind: "border", quartiers: [1, 2] });
});

test("a point in line with an edge but far beyond its end is not near it", () =>
{
    expect(quartierAt({ lon: west + 0.05, lat: south }, quartiers)).toEqual({ kind: "outside" });
});
