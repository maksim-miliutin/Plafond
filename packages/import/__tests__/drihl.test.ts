/// <reference types="vite/client" />
import { expect, test } from "vitest";

import type { Period, Rooms } from "@plafond/domain";

import annex from "../../../db/seed/paris-annex-2026.csv?raw";
import table from "../../../db/seed/paris-rates.csv?raw";
import sectors from "../../../db/seed/paris-sectors-2026.csv?raw";
import seed from "../../../db/seed/paris-decrees.json" with { type: "json" };
import { decreesOf } from "../src/decrees.js";
import { parisRates } from "../src/seed.js";

interface Read
{
    from: string;
    quartier: number;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
    seen: [number, number, number];
}

// Read by hand on the DRIHL map, the prefecture's own reference, on 4 October 2026: reference, majored and minored, in
// euros per square metre. Six on the 2026 decree, typed from its PDF here, and two on the City's published table.
const map: Read[] = [
    { from: "2026-07-01", quartier: 13, rooms: 1, period: "before-1946", furnished: true, seen: [41.2, 49.4, 28.8] },
    { from: "2026-07-01", quartier: 20, rooms: 1, period: "before-1946", furnished: true, seen: [40.1, 48.1, 28.1] },
    { from: "2026-07-01", quartier: 43, rooms: 2, period: "1971-1990", furnished: false, seen: [26.0, 31.2, 18.2] },
    { from: "2026-07-01", quartier: 71, rooms: 3, period: "after-1990", furnished: true, seen: [27.2, 32.6, 19.0] },
    { from: "2026-07-01", quartier: 62, rooms: 4, period: "before-1946", furnished: false, seen: [26.8, 32.2, 18.8] },
    { from: "2026-07-01", quartier: 54, rooms: 1, period: "1946-1970", furnished: false, seen: [27.2, 32.6, 19.0] },
    { from: "2019-07-01", quartier: 25, rooms: 2, period: "before-1946", furnished: false, seen: [27.9, 33.5, 19.5] },
    { from: "2023-07-01", quartier: 58, rooms: 3, period: "1971-1990", furnished: true, seen: [27.3, 32.8, 19.1] },
];

test("every rent read on the DRIHL map is the one Plafond holds for that flat, quartier and decree", () =>
{
    const rates = parisRates({ table, annex, sectors, decrees: decreesOf(seed) });

    for (const read of map)
    {
        const held = rates.find((rate) =>
            rate.decree.from === read.from
            && rate.flat.quartier === read.quartier
            && rate.flat.rooms === read.rooms
            && rate.flat.period === read.period
            && rate.flat.furnished === read.furnished);
        const label = `${read.from} quartier ${read.quartier}`;

        expect(held, label).toBeDefined();
        expect([held!.reference, held!.majored, held!.minored], label).toEqual(read.seen.map((euros) => Math.round(euros * 100)));
    }
});
