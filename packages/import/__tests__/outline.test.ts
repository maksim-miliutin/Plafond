/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { outlineOf, type Quartier } from "@plafond/domain";

import lyonText from "../../../db/seed/lyon-2024-2025.geojson?raw";
import parisSeed from "../../../db/seed/paris-quartiers.json" with { type: "json" };
import { lyonOutlines, lyonTable } from "../src/lyon.js";
import { quartiersOf } from "../src/quartiers.js";

const lyonAreas = lyonOutlines(lyonTable(lyonText));
const zones: [string, Quartier[]][] = [
    ["Paris", quartiersOf(parisSeed)],
    ["Lyon", lyonAreas.filter((area) => area.name !== "Villeurbanne")],
    ["Villeurbanne", lyonAreas.filter((area) => area.name === "Villeurbanne")],
];

function km2(ring: readonly (readonly [number, number])[]): number
{
    const middle = (ring.reduce((sum, [, lat]) => sum + lat, 0) / ring.length) * Math.PI / 180;
    const east = (lon: number) => lon * 111.32 * Math.cos(middle);
    const north = (lat: number) => lat * 111.32;
    const twice = ring.slice(1).reduce((sum, [lon, lat], i) => sum + east(ring[i]![0]) * north(lat) - east(lon) * north(ring[i]![1]), 0);

    return Math.abs(twice) / 2;
}

test("Paris, Lyon and Villeurbanne each draw one closed outline", () =>
{
    for (const [name, areas] of zones)
    {
        const rings = outlineOf(areas);

        expect(rings, name).toHaveLength(1);
        expect(rings[0]![0], name).toEqual(rings[0]!.at(-1));
    }
});

test("each outline encloses the area of its quartiers, no more and no less", () =>
{
    for (const [name, areas] of zones)
    {
        const parts = areas.flatMap((area) => area.rings).reduce((sum, ring) => sum + km2(ring), 0);
        const whole = outlineOf(areas).reduce((sum, ring) => sum + km2(ring), 0);

        expect(Math.abs(whole - parts) / parts, name).toBeLessThan(0.001);
    }
});

// INSEE's comparateur de territoires gives Paris 2 103 778 inhabitants at 19 959.9 per km² in 2023, that is 105.40 km².
test("the Paris outline encloses the 105.4 km² INSEE gives for Paris", () =>
{
    const [, paris] = zones[0]!;

    expect(Math.abs(km2(outlineOf(paris)[0]!) - 105.4)).toBeLessThan(0.5);
});
