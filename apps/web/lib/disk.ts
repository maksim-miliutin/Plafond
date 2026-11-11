import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { FeeCaps } from "@plafond/domain";
import { decreesOf, feeCapsOf, lyonSeed, parisRates, quartiersOf } from "@plafond/import";

import { arrondissementPages, communePages, placePages, type CommunePage, type DistrictPage, type PlacePage } from "./places";

export interface Places
{
    places: PlacePage[];
    districts: DistrictPage[];
    communes: CommunePage[];
}

// Read at build time only: the build runs in apps/web, two floors above the seed.
const seed = join(process.cwd(), "..", "..", "db", "seed");

let read: Places | null = null;

export function fromDisk(): Places
{
    if (read === null)
    {
        const file = (name: string) => readFileSync(join(seed, name), "utf8");
        const rates = parisRates({
            table: file("paris-rates.csv"),
            annex: file("paris-annex-2026.csv"),
            sectors: file("paris-sectors-2026.csv"),
            decrees: decreesOf(JSON.parse(file("paris-decrees.json"))),
        });
        const places = placePages(rates, quartiersOf(JSON.parse(file("paris-quartiers.json"))));
        const lyon = lyonSeed({
            tables: new Map([[2022, file("lyon-2022-2023.csv")], [2024, file("lyon-2024-2025.geojson")], [2025, file("lyon-2025-2026.csv")]]),
            decrees: decreesOf(JSON.parse(file("lyon-decrees.json"))),
        });
        read = { places, districts: arrondissementPages(places), communes: communePages(lyon.rates, lyon.outlines, lyon.zoning) };
    }

    return read;
}

export function feeCapsFromDisk(): FeeCaps[]
{
    return feeCapsOf(JSON.parse(readFileSync(join(seed, "agency-fees.json"), "utf8")));
}
