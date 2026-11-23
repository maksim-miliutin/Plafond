/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { check, type Decree, type Dwelling, type Period, type Rooms } from "@plafond/domain";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import decreeSeed from "../../../db/seed/est-ensemble-decrees.json" with { type: "json" };
import { decreesOf } from "../src/decrees.js";
import { lawOf } from "../src/law.js";
import { TerritoryError, territoryRates } from "../src/territories.js";

import table from "../../../db/seed/grand-paris-rates.csv?raw";

const decrees = decreesOf(decreeSeed);
const rates = territoryRates(table, "est-ensemble", decrees);
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
    const flat = { city: "est-ensemble" as const, quartier: sector, rooms, period, furnished, dwelling };

    return check({ flat, surface, signedOn, startsOn: signedOn, rent: 200000, complement: 0, on: "2026-11-23" }, rates, law);
}

// Six decrees price six sectors in 64 categories each; from 2024 sectors 307 and 308 share one grid between houses and flats.
test("the Est Ensemble rents of six decrees are all read, a shared grid once for houses and once for flats", () =>
{
    expect(rates).toHaveLength(6 * 6 * 64);
    expect(new Set(rates.map((rate) => rate.flat.quartier))).toEqual(new Set([307, 308, 311, 313, 315, 318]));

    const shared = rates.filter((rate) => rate.decree.from === "2026-06-01" && rate.flat.quartier === 307 && rate.flat.rooms === 2 && rate.flat.period === "1946-1970" && !rate.flat.furnished);
    expect(shared.map((rate) => [rate.flat.dwelling, rate.majored]).sort()).toEqual([["flat", 2230], ["house", 2230]]);
});

// The cases worked from the 2026 decree, annexes 2 to 4: the majored rent of the category times the surface.
const worked = [
    { name: "Pantin, a flat", lease: { sector: 308, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 3800 }, majored: 2280, cap: 86640 },
    { name: "Montreuil 307, a house", lease: { sector: 307, dwelling: "house", rooms: 4, period: "before-1946", furnished: true, surface: 7300 }, majored: 2400, cap: 175200 },
    { name: "Montreuil 308, a house", lease: { sector: 308, dwelling: "house", rooms: 4, period: "before-1946", furnished: true, surface: 7300 }, majored: 2110, cap: 154030 },
    { name: "Noisy-le-Sec, a house", lease: { sector: 311, dwelling: "house", rooms: 3, period: "after-1990", furnished: false, surface: 6500 }, majored: 2170, cap: 141050 },
] as const;

test("a lease signed in July 2026 is capped at the majored rent of its category times its surface", () =>
{
    for (const { name, lease, majored, cap } of worked)
    {
        expect(checked({ ...lease, signedOn: "2026-07-15" }), name).toMatchObject({ kind: "checked", cap, rate: { majored, decree: { title: "Arrêté préfectoral n° IDF-2026-04-28-00032" } } });
    }
});

// 48 m², two rooms, empty, built 1946-1970, at 29 rue Parmentier in Montreuil, sector 307: each decree starts on 1 June,
// and the 2026 one stops on 24 November 2026, whatever the law that runs on to 2028 allows.
test("a Montreuil lease is priced by the decree in force on the day it was signed, edge days included", () =>
{
    const signed = (signedOn: string) =>
    {
        const result = checked({ sector: 307, dwelling: "flat", rooms: 2, period: "1946-1970", furnished: false, surface: 4800, signedOn });

        return result.kind === "checked" ? [result.rate.decree.title, result.cap] : [result.kind, "side" in result ? result.side : ""];
    };

    expect(signed("2021-11-30")).toEqual(["no-rate", "before"]);
    expect(signed("2022-05-31")).toEqual(["Arrêté préfectoral n° IDF-2021-11-03-00006", 98400]);
    expect(signed("2022-06-01")).toEqual(["Arrêté préfectoral n° IDF-2022-05-06-00001", 101280]);
    expect(signed("2024-05-31")).toEqual(["Arrêté préfectoral n° IDF-2023-05-04-00005", 101760]);
    expect(signed("2024-06-01")).toEqual(["Arrêté préfectoral n° IDF-2024-05-02-00006", 102720]);
    expect(signed("2026-05-31")).toEqual(["Arrêté préfectoral n° IDF-2025-05-16-00008", 104160]);
    expect(signed("2026-06-01")).toEqual(["Arrêté préfectoral n° IDF-2026-04-28-00032", 107040]);
    expect(signed("2026-11-23")).toEqual(["Arrêté préfectoral n° IDF-2026-04-28-00032", 107040]);
    expect(signed("2026-11-24")).toEqual(["Arrêté préfectoral n° IDF-2026-04-28-00032", 107040]);
    expect(signed("2026-11-25")).toEqual(["no-rate", "after"]);
});

// The May 2024 publication left out Bondy's two grids; the corrected one of 21 June 2024 prints them on pages 32 and 36.
test("a Bondy flat and a Bondy house of the same category take their own grids, on both sides of 1 June 2024", () =>
{
    const bondy = (dwelling: Dwelling, signedOn: string) =>
        checked({ sector: 318, dwelling, rooms: 2, period: "1946-1970", furnished: false, surface: 5500, signedOn });

    expect(bondy("flat", "2024-05-31")).toMatchObject({ kind: "checked", cap: 95700 });
    expect(bondy("flat", "2024-06-01")).toMatchObject({ kind: "checked", cap: 95150 });
    expect(bondy("house", "2024-05-31")).toMatchObject({ kind: "checked", cap: 104500 });
    expect(bondy("house", "2024-06-01")).toMatchObject({ kind: "checked", cap: 103400 });
});

const header = "territoire,millesime,from,until_exclusive,secteur,type_logement,pieces_min,epoque_construction,meuble,loyer_minore_eur_m2,loyer_reference_eur_m2,loyer_majore_eur_m2,source_pdf,annexe,page_pdf";
const decree: Decree = { title: "fixture decree", url: "https://example.org/decree", from: "2026-06-01", until: "2026-11-25", contest: null };

function sector(change: (line: string[]) => string[] = (line) => line): string
{
    const lines = ["appartement", "maison"].flatMap((dwelling) => ["1", "2", "3", "4"].flatMap((size) =>
        ["avant-1946", "1946-1970", "1971-1990", "apres-1990"].flatMap((age) => ["false", "true"].map((letting) =>
            change(["est-ensemble", "2026", "2026-06-01", "2026-11-25", "307", dwelling, size, age, letting, "14.0", "20.0", "24.0", "x.pdf", "2", "6"]).join(",")))));

    return [header, ...lines].join("\n");
}

test("a whole sector reads, and a missing category, a repeated one or rents off the decree's rule are refused", () =>
{
    const one = new Map([[2026, decree]]);

    expect(territoryRates(sector(), "est-ensemble", one)).toHaveLength(64);
    expect(territoryRates(sector(), "lyon", new Map())).toEqual([]);
    expect(() => territoryRates(sector().split("\n").slice(0, -1).join("\n"), "est-ensemble", one)).toThrow(/63 categories/);
    expect(() => territoryRates(sector((line) => (line[5] === "maison" ? [...line.slice(0, 5), "tous", ...line.slice(6)] : line)), "est-ensemble", one)).toThrow(/a second time/);
    expect(() => territoryRates(sector((line) => [...line.slice(0, 11), "26.0", ...line.slice(12)]), "est-ensemble", one)).toThrow(/plus 20/);
    expect(() => territoryRates(sector((line) => [...line.slice(0, 3), "2026-12-01", ...line.slice(4)]), "est-ensemble", one)).toThrow(TerritoryError);
    expect(() => territoryRates(sector(), "est-ensemble", new Map([...one, [2025, { ...decree, from: "2025-06-01", until: "2026-06-01" }]]))).toThrow(/prices no rent/);
});
