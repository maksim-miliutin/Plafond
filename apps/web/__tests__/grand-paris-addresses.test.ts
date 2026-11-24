/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { geoplateforme } from "@plafond/address";
import { lawOf, seedsFrom } from "@plafond/import";

import { cityOf } from "../lib/cities";
import { next, start, type World } from "../lib/flow";
import type { LeaseFields } from "../lib/lease";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import recorded from "./ban-grand-paris.json" with { type: "json" };

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const seeds = seedsFrom((name) => files[`../../../db/seed/${name}`]!);
const law = lawOf(lawSeed);

// Twelve real addresses on both sides of the lines that split Montreuil and Saint-Denis, with the geocoder's answer as
// recorded on 22 November 2026. The DRIHL's simulator put each in the sector named here; the homes are made up, and
// each cap is the majored rent its decree prints for them times the surface.
const cases = [
    { name: "mt-b4-307", sector: 307, signedOn: "2026-07-15", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "48", cap: 107040, decree: "IDF-2026-04-28-00032" },
    { name: "mt-b4-308", sector: 308, signedOn: "2026-07-15", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "48", cap: 109440, decree: "IDF-2026-04-28-00032" },
    { name: "mt-c4-307", sector: 307, signedOn: "2022-09-01", dwelling: "house", rooms: "4", period: "before-1946", furnished: "yes", surface: "82", cap: 181220, decree: "IDF-2022-05-06-00001" },
    { name: "mt-c4-308", sector: 308, signedOn: "2022-09-01", dwelling: "house", rooms: "4", period: "before-1946", furnished: "yes", surface: "82", cap: 163180, decree: "IDF-2022-05-06-00001" },
    { name: "mt-d3-308", sector: 308, signedOn: "2024-06-01", dwelling: "house", rooms: "3", period: "after-1990", furnished: "no", surface: "65", cap: 133900, decree: "IDF-2024-05-02-00006" },
    { name: "sd-c2-311", sector: 311, signedOn: "2026-07-15", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "50", cap: 93000, decree: "IDF-2026-04-28-00033" },
    { name: "sd-c2-312", sector: 312, signedOn: "2026-07-15", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "50", cap: 102500, decree: "IDF-2026-04-28-00033" },
    { name: "sd-c4-311", sector: 311, signedOn: "2024-09-01", dwelling: "flat", rooms: "1", period: "after-1990", furnished: "yes", surface: "33", cap: 82830, decree: "IDF-2024-05-02-00007" },
    { name: "sd-c4-312", sector: 312, signedOn: "2024-09-01", dwelling: "flat", rooms: "1", period: "after-1990", furnished: "yes", surface: "33", cap: 74910, decree: "IDF-2024-05-02-00007" },
    { name: "sd-c2-312-house", sector: 312, signedOn: "2022-06-01", dwelling: "house", rooms: "3", period: "1971-1990", furnished: "no", surface: "67", cap: 111220, decree: "IDF-2022-05-06-00002" },
    { name: "ps-2024", sector: 317, signedOn: "2024-12-31", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "48", cap: 85920, decree: "IDF-2024-05-02-00007" },
    { name: "ps-2025", sector: 317, signedOn: "2025-01-01", dwelling: "flat", rooms: "2", period: "1946-1970", furnished: "no", surface: "48", cap: 85920, decree: "IDF-2024-05-02-00007" },
];

test("each of the twelve recorded addresses goes from the geocoder's answer to its sector and to the cap its decree sets", async () =>
{
    expect(recorded).toHaveLength(cases.length);
    for (const { name, sector, signedOn, cap, decree, ...home } of cases)
    {
        const feature = recorded.find((answer) => answer.case === name)!.feature;
        const lookup = await geoplateforme(async () => ({ ok: true, status: 200, json: async () => ({ features: [feature] }) }), "rent").locate(feature.properties.label);
        if (lookup.kind !== "located")
        {
            throw new Error(`${name}: the geocoder did not locate ${feature.properties.label}`);
        }

        const city = cityOf(lookup.citycode);
        const seed = city === "est-ensemble" ? seeds.estEnsemble : seeds.plaineCommune;
        const world: World = { city, rates: seed.rates, quartiers: seed.areas, on: "2026-11-23", law };
        const fields: LeaseFields = { ...home, rent: "5 000", complement: "", signedOn, startsOn: signedOn, stated: "yes" };
        const placed = next(start, { type: "located", typed: feature.properties.label, lookup }, world);
        const done = next(next(placed, { type: "confirmed" }, world), { type: "answered", fields }, world);

        expect(placed, name).toMatchObject({ at: "quartier", place: { quartier: { number: sector } } });
        expect(done, name).toMatchObject({ at: "result", check: { cap, rate: { decree: { title: `Arrêté préfectoral n° ${decree}` } } } });
    }
});
