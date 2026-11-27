import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { pack, packQuartiers } from "@plafond/domain";
import { contoursOf, metropoleOf, regionalCommunesOf, seedsFrom } from "@plafond/import";

import { regionDrawing } from "../lib/home-map.ts";
import { quartiersFile, ratesFile, regionMapFile, tableFiles } from "../lib/load.ts";

const seed = new URL("../../../db/seed/", import.meta.url);
const site = new URL("../public/", import.meta.url);
const { paris, quartiers, lyon, estEnsemble, plaineCommune } = seedsFrom((name) => readFileSync(new URL(name, seed), "utf8"));

mkdirSync(site, { recursive: true });
writeFileSync(new URL(ratesFile, site), JSON.stringify(pack(paris)));
writeFileSync(new URL(quartiersFile, site), JSON.stringify(packQuartiers(quartiers)));
writeFileSync(new URL(tableFiles.lyon.rates, site), JSON.stringify(pack(lyon.rates)));
writeFileSync(new URL(tableFiles.lyon.areas, site), JSON.stringify(packQuartiers(lyon.outlines)));
writeFileSync(new URL(tableFiles["est-ensemble"].rates, site), JSON.stringify(pack(estEnsemble.rates)));
writeFileSync(new URL(tableFiles["est-ensemble"].areas, site), JSON.stringify(packQuartiers(estEnsemble.areas)));
writeFileSync(new URL(tableFiles["plaine-commune"].rates, site), JSON.stringify(pack(plaineCommune.rates)));
writeFileSync(new URL(tableFiles["plaine-commune"].areas, site), JSON.stringify(packQuartiers(plaineCommune.areas)));

// The plan of Île-de-France, which the first screen loads only when its tab is opened.
const read = (name: string) => readFileSync(new URL(name, seed), "utf8");
const region = regionalCommunesOf(read("ile-de-france-zones.csv"));
const outlines = contoursOf(JSON.parse(read("ile-de-france-communes.geojson")), region.map((commune) => commune.code));
const metropole = metropoleOf(read("grand-paris-communes.csv"));
writeFileSync(new URL(regionMapFile, site), JSON.stringify(regionDrawing(outlines, region, metropole)));
