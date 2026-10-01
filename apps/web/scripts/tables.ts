import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { pack, packQuartiers } from "@plafond/domain";
import { decreesOf, parseParis, quartiersOf } from "@plafond/import";

import { quartiersFile, ratesFile } from "../lib/load.ts";

const seed = new URL("../../../db/seed/", import.meta.url);
const site = new URL("../public/", import.meta.url);
const read = (name: string) => readFileSync(new URL(name, seed), "utf8");

const decrees = decreesOf(JSON.parse(read("paris-decrees.json")));
const rates = parseParis(read("paris-rates.csv"), decrees);
const quartiers = quartiersOf(JSON.parse(read("paris-quartiers.json")));

mkdirSync(site, { recursive: true });
writeFileSync(new URL(ratesFile, site), JSON.stringify(pack(rates)));
writeFileSync(new URL(quartiersFile, site), JSON.stringify(packQuartiers(quartiers)));
