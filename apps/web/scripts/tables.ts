import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { pack, packQuartiers } from "@plafond/domain";
import { seedsFrom } from "@plafond/import";

import { quartiersFile, ratesFile, tableFiles } from "../lib/load.ts";

const seed = new URL("../../../db/seed/", import.meta.url);
const site = new URL("../public/", import.meta.url);
const { paris, quartiers, lyon } = seedsFrom((name) => readFileSync(new URL(name, seed), "utf8"));

mkdirSync(site, { recursive: true });
writeFileSync(new URL(ratesFile, site), JSON.stringify(pack(paris)));
writeFileSync(new URL(quartiersFile, site), JSON.stringify(packQuartiers(quartiers)));
writeFileSync(new URL(tableFiles.lyon.rates, site), JSON.stringify(pack(lyon.rates)));
writeFileSync(new URL(tableFiles.lyon.areas, site), JSON.stringify(packQuartiers(lyon.outlines)));
