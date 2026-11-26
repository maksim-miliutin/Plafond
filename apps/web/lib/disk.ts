import { readFileSync } from "node:fs";
import { join } from "node:path";

import { arrondissementOf, checkedSpans, outlineOf, type City, type FeeCaps, type LawPeriod, type Quartier, type RelocationPeriod, type Span } from "@plafond/domain";
import { contoursOf, feeCapsOf, indexOf, latestFeeZone, lawOf, lyonCommunesOf, metropoleOf, regionalCommunesOf, relocationRulesOf, seedsFrom, zoneHistoryOf, zoneListsOf, type CommuneZone, type Contour, type RegionalCommune, type MetropoleCommune, type RentIndex, type Seeds, type ZoneLists } from "@plafond/import";

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

export function relocationRulesFromDisk(): RelocationPeriod[]
{
    return relocationRulesOf(JSON.parse(readFileSync(join(seed, "relocation-rules.json"), "utf8")));
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

// A table of communes with the older versions of both lists, as zone-lists.json orders them.
function withHistory(communes: RegionalCommune[]): RegionalCommune[]
{
    const lists = zoneListsFromDisk();
    const history = zoneHistoryOf(
        readFileSync(join(seed, "tlv-history.csv"), "utf8"),
        readFileSync(join(seed, "a-bis-history.csv"), "utf8"),
        lists.tenseHistory.map((list) => list.column),
        lists.veryTenseHistory.map((list) => list.column),
    );

    return communes.map((commune) =>
    {
        const past = history.get(commune.code);
        if (past === undefined)
        {
            throw new Error(`no older zone is known for commune ${commune.code}`);
        }

        return { ...commune, pastTense: past.tense, pastVeryTense: past.veryTense };
    });
}

export function regionFromDisk(): RegionalCommune[]
{
    return withHistory(regionalCommunesOf(readFileSync(join(seed, "ile-de-france-zones.csv"), "utf8")));
}

export function lyonFromDisk(): RegionalCommune[]
{
    return withHistory(lyonCommunesOf(readFileSync(join(seed, "lyon-zones.csv"), "utf8")));
}

// The communes the forms take from a link: Île-de-France and the Métropole de Lyon, Lyon and Villeurbanne capped.
export function checkedCommunesFromDisk(): { communes: RegionalCommune[]; capped: string[] }
{
    const metropole = metropoleFromDisk();

    return {
        communes: [...regionFromDisk(), ...lyonFromDisk()],
        capped: [...metropole.filter((commune) => commune.territory !== null).map((commune) => commune.code), "69123", "69266"],
    };
}

// Every commune whose zone Plafond knows, by the latest lists: Île-de-France, then the Métropole de Lyon.
export function zonesFromDisk(): (CommuneZone & { tense: boolean })[]
{
    return [...regionFromDisk(), ...lyonFromDisk()].map((commune) => ({ code: commune.code, name: commune.name, zone: latestFeeZone(commune), tense: commune.tensePart === 1 }));
}

export function zoneListsFromDisk(): ZoneLists
{
    return zoneListsOf(JSON.parse(readFileSync(join(seed, "zone-lists.json"), "utf8")));
}

// The two maps of the first screen, drawn once at build time: the Grand Paris commune by commune, and Lyon.
export function homeMapsFromDisk(tolerance: number): { grandParis: Drawing; lyon: Drawing }
{
    const { quartiers, lyon } = seeds();
    const communes = metropoleFromDisk();
    const territoryOf = new Map(communes.map((commune) => [commune.code, commune.territory]));
    const zones = new Map(zonesFromDisk().map((row) => [row.code, row]));
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
        return { ...contour, territory: territory === "est-ensemble" || territory === "plaine-commune" ? territory : null, zone: zoneOf(contour.code).zone, tense: zoneOf(contour.code).tense };
    });
    const regions = contoursOf(JSON.parse(readFileSync(join(seed, "ile-de-france-departements.geojson"), "utf8")), departments);

    const slugs = new Map(fromDisk().communes.map((commune) => [commune.name, commune.slug]));
    const names = [...new Set(lyon.outlines.map((area) => area.name))];
    const lyonAreas = names.map((name) =>
    {
        const code = name === "Villeurbanne" ? "69266" : "69123";
        return { name, slug: slugs.get(name) ?? "", rings: outlineOf(lyon.outlines.filter((area) => area.name === name)), code, zone: zoneOf(code).zone, tense: zoneOf(code).tense };
    });
    const around = contoursOf(JSON.parse(readFileSync(join(seed, "lyon-metropole-contours.geojson"), "utf8")))
        .filter((contour) => contour.code !== "69123" && contour.code !== "69266")
        .map((contour) => ({ ...contour, zone: zoneOf(contour.code).zone, tense: zoneOf(contour.code).tense }));

    return {
        grandParis: grandParisDrawing({ arrondissements, communes: outer, paris: outlineOf(quartiers), parisZone: zoneOf("75056").zone, parisTense: zoneOf("75056").tense, parisContour: contours.find((contour) => contour.code === "75056")!.rings, departments: regions }, tolerance),
        lyon: lyonDrawing({ areas: lyonAreas, communes: around }, tolerance),
    };
}
