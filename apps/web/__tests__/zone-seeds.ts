/// <reference types="vite/client" />
import { latestFeeZone, metropoleOf, regionalCommunesOf, zoneListsOf, zonesOf, type CommuneZone } from "@plafond/import";

import { packRegion, unpackRegion } from "../lib/region";

import list from "../../../db/seed/grand-paris-communes.csv?raw";
import region from "../../../db/seed/ile-de-france-zones.csv?raw";
import table from "../../../db/seed/commune-zones.csv?raw";
import sources from "../../../db/seed/zone-lists.json?raw";

// The seeds as the pages read them: Île-de-France with the names merged into each commune, then the communes around Lyon.
export const regionCommunes = regionalCommunesOf(region);
export const metropole = metropoleOf(list);
export const packedRegion = packRegion(regionCommunes, metropole);
export const regionList = unpackRegion(packedRegion);
export const regionNamed = (code: string) => regionList.find((commune) => commune.code === code)!;
export const seededZones: CommuneZone[] = [
    ...regionCommunes.map((commune) => ({ code: commune.code, name: commune.name, zone: latestFeeZone(commune) })),
    ...zonesOf(table),
];
export const seededLists = zoneListsOf(JSON.parse(sources));
