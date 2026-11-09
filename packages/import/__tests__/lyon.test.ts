/// <reference types="vite/client" />
import { expect, test } from "vitest";

import early from "../../../db/seed/lyon-2022-2023.csv?raw";
import geojson from "../../../db/seed/lyon-2024-2025.geojson?raw";
import recent from "../../../db/seed/lyon-2025-2026.csv?raw";
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

test("the Lyon decrees follow each other without a gap, from November to November", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");
    const decrees = [...decreesOf(lyonDecrees).values()];

    expect(decrees.map((decree) => decree.from)).toEqual(["2022-11-01", "2023-11-01", "2024-11-01", "2025-11-01"]);
    decrees.slice(1).forEach((decree, index) => expect(decree.from).toBe(decrees[index]!.until));
    expect(decrees.at(-1)).toMatchObject({ title: "Arrêté préfectoral n° DDT 69-2025-10-23-00004", until: "2026-11-01" });
});

// Tribunal administratif de Lyon, 14 octobre 2025: the decree of 29 September 2023 was annulled for an unreadable map,
// and the prefecture appealed; how far back the annulment reaches is not settled, so the screen must say so.
test("the decree of 2023 carries its annulment, so no cap from it is shown without that warning", async () =>
{
    const { decreesOf } = await import("../src/decrees.js");

    expect(decreesOf(lyonDecrees).get(2023)?.contest).toMatchObject({ outcome: "annulled", court: "tribunal administratif de Lyon", decidedOn: "2025-10-14" });
});
