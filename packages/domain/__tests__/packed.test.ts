import { expect, test } from "vitest";

import { PackedError, pack, packQuartiers, unpack, unpackQuartiers } from "../src/packed.js";
import type { Quartier } from "../src/quartier.js";
import type { Decree, Rate } from "../src/rates.js";

const annulled: Decree = {
    title: "Arrêté préfectoral n° 75-2020-06-15-012",
    url: "https://example.org/2020",
    from: "2020-07-01",
    until: "2021-07-01",
    contest: {
        outcome: "annulled",
        court: "Cour administrative d'appel de Paris",
        decidedOn: "2023-10-02",
        claimsBy: "2023-10-02",
        source: "https://example.org/judgment",
    },
};

const standing: Decree = {
    title: "Arrêté préfectoral n° 2025-06-16-00003",
    url: "https://example.org/2025",
    from: "2025-07-01",
    until: "2026-07-01",
    contest: null,
};

const rates: Rate[] = [
    { flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true }, reference: 2670, majored: 3200, minored: 1870, decree: standing },
    { flat: { quartier: 80, rooms: 4, period: "after-1990", furnished: false }, reference: 2210, majored: 2650, minored: 1550, decree: standing },
    { flat: { quartier: 12, rooms: 1, period: "before-1946", furnished: false }, reference: 2890, majored: 3470, minored: 2020, decree: annulled },
];

test("a packed table unpacks to the very rates it was made from, through json as well", () =>
{
    expect(unpack(pack(rates))).toEqual(rates);
    expect(unpack(JSON.parse(JSON.stringify(pack(rates))))).toEqual(rates);
});

test("a decree shared by many rows is written once", () =>
{
    expect(pack(rates).decrees).toEqual([standing, annulled]);
});

test("a table of another version is a breakage", () =>
{
    expect(() => unpack({ ...pack(rates), version: 2 })).toThrow(PackedError);
    expect(() => unpack(null)).toThrow(PackedError);
    expect(() => unpack("rates")).toThrow(PackedError);
});

test("a row that cannot be read back is a breakage and names its place", () =>
{
    const packed = pack(rates);
    const broken = (row: unknown[]) => ({ ...packed, rows: [packed.rows[0], row] });

    expect(() => unpack(broken([80, 4, "after-1990", 0, 2210, 2650, 1550, 7]))).toThrow(/row 1/);
    expect(() => unpack(broken([80, 4, "1990", 0, 2210, 2650, 1550, 0]))).toThrow(PackedError);
    expect(() => unpack(broken([80, 5, "after-1990", 0, 2210, 2650, 1550, 0]))).toThrow(PackedError);
    expect(() => unpack(broken([80, "4", "after-1990", 0, 2210, 2650, 1550, 0]))).toThrow(PackedError);
    expect(() => unpack(broken([80, 4, "after-1990", true, 2210, 2650, 1550, 0]))).toThrow(PackedError);
    expect(() => unpack(broken([80, 4, "after-1990", 0, 22.1, 2650, 1550, 0]))).toThrow(PackedError);
    expect(() => unpack(broken([80, 4, "after-1990", 0, 2210, 2650]))).toThrow(PackedError);
    expect(() => unpack(broken([80, 4, "after-1990", 0, 2210, 2650, 1550, 0, 0]))).toThrow(PackedError);
});

const outlines: Quartier[] = [
    { number: 1, name: "Saint-Germain-l'Auxerrois", rings: [[[2.34, 48.86], [2.345, 48.86], [2.345, 48.863], [2.34, 48.86]]] },
    { number: 7, name: "Arts-et-Métiers", rings: [[[2.35, 48.86], [2.36, 48.86], [2.36, 48.87], [2.35, 48.86]], [[2.352, 48.862], [2.353, 48.862], [2.353, 48.863], [2.352, 48.862]]] },
];

test("packed outlines unpack to the very quartiers they were made from, through json as well", () =>
{
    expect(unpackQuartiers(JSON.parse(JSON.stringify(packQuartiers(outlines))))).toEqual(outlines);
});

test("outlines that cannot be read back are a breakage", () =>
{
    const packed = packQuartiers(outlines);

    expect(() => unpackQuartiers({ ...packed, version: 2 })).toThrow(PackedError);
    expect(() => unpackQuartiers({ ...packed, quartiers: [{ ...outlines[0], number: 1.5 }] })).toThrow(PackedError);
    expect(() => unpackQuartiers({ ...packed, quartiers: [{ ...outlines[0], name: "" }] })).toThrow(PackedError);
    expect(() => unpackQuartiers({ ...packed, quartiers: [{ ...outlines[0], rings: [[[2.3, "48.8"]]] }] })).toThrow(/quartier 0/);
    expect(() => unpackQuartiers({ ...packed, quartiers: [{ ...outlines[0], rings: "rings" }] })).toThrow(PackedError);
    expect(() => unpackQuartiers({ ...packed, quartiers: [{ ...outlines[0], rings: [[[2.3, 48.8, 35]]] }] })).toThrow(PackedError);
});
