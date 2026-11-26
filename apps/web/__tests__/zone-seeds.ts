/// <reference types="vite/client" />
import { latestFeeZone, lyonCommunesOf, metropoleOf, regionalCommunesOf, zoneHistoryOf, zoneListsOf } from "@plafond/import";

import { packRegion, unpackRegion } from "../lib/region";

import list from "../../../db/seed/grand-paris-communes.csv?raw";
import region from "../../../db/seed/ile-de-france-zones.csv?raw";
import lyonTable from "../../../db/seed/lyon-zones.csv?raw";
import sources from "../../../db/seed/zone-lists.json?raw";
import tenseHistory from "../../../db/seed/tlv-history.csv?raw";
import veryTenseHistory from "../../../db/seed/a-bis-history.csv?raw";

// The seeds as the pages read them: Île-de-France with the older versions of both lists and the names merged into each
// commune, then the communes of the Métropole de Lyon.
export const seededLists = zoneListsOf(JSON.parse(sources));
const history = zoneHistoryOf(tenseHistory, veryTenseHistory, seededLists.tenseHistory.map((list) => list.column), seededLists.veryTenseHistory.map((list) => list.column));
export const regionCommunes = regionalCommunesOf(region).map((commune) => ({ ...commune, pastTense: history.get(commune.code)!.tense, pastVeryTense: history.get(commune.code)!.veryTense }));
export const metropole = metropoleOf(list);
export const packedRegion = packRegion(regionCommunes, metropole);
export const regionList = unpackRegion(packedRegion);
export const regionNamed = (code: string) => regionList.find((commune) => commune.code === code)!;
export const lyonCommunes = lyonCommunesOf(lyonTable).map((commune) => ({ ...commune, pastTense: history.get(commune.code)!.tense, pastVeryTense: history.get(commune.code)!.veryTense }));
export const seededZones = [...regionCommunes, ...lyonCommunes].map((commune) => ({ code: commune.code, name: commune.name, zone: latestFeeZone(commune), tense: commune.tensePart === 1 }));
