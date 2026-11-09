/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { decreesOf, parisRates, quartiersOf } from "@plafond/import";
import type { Quartier, Rate } from "@plafond/domain";

import annex from "../../../db/seed/paris-annex-2026.csv?raw";
import table from "../../../db/seed/paris-rates.csv?raw";
import sectors from "../../../db/seed/paris-sectors-2026.csv?raw";
import decrees from "../../../db/seed/paris-decrees.json" with { type: "json" };
import outlines from "../../../db/seed/paris-quartiers.json" with { type: "json" };
import { arrondissementPages, placePages, slugOf } from "../lib/places";
import { rate } from "./fixtures";

test("a quartier's name becomes an address without accents, apostrophes or capitals", () =>
{
    expect(slugOf("Saint-Germain-l'Auxerrois")).toBe("saint-germain-l-auxerrois");
    expect(slugOf("Place-Vendôme")).toBe("place-vendome");
    expect(slugOf("Chaussée-d'Antin")).toBe("chaussee-d-antin");
});

test("a quartier's page holds the majored rents of the latest decree only, empty and furnished, for every size and period", () =>
{
    const empty: Rate = { ...rate, flat: { ...rate.flat, furnished: false } };
    const older: Rate = { ...empty, majored: 1000, decree: { ...rate.decree, from: "2024-07-01", until: "2025-07-01" } };
    const furnished: Rate = { ...rate, majored: 4000 };
    const quartier: Quartier = { number: rate.flat.quartier, name: "Saint-Germain-l'Auxerrois", rings: [] };
    const [page] = placePages([older, empty, furnished], [quartier]);

    expect(page).toMatchObject({ slug: "saint-germain-l-auxerrois", arrondissement: 1, decree: { from: rate.decree.from } });
    expect(page!.rents).toEqual([{ rooms: rate.flat.rooms, period: rate.flat.period, empty: 3200, furnished: 4000 }]);
});

test("every one of the 80 quartiers gets a page with 16 rents, under addresses that never collide", () =>
{
    const rates = parisRates({ table, annex, sectors, decrees: decreesOf(decrees) });
    const pages = placePages(rates, quartiersOf(outlines));

    expect(pages).toHaveLength(80);
    expect(new Set(pages.map((page) => page.slug)).size).toBe(80);
    for (const page of pages)
    {
        expect(page.rents, page.name).toHaveLength(16);
        expect(page.rents.every((rent) => rent.empty > 0 && rent.furnished > rent.empty), page.name).toBe(true);
    }
});

test("each arrondissement gathers its four quartiers, with the lowest and highest cap among them", () =>
{
    const rates = parisRates({ table, annex, sectors, decrees: decreesOf(decrees) });
    const districts = arrondissementPages(placePages(rates, quartiersOf(outlines)));

    expect(districts).toHaveLength(20);
    expect(districts[0]).toMatchObject({ number: 1, slug: "paris-1er" });
    expect(districts[19]).toMatchObject({ number: 20, slug: "paris-20e" });
    for (const district of districts)
    {
        expect(district.quartiers, district.slug).toHaveLength(4);
        expect(district.lowest, district.slug).toBeLessThan(district.highest);
    }
});

test("every quartier's title and description fit what search engines show", async () =>
{
    const { placeMetadata } = await import("../lib/site");
    const rates = parisRates({ table, annex, sectors, decrees: decreesOf(decrees) });

    for (const page of placePages(rates, quartiersOf(outlines)))
    {
        const described = placeMetadata(page);

        expect(String(described.title).length, page.name).toBeLessThanOrEqual(60);
        expect(String(described.description).length, page.name).toBeLessThanOrEqual(160);
    }
});

test("every arrondissement's title and description fit what search engines show", async () =>
{
    const { districtMetadata } = await import("../lib/site");
    const rates = parisRates({ table, annex, sectors, decrees: decreesOf(decrees) });

    for (const district of arrondissementPages(placePages(rates, quartiersOf(outlines))))
    {
        const described = districtMetadata(district);

        expect(String(described.title).length, district.slug).toBeLessThanOrEqual(60);
        expect(String(described.description).length, district.slug).toBeLessThanOrEqual(160);
    }
});

test("each of Lyon's ten communes gets a page with the zones it lies in, each zone with its 20 rents of the latest decree", async () =>
{
    const { lyonSeed } = await import("@plafond/import");
    const { communePages } = await import("../lib/places");
    const lyonEarly = (await import("../../../db/seed/lyon-2022-2023.csv?raw")).default;
    const lyonRecent = (await import("../../../db/seed/lyon-2025-2026.csv?raw")).default;
    const lyonDecrees = (await import("../../../db/seed/lyon-decrees.json")).default;
    const seeded = lyonSeed({ tables: new Map([[2022, lyonEarly], [2025, lyonRecent]]), decrees: decreesOf(lyonDecrees) });
    const pages = communePages(seeded.rates, seeded.outlines, seeded.zoning);

    expect(pages.map((page) => page.slug)).toEqual([
        ...Array.from({ length: 9 }, (_, index) => `lyon-${index === 0 ? "1er" : `${index + 1}e`}-arrondissement`),
        "villeurbanne",
    ]);
    for (const page of pages)
    {
        expect(page.decree.from, page.slug).toBe("2025-11-01");
        expect(page.zones.length, page.slug).toBeGreaterThanOrEqual(1);
        expect(page.zones.every((zone) => zone.rents.length === 20 && zone.rents.every((rent) => rent.furnished > rent.empty)), page.slug).toBe(true);
    }

    const { communeMetadata } = await import("../lib/site");
    for (const page of pages)
    {
        expect(String(communeMetadata(page).title).length, page.slug).toBeLessThanOrEqual(60);
        expect(String(communeMetadata(page).description).length, page.slug).toBeLessThanOrEqual(160);
    }
});
