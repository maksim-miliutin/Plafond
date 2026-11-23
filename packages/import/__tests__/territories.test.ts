/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { check, quartierAt, type Decree, type Dwelling, type Period, type Rooms } from "@plafond/domain";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import decreeSeed from "../../../db/seed/est-ensemble-decrees.json" with { type: "json" };
import { decreesOf } from "../src/decrees.js";
import { lawOf } from "../src/law.js";
import { seedsFrom } from "../src/seed.js";
import { TerritoryError, territoryAreas, territoryRates } from "../src/territories.js";

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

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const seeds = seedsFrom((name) => files[`../../../db/seed/${name}`]!);

// Annex 1 of the decree: nine communes, Montreuil twice as its two infra-communal sectors.
test("each Est Ensemble commune is one area in its sector, and only Montreuil's two are outlined", () =>
{
    const areas = seeds.estEnsemble.areas;

    expect(areas.map((area) => `${area.name} ${area.number}`)).toEqual([
        "Bagnolet 308", "Bobigny 315", "Bondy 318", "Les Lilas 307", "Montreuil 307", "Montreuil 308",
        "Noisy-le-Sec 311", "Pantin 308", "Le Pré-Saint-Gervais 308", "Romainville 313",
    ]);
    expect(areas.filter((area) => area.rings.length > 0).map((area) => area.number)).toEqual([307, 308]);
});

// Points read off the detail sheets of annex 5 on each side of the 307/308 line, at least 25 m from it, and the five
// Montreuil addresses the national address base places there, each put in its sector by the DRIHL's simulator.
const montreuil = [
    { sheet: "B4", at: { lon: 2.43406892, lat: 48.85954018 }, sector: 307 },
    { sheet: "B4", at: { lon: 2.43338256, lat: 48.85998661 }, sector: 308 },
    { sheet: "C4", at: { lon: 2.44953115, lat: 48.86033575 }, sector: 307 },
    { sheet: "C4", at: { lon: 2.4495378, lat: 48.85970624 }, sector: 308 },
    { sheet: "D3", at: { lon: 2.46292355, lat: 48.86390935 }, sector: 307 },
    { sheet: "D3", at: { lon: 2.46293004, lat: 48.86327984 }, sector: 308 },
    { sheet: "29 Rue Parmentier", at: { lon: 2.434058, lat: 48.859669 }, sector: 307 },
    { sheet: "4 Sentier du Tourniquet", at: { lon: 2.433312, lat: 48.860537 }, sector: 308 },
    { sheet: "13 Rue Eugène Varlin", at: { lon: 2.448212, lat: 48.861085 }, sector: 307 },
    { sheet: "25 Avenue Jean Moulin", at: { lon: 2.449468, lat: 48.859624 }, sector: 308 },
    { sheet: "110 Rue Pierre de Montreuil", at: { lon: 2.463048, lat: 48.86344 }, sector: 308 },
];

test("a point in Montreuil falls in the sector the decree's maps give it, on both sides of the line", () =>
{
    const split = seeds.estEnsemble.areas.filter((area) => area.commune === "93048");

    for (const { sheet, at, sector } of montreuil)
    {
        expect(quartierAt(at, split), sheet).toEqual({ kind: "found", quartier: sector });
    }
});

test("an Est Ensemble commune of one sector is one area without outline, under its INSEE code, and no other commune is one", () =>
{
    expect(seeds.estEnsemble.areas.find((area) => area.commune === "93055")).toEqual({ number: 308, name: "Pantin", rings: [], commune: "93055" });
    expect(seeds.estEnsemble.areas.some((area) => area.commune === "93070")).toBe(false);
});

test("a commune put twice in one sector, a split commune missing an outline, or an outline of an unsplit commune is refused", () =>
{
    const outlines = files["../../../db/seed/est-ensemble-sectors.geojson"]!;
    const listed = (...lines: string[]) => ["code;name;sector", ...lines].join("\n");
    const empty = JSON.stringify({ type: "FeatureCollection", features: [] });

    expect(territoryAreas(listed("93055;Pantin;308"), empty)).toEqual([{ number: 308, name: "Pantin", rings: [], commune: "93055" }]);
    expect(() => territoryAreas(listed("93055;Pantin;308", "93055;Pantin;308"), empty)).toThrow(/twice/);
    expect(() => territoryAreas(listed("93048;Montreuil;307", "93048;Montreuil;308"), empty)).toThrow(/0 outlines/);
    expect(() => territoryAreas(listed("93048;Montreuil;307"), outlines)).toThrow(/does not split/);
    expect(() => territoryAreas("code;nom;secteur\n93055;Pantin;308", empty)).toThrow(TerritoryError);
});

// The first publication of the 2024 decree left out the two Bondy grids; a table copied from it must not pass.
test("a decree that leaves out the sector of one commune is refused, as the first 2024 publication left out Bondy", () =>
{
    const withoutBondy = (name: string) =>
    {
        const text = files[`../../../db/seed/${name}`]!;

        return name === "grand-paris-rates.csv" ? text.split("\n").filter((line) => !line.startsWith("est-ensemble,2024,") || !line.includes(",318,")).join("\n") : text;
    };

    expect(() => seedsFrom(withoutBondy)).toThrow(/Bondy lies in sector 318, which Arrêté préfectoral n° IDF-2024-05-02-00006 does not price/);
});
