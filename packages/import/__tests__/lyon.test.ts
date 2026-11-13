/// <reference types="vite/client" />
import { expect, test } from "vitest";

import early from "../../../db/seed/lyon-2022-2023.csv?raw";
import geojson from "../../../db/seed/lyon-2024-2025.geojson?raw";
import recent from "../../../db/seed/lyon-2025-2026.csv?raw";
import annulled from "../../../db/seed/lyon-2023-2024.geojson?raw";
import annex from "../../../db/seed/lyon-annex-2026.csv?raw";
import sectors from "../../../db/seed/lyon-sectors-2026.csv?raw";
import lyonDecrees from "../../../db/seed/lyon-decrees.json" with { type: "json" };
import { LyonError, lyonOutlines, lyonRates, lyonTable } from "../src/lyon.js";

const decree = { title: "Arrêté préfectoral n° DDT 69-2025-10-23-00004", url: "https://example.org/decree", from: "2025-11-01", until: "2026-11-01", contest: null };

test("the three published shapes read alike: 233 IRIS of Lyon and Villeurbanne, each in a zone", () =>
{
    for (const [text, zones] of [[recent, 5], [geojson, 5], [early, 4]] as const)
    {
        const table = lyonTable(text);

        expect(table.zones.size).toBe(233);
        expect(new Set(table.zones.values()).size).toBe(zones);
    }
});

// Expected rents come from an independent copy of the decree of 29 September 2023 (loyer-paris-be), not from this file.
test("the 2023 file prices its five zones as the decree of 29 September 2023 does", () =>
{
    const table = lyonTable(annulled);
    const rates = lyonRates(table, { ...decree, title: "Arrêté préfectoral n° DDT 69-2023-09-29-00003", from: "2023-11-01", until: "2024-11-01" });
    const at = (zone: number, rooms: number, period: string, furnished: boolean) =>
    {
        const iris = [...table.zones].find(([, known]) => known === zone)![0];

        return rates.find((rate) => rate.flat.quartier === iris && rate.flat.rooms === rooms && rate.flat.period === period && rate.flat.furnished === furnished);
    };

    expect(table.zones.size).toBe(233);
    expect(new Set(table.zones.values()).size).toBe(5);
    expect(at(1, 1, "before-1946", false)).toMatchObject({ reference: 1630, majored: 1960, minored: 1140 });
    expect(at(1, 1, "before-1946", true)).toMatchObject({ reference: 1840, majored: 2210, minored: 1290 });
    expect(at(5, 4, "1971-1990", false)).toMatchObject({ reference: 890, majored: 1070, minored: 620 });
    expect(at(3, 2, "1991-2005", true)).toMatchObject({ reference: 1510, majored: 1810, minored: 1060 });
});

// Counted on the 2025-2026 file by hand: zone 1, one room, built before 1946, 17.50 € empty and 19.80 € furnished, majored by a fifth.
test("each IRIS gets its zone's rents for every size, period and letting, in cents, under the city of Lyon", () =>
{
    const table = lyonTable(recent);
    const rates = lyonRates(table, decree);
    const iris = [...table.zones].find(([, zone]) => zone === 1)![0];
    const at = (furnished: boolean) => rates.find((rate) => rate.flat.quartier === iris && rate.flat.rooms === 1 && rate.flat.period === "before-1946" && rate.flat.furnished === furnished);

    expect(rates).toHaveLength(233 * 4 * 5 * 2);
    expect(at(false)).toMatchObject({ flat: { city: "lyon" }, reference: 1750, majored: 2100, minored: 1230, decree });
    expect(at(true)).toMatchObject({ reference: 1980, majored: 2380, minored: 1390 });
});

// 19.9 × 100 is 1989.9999999999998 in floating point: cutting it short would lose a cent on zone 2's furnished studio.
test("a rent with a decimal that floating point cannot hold exactly still lands on its cent", () =>
{
    const table = lyonTable(recent);
    const iris = [...table.zones].find(([, zone]) => zone === 2)![0];
    const studio = lyonRates(table, decree).find((rate) => rate.flat.quartier === iris && rate.flat.rooms === 1 && rate.flat.period === "before-1946" && rate.flat.furnished);

    expect(studio).toMatchObject({ reference: 1990, majored: 2390, minored: 1390 });
});

test("the earliest file, written with Python quotes and four zones, reads the same way", () =>
{
    const table = lyonTable(early);
    const rates = lyonRates(table, decree);
    const iris = [...table.zones].find(([, zone]) => zone === 1)![0];

    expect(rates.find((rate) => rate.flat.quartier === iris && rate.flat.rooms === 2 && rate.flat.period === "before-1946" && !rate.flat.furnished)).toMatchObject({ reference: 1420, majored: 1700, minored: 990 });
});

test("the outlines come from the files that draw them, one per IRIS, named by its commune", () =>
{
    const outlines = lyonOutlines(lyonTable(recent));

    expect(outlines).toHaveLength(233);
    expect(outlines.every((outline) => outline.rings.length >= 1 && outline.rings[0]!.length >= 4)).toBe(true);
    expect(outlines.map((outline) => outline.name)).toContain("Villeurbanne");
    expect(lyonOutlines(lyonTable(geojson))).toHaveLength(233);
    expect(() => lyonOutlines(lyonTable(early))).toThrow(LyonError);
});

test("two IRIS of one zone that disagree on a rent are a breakage, not a choice", () =>
{
    const lines = recent.split(/\r?\n/);
    const broken = [lines[0], lines[1], lines[1]!.replace(/^[^,]+,(\d+),(\d),/, (_, iris, zone) => `x,${Number(iris) + 1},${zone},`).replace('""loyer_reference"": 17.6', '""loyer_reference"": 99.9')].join("\n");

    expect(() => lyonTable(broken)).toThrow(LyonError);
});

// Article 3 of the decree of 23 October 2026 applies it from 1 November to 23 November 2026 inclusive.
test("the Lyon decrees follow each other without a gap, the last one ending after 23 November 2026", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const decrees = [...decreesOf(lyonDecrees).values()];

    expect(decrees.map((decree) => decree.from)).toEqual(["2022-11-01", "2023-11-01", "2024-11-01", "2025-11-01", "2026-11-01"]);
    decrees.slice(1).forEach((decree, index) => expect(decree.from).toBe(decrees[index]!.until));
    expect(decrees.at(-1)).toMatchObject({ title: "Arrêté préfectoral n° DDT 69-2026-10-23-00004", until: "2026-11-24", contest: null });
});

// Tribunal administratif de Lyon, 14 octobre 2025: the decree of 29 September 2023 was annulled for an unreadable map,
// and the prefecture appealed; how far back the annulment reaches is not settled, so the screen must say so.
test("the decree of 2023 carries its annulment, so no cap from it is shown without that warning", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");

    expect(decreesOf(lyonDecrees).get(2023)?.contest).toMatchObject({ outcome: "annulled", court: "tribunal administratif de Lyon", decidedOn: "2025-10-14" });
});

test("the seed joins each year's table to its decree and draws the outlines from the latest file that has them", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const { lyonSeed } = await import("../src/seed.js");
    const decrees = decreesOf(lyonDecrees);
    const { rates, outlines } = lyonSeed({ tables: new Map([[2022, early], [2024, geojson], [2025, recent]]), annexes: new Map(), decrees });
    const iris = outlines[0]!.number;
    const yearOn = (day: string) => rates.find((rate) => rate.flat.quartier === iris && rate.decree.from <= day && day < rate.decree.until)?.decree.from;

    expect(rates).toHaveLength(233 * 40 * 3);
    expect(outlines).toHaveLength(233);
    expect(yearOn("2026-01-15")).toBe("2025-11-01");
    expect(yearOn("2023-02-01")).toBe("2022-11-01");
    expect(yearOn("2024-02-01")).toBeUndefined();
});

test("a table without its decree is a breakage", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const { SeedError, lyonSeed } = await import("../src/seed.js");

    expect(() => lyonSeed({ tables: new Map([[2019, recent]]), annexes: new Map(), decrees: decreesOf(lyonDecrees) })).toThrow(SeedError);
});

test("the seed also says which zone each IRIS falls in, in the latest year, for pages that explain the zones", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const { lyonSeed } = await import("../src/seed.js");
    const { zoning } = lyonSeed({ tables: new Map([[2022, early], [2025, recent]]), annexes: new Map(), decrees: decreesOf(lyonDecrees) });

    expect(zoning.size).toBe(233);
    expect(new Set(zoning.values())).toEqual(new Set([1, 2, 3, 4, 5]));
});

// Read off the maps of the 2026 decree IRIS by IRIS, every sector is the zone the 2025 file gives.
test("a year read from its decree joins the seed on its own sectors, which become the latest zoning", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const { lyonSeed } = await import("../src/seed.js");
    const seeded = lyonSeed({ tables: new Map([[2025, recent]]), annexes: new Map([[2026, { annex, sectors }]]), decrees: decreesOf(lyonDecrees) });

    expect(seeded.rates).toHaveLength(233 * 40 * 2);
    expect(seeded.rates.filter((rate) => rate.decree.from === "2026-11-01")).toHaveLength(233 * 40);
    expect(seeded.zoning).toEqual(lyonTable(recent).zones);

    const moved = lyonSeed({ tables: new Map([[2025, recent]]), annexes: new Map([[2026, { annex, sectors: sectors.replace("692660101;Villeurbanne;4", "692660101;Villeurbanne;5") }]]), decrees: decreesOf(lyonDecrees) });
    expect(moved.zoning.get(692660101)).toBe(5);
});

test("sectors that leave out an IRIS the outlines draw, or a year given both as a table and as an annex, are a breakage", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const { SeedError, lyonSeed } = await import("../src/seed.js");
    const decrees = decreesOf(lyonDecrees);
    const short = sectors.trimEnd().split("\n").slice(0, -1).join("\n");

    expect(() => lyonSeed({ tables: new Map([[2025, recent]]), annexes: new Map([[2026, { annex, sectors: short }]]), decrees })).toThrow(SeedError);
    expect(() => lyonSeed({ tables: new Map([[2025, recent]]), annexes: new Map([[2025, { annex, sectors }]]), decrees })).toThrow(SeedError);
});
