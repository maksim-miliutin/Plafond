/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { areaIn, check, type Dwelling, type Period, type Rooms } from "@plafond/domain";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { lawOf } from "../src/law.js";
import { seedsFrom } from "../src/seed.js";

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const { plaineCommune } = seedsFrom((name) => files[`../../../db/seed/${name}`]!);
const law = lawOf(lawSeed);

interface Lease
{
    sector: number;
    dwelling: Dwelling;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
    surface: number;  // hundredths of a m²
    signedOn: string;
}

function checked({ sector, dwelling, rooms, period, furnished, surface, signedOn }: Lease)
{
    const flat = { city: "plaine-commune" as const, quartier: sector, rooms, period, furnished, dwelling };

    return check({ flat, surface, signedOn, startsOn: signedOn, rent: 300000, complement: 0, on: "2026-11-23" }, plaineCommune.rates, law);
}

// Six decrees price eight sectors in 64 categories each; from 2024 sector 310, Saint-Ouen, shares one grid between dwellings.
test("the Plaine Commune rents of six decrees are all read, Saint-Ouen's shared grid once for houses and once for flats", () =>
{
    expect(plaineCommune.rates).toHaveLength(6 * 8 * 64);

    const house = checked({ sector: 310, dwelling: "house", rooms: 4, period: "before-1946", furnished: true, surface: 6000, signedOn: "2026-07-15" });
    const flat = checked({ sector: 310, dwelling: "flat", rooms: 4, period: "before-1946", furnished: true, surface: 6000, signedOn: "2026-07-15" });

    expect(house).toMatchObject({ kind: "checked", cap: 115200, rate: { majored: 1920 } });
    expect(flat).toMatchObject({ kind: "checked", cap: 115200 });
});

// Worked from annexes 2 and 3 of the 2026 decree: the majored rent of the category times the surface.
test("a lease signed in July 2026 in Saint-Denis or Pierrefitte is capped by its sector's grid", () =>
{
    expect(checked({ sector: 311, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 5000, signedOn: "2026-07-15" })).toMatchObject({ kind: "checked", cap: 93000 });
    expect(checked({ sector: 312, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 5000, signedOn: "2026-07-15" })).toMatchObject({ kind: "checked", cap: 102500 });
    expect(checked({ sector: 317, dwelling: "house", rooms: 4, period: "1971-1990", furnished: false, surface: 9000, signedOn: "2026-07-15" })).toMatchObject({ kind: "checked", cap: 139500 });
});

// 50 m², two rooms, empty, built 1946-1970, at 128 rue Gabriel Péri in Saint-Denis, sector 312.
test("a Saint-Denis lease is priced by the decree in force on the day it was signed, edge days included", () =>
{
    const signed = (signedOn: string) =>
    {
        const result = checked({ sector: 312, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 5000, signedOn });

        return result.kind === "checked" ? [result.rate.decree.title, result.cap] : [result.kind, "side" in result ? result.side : ""];
    };

    expect(signed("2021-05-31")).toEqual(["no-rate", "before"]);
    expect(signed("2022-05-31")).toEqual(["Arrêté préfectoral n° IDF-2021-04-01-00041", 99000]);
    expect(signed("2022-06-01")).toEqual(["Arrêté préfectoral n° IDF-2022-05-06-00002", 98500]);
    expect(signed("2024-05-31")).toEqual(["Arrêté préfectoral n° IDF-2023-05-04-00006", 99000]);
    expect(signed("2024-06-01")).toEqual(["Arrêté préfectoral n° IDF-2024-05-02-00007", 99000]);
    expect(signed("2026-05-31")).toEqual(["Arrêté préfectoral n° IDF-2025-05-16-00009", 100000]);
    expect(signed("2026-06-01")).toEqual(["Arrêté préfectoral n° IDF-2026-04-28-00033", 102500]);
    expect(signed("2026-11-24")).toEqual(["Arrêté préfectoral n° IDF-2026-04-28-00033", 102500]);
    expect(signed("2026-11-25")).toEqual(["no-rate", "after"]);
});

// Annex 1: eight communes and the commune déléguée of Pierrefitte-sur-Seine, part of Saint-Denis since 1 January 2025,
// which the geocoder names either way.
test("each Plaine Commune commune is one area, Saint-Denis split in three with Pierrefitte, whose old code still places it", () =>
{
    const areas = plaineCommune.areas;

    expect(areas.filter((area) => area.rings.length > 0).map((area) => `${area.name} ${area.number}`)).toEqual(["Saint-Denis 311", "Saint-Denis 312", "Pierrefitte-sur-Seine 317"]);
    expect(areaIn("93059", { lon: 2.36, lat: 48.96 }, areas)).toMatchObject({ kind: "placed", area: { name: "Pierrefitte-sur-Seine", number: 317 } });
    expect(areaIn("93070", { lon: 2.33, lat: 48.91 }, areas)).toMatchObject({ kind: "placed", area: { name: "Saint-Ouen-sur-Seine", number: 310 } });
    expect(areaIn("93048", { lon: 2.44, lat: 48.86 }, areas)).toEqual({ kind: "outside" });
});

// Points read off the detail sheets of annex 5 on each side of the 311/312 line, at least 23 m from it, and the real
// addresses the DRIHL's simulator puts in 311, 312 and 317, with the code the geocoder gives them today.
const saintDenis = [
    { at: { lon: 2.35721711, lat: 48.94283949 }, sector: 311, seen: "sheet C2" },
    { at: { lon: 2.35654012, lat: 48.94238622 }, sector: 312, seen: "sheet C2" },
    { at: { lon: 2.3805464, lat: 48.94121407 }, sector: 311, seen: "sheet C4" },
    { at: { lon: 2.3805389, lat: 48.94184353 }, sector: 312, seen: "sheet C4" },
    { at: { lon: 2.35018073, lat: 48.93007141 }, sector: 311, seen: "sheet E2" },
    { at: { lon: 2.35113606, lat: 48.93007659 }, sector: 312, seen: "sheet E2" },
    { at: { lon: 2.359996, lat: 48.941117 }, sector: 311, seen: "11 Rue Guy Môquet" },
    { at: { lon: 2.356979, lat: 48.941902 }, sector: 312, seen: "128 Rue Gabriel Péri" },
    { at: { lon: 2.382477, lat: 48.940962 }, sector: 311, seen: "20 Rue des Marnaudes" },
    { at: { lon: 2.380129, lat: 48.94167 }, sector: 312, seen: "2 Rue Chopin" },
    { at: { lon: 2.355731, lat: 48.942706 }, sector: 312, seen: "1 Rue Berne" },
    { at: { lon: 2.359202, lat: 48.961136 }, sector: 317, seen: "31 Avenue Lénine, Pierrefitte" },
    { at: { lon: 2.366928, lat: 48.952675 }, sector: 317, seen: "111 Rue Nungesser et Coli, Pierrefitte" },
];

test("a point in Saint-Denis falls in the sector the decree's maps give it, Pierrefitte included", () =>
{
    for (const { at, sector, seen } of saintDenis)
    {
        expect(areaIn("93066", at, plaineCommune.areas), seen).toMatchObject({ kind: "placed", area: { number: sector } });
    }
});

// The 2024 decree applies to the end of May 2025 whatever the merger of 1 January 2025 changed in the commune's code.
test("a Pierrefitte lease signed either side of the merger takes the same 2024 rent of sector 317", () =>
{
    for (const signedOn of ["2024-12-31", "2025-01-01"])
    {
        expect(checked({ sector: 317, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 4800, signedOn }), signedOn)
            .toMatchObject({ kind: "checked", cap: 85920, rate: { decree: { title: "Arrêté préfectoral n° IDF-2024-05-02-00007" } } });
    }
});
