import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { pack } from "@plafond/domain";
import { decreesOf, parseParis } from "@plafond/import";

import { ratesFile } from "../lib/rates.ts";

const seed = new URL("../../../db/seed/", import.meta.url);
const site = new URL("../public/", import.meta.url);

const decrees = decreesOf(JSON.parse(readFileSync(new URL("paris-decrees.json", seed), "utf8")));
const rates = parseParis(readFileSync(new URL("paris-rates.csv", seed), "utf8"), decrees);

mkdirSync(site, { recursive: true });
writeFileSync(new URL(ratesFile, site), JSON.stringify(pack(rates)));
