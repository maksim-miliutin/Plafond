/// <reference types="vite/client" />
import { latestFeeZone, regionalCommunesOf, zoneListsOf, zonesOf, type CommuneZone } from "@plafond/import";

import region from "../../../db/seed/ile-de-france-zones.csv?raw";
import table from "../../../db/seed/commune-zones.csv?raw";
import sources from "../../../db/seed/zone-lists.json?raw";

// The zones as disk.ts reads them: Île-de-France by the latest lists, then the communes drawn around Lyon.
export const regionCommunes = regionalCommunesOf(region);
export const seededZones: CommuneZone[] = [
    ...regionCommunes.map((commune) => ({ code: commune.code, name: commune.name, zone: latestFeeZone(commune) })),
    ...zonesOf(table),
];
export const seededLists = zoneListsOf(JSON.parse(sources));
