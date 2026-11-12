import { readFileSync } from "node:fs";
import { join } from "node:path";

import { outlineOf, type City, type FeeCaps, type LawPeriod, type Quartier } from "@plafond/domain";
import { decreesOf, feeCapsOf, indexOf, lawOf, lyonSeed, parisRates, quartiersOf, type RentIndex } from "@plafond/import";

import { arrondissementPages, communePages, placePages, type CommunePage, type DistrictPage, type PlacePage } from "./places";

export interface Places
{
    places: PlacePage[];
    districts: DistrictPage[];
    communes: CommunePage[];
}

// Read at build time only: the build runs in apps/web, two floors above the seed.
const seed = join(process.cwd(), "..", "..", "db", "seed");

interface Seeds
{
    rates: ReturnType<typeof parisRates>;
    quartiers: Quartier[];
    lyon: ReturnType<typeof lyonSeed>;
}

let parsed: Seeds | null = null;
let read: Places | null = null;

function seeds(): Seeds
{
    if (parsed === null)
    {
        const file = (name: string) => readFileSync(join(seed, name), "utf8");
        parsed = {
            rates: parisRates({
                table: file("paris-rates.csv"),
                annex: file("paris-annex-2026.csv"),
                sectors: file("paris-sectors-2026.csv"),
                decrees: decreesOf(JSON.parse(file("paris-decrees.json"))),
            }),
            quartiers: quartiersOf(JSON.parse(file("paris-quartiers.json"))),
            lyon: lyonSeed({
                tables: new Map([[2022, file("lyon-2022-2023.csv")], [2024, file("lyon-2024-2025.geojson")], [2025, file("lyon-2025-2026.csv")]]),
                decrees: decreesOf(JSON.parse(file("lyon-decrees.json"))),
            }),
        };
    }

    return parsed;
}

export function fromDisk(): Places
{
    if (read === null)
    {
        const { rates, quartiers, lyon } = seeds();
        const places = placePages(rates, quartiers);
        read = { places, districts: arrondissementPages(places), communes: communePages(lyon.rates, lyon.outlines, lyon.zoning) };
    }

    return read;
}

export function feeCapsFromDisk(): FeeCaps[]
{
    return feeCapsOf(JSON.parse(readFileSync(join(seed, "agency-fees.json"), "utf8")));
}

export function indexFromDisk(): RentIndex
{
    return indexOf(JSON.parse(readFileSync(join(seed, "irl.json"), "utf8")));
}

export function lawFromDisk(): LawPeriod[]
{
    return lawOf(JSON.parse(readFileSync(join(seed, "rent-control-law.json"), "utf8")));
}

export function outlinesFromDisk(): Record<City, Quartier["rings"][]>
{
    const { quartiers, lyon } = seeds();

    return {
        paris: [outlineOf(quartiers)],
        lyon: [outlineOf(lyon.outlines.filter((area) => area.name !== "Villeurbanne")), outlineOf(lyon.outlines.filter((area) => area.name === "Villeurbanne"))],
    };
}
