import { expect, test } from "vitest";

import { PackedError, pack, unpack } from "../src/packed.js";
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
