import { readFileSync } from "node:fs";
import { join } from "node:path";

import { arrondissementOf, checkedSpans, outlineOf, type City, type FeeCaps, type LawPeriod, type Quartier, type Span } from "@plafond/domain";
import { contoursOf, feeCapsOf, indexOf, lawOf, metropoleOf, seedsFrom, zonesOf, type Contour, type MetropoleCommune, type RentIndex, type Seeds } from "@plafond/import";

import type { MappedCity } from "./city-copy";
import { grandParisDrawing, lyonDrawing, type Drawing } from "./home-map";
import type { CityMapArea } from "./map";
import { checkedTerritories, territoryOutline, type Outer } from "./metropole";
import { arrondissementPages, communePages, districtSlug, placePages, territoryFacts, type CommunePage, type DistrictPage, type PlacePage, type TerritoryFacts } from "./places";
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

const departments = ["75", "77", "78", "91", "92", "93", "94", "95"];

// The two maps of the first screen, drawn once at build time: the Grand Paris commune by commune, and Lyon.
export function homeMapsFromDisk(tolerance: number): { grandParis: Drawing; lyon: Drawing }
{
    const { quartiers, lyon } = seeds();
    const communes = metropoleFromDisk();
    const territoryOf = new Map(communes.map((commune) => [commune.code, commune.territory]));
    const zones = new Map(zonesOf(readFileSync(join(seed, "commune-zones.csv"), "utf8")).map((row) => [row.code, row.zone]));
    const zoneOf = (code: string) =>
    {
        const zone = zones.get(code);
        if (zone === undefined)
        {
            throw new Error(`no zone is known for commune ${code}`);
        }

        return zone;
    };
    const contours = grandParisContoursFromDisk();
    const arrondissements = [...new Set(quartiers.map((quartier) => arrondissementOf(quartier.number)))].map((number) => ({
        number,
        slug: districtSlug(number),
        rings: outlineOf(quartiers.filter((quartier) => arrondissementOf(quartier.number) === number)),
    }));
    const outer = contours.filter((contour) => contour.code !== "75056").map((contour) =>
    {
        const territory = territoryOf.get(contour.code);
        return { ...contour, territory: territory === "est-ensemble" || territory === "plaine-commune" ? territory : null, zone: zoneOf(contour.code) };
    });
    const regions = contoursOf(JSON.parse(readFileSync(join(seed, "ile-de-france-departements.geojson"), "utf8")), departments);

    const slugs = new Map(fromDisk().communes.map((commune) => [commune.name, commune.slug]));
    const names = [...new Set(lyon.outlines.map((area) => area.name))];
    const lyonAreas = names.map((name) => ({ name, slug: slugs.get(name) ?? "", rings: outlineOf(lyon.outlines.filter((area) => area.name === name)) }));
    const around = contoursOf(JSON.parse(readFileSync(join(seed, "lyon-metropole-contours.geojson"), "utf8")))
        .filter((contour) => contour.code !== "69123" && contour.code !== "69266")
        .map((contour) => ({ ...contour, zone: zoneOf(contour.code) }));

    return {
        grandParis: grandParisDrawing({ arrondissements, communes: outer, paris: outlineOf(quartiers), parisContour: contours.find((contour) => contour.code === "75056")!.rings, departments: regions }, tolerance),
        lyon: lyonDrawing({ areas: lyonAreas, communes: around }, tolerance),
    };
}
