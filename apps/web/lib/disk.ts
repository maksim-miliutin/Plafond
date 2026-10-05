import { readFileSync } from "node:fs";
import { join } from "node:path";

import { decreesOf, parisRates, quartiersOf } from "@plafond/import";

import { arrondissementPages, placePages, type DistrictPage, type PlacePage } from "./places";

export interface Places
{
    places: PlacePage[];
    districts: DistrictPage[];
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
        read = { places, districts: arrondissementPages(places) };
    }

    return read;
}
