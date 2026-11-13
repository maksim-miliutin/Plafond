import { readFileSync } from "node:fs";
import { join } from "node:path";

import { checkedSpans, outlineOf, type City, type FeeCaps, type LawPeriod, type Quartier, type Span } from "@plafond/domain";
import { feeCapsOf, indexOf, lawOf, seedsFrom, type RentIndex, type Seeds } from "@plafond/import";

import { arrondissementPages, communePages, placePages, type CommunePage, type DistrictPage, type PlacePage } from "./places";

export interface Places
{
    places: PlacePage[];
    districts: DistrictPage[];
    communes: CommunePage[];
}

// Read at build time only: the build runs in apps/web, two floors above the seed.
const seed = join(process.cwd(), "..", "..", "db", "seed");

let parsed: Seeds | null = null;
let read: Places | null = null;

function seeds(): Seeds
{
    if (parsed === null)
    {
        parsed = seedsFrom((name) => readFileSync(join(seed, name), "utf8"));
    }

    return parsed;
}

export function fromDisk(): Places
{
    if (read === null)
    {
        const { paris, quartiers, lyon } = seeds();
        const places = placePages(paris, quartiers);
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

export function spansFromDisk(): Record<City, Span[]>
{
    const { paris, lyon } = seeds();
    const law = lawFromDisk();

    return { paris: checkedSpans("paris", paris, law), lyon: checkedSpans("lyon", lyon.rates, law) };
}
