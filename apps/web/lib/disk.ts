import { readFileSync } from "node:fs";
import { join } from "node:path";

import { checkedSpans, outlineOf, type City, type FeeCaps, type LawPeriod, type Quartier, type Span } from "@plafond/domain";
import { contoursOf, feeCapsOf, indexOf, lawOf, metropoleOf, seedsFrom, type Contour, type MetropoleCommune, type RentIndex, type Seeds } from "@plafond/import";

import type { MappedCity } from "./city-copy";
import type { CityMapArea } from "./map";
import { checkedTerritories, territoryOutline, type Outer } from "./metropole";
import { arrondissementPages, communePages, placePages, territoryFacts, type CommunePage, type DistrictPage, type PlacePage, type TerritoryFacts } from "./places";
import { territoryCopy } from "./territory-copy";

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

export function metropoleFromDisk(): MetropoleCommune[]
{
    return metropoleOf(readFileSync(join(seed, "grand-paris-communes.csv"), "utf8"));
}

export function lawFromDisk(): LawPeriod[]
{
    return lawOf(JSON.parse(readFileSync(join(seed, "rent-control-law.json"), "utf8")));
}

export function outlinesFromDisk(): Record<MappedCity, Quartier["rings"][]>
{
    const { quartiers, lyon } = seeds();

    return {
        paris: [outlineOf(quartiers)],
        lyon: [outlineOf(lyon.outlines.filter((area) => area.name !== "Villeurbanne")), outlineOf(lyon.outlines.filter((area) => area.name === "Villeurbanne"))],
    };
}

// The outlines of the 130 communes, checked against the list of the Métropole so that none is drawn twice or missing.
export function grandParisContoursFromDisk(): Contour[]
{
    return contoursOf(JSON.parse(readFileSync(join(seed, "grand-paris-contours.geojson"), "utf8")), metropoleFromDisk().map((commune) => commune.code));
}

// Paris keeps the outline the rent check searches; each territory around it is the union of its communes.
export function grandParisMapFromDisk(): CityMapArea[]
{
    const { quartiers } = seeds();
    const communes = metropoleFromDisk();
    const contours = grandParisContoursFromDisk();

    return [
        { territory: "paris", rings: outlineOf(quartiers) },
        ...checkedTerritories.map((territory) => ({ territory, rings: territoryOutline(territory, communes, contours) })),
    ];
}

export function spansFromDisk(): Record<City, Span[]>
{
    const { paris, lyon, estEnsemble, plaineCommune } = seeds();
    const law = lawFromDisk();

    return {
        paris: checkedSpans("paris", paris, law),
        lyon: checkedSpans("lyon", lyon.rates, law),
        "est-ensemble": checkedSpans("est-ensemble", estEnsemble.rates, law),
        "plaine-commune": checkedSpans("plaine-commune", plaineCommune.rates, law),
    };
}

export function territoryFromDisk(territory: Outer): TerritoryFacts
{
    const { estEnsemble, plaineCommune } = seeds();
    const seed = territory === "est-ensemble" ? estEnsemble : plaineCommune;

    return territoryFacts(territory, seed, lawFromDisk(), territoryCopy[territory].example);
}
