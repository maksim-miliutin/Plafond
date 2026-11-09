import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

import { pack, packQuartiers } from "@plafond/domain";
import { decreesOf, lyonSeed, parisRates, quartiersOf } from "@plafond/import";

import { quartiersFile, ratesFile, tableFiles } from "../lib/load.ts";

const seed = new URL("../../../db/seed/", import.meta.url);
const site = new URL("../public/", import.meta.url);
const read = (name: string) => readFileSync(new URL(name, seed), "utf8");

const decrees = decreesOf(JSON.parse(read("paris-decrees.json")));
const rates = parisRates({
    table: read("paris-rates.csv"),
    annex: read("paris-annex-2026.csv"),
    sectors: read("paris-sectors-2026.csv"),
    decrees,
});
const quartiers = quartiersOf(JSON.parse(read("paris-quartiers.json")));

mkdirSync(site, { recursive: true });
writeFileSync(new URL(ratesFile, site), JSON.stringify(pack(rates)));
writeFileSync(new URL(quartiersFile, site), JSON.stringify(packQuartiers(quartiers)));

const lyon = lyonSeed({
    tables: new Map([[2022, read("lyon-2022-2023.csv")], [2024, read("lyon-2024-2025.geojson")], [2025, read("lyon-2025-2026.csv")]]),
    decrees: decreesOf(JSON.parse(read("lyon-decrees.json"))),
});

writeFileSync(new URL(tableFiles.lyon.rates, site), JSON.stringify(pack(lyon.rates)));
writeFileSync(new URL(tableFiles.lyon.areas, site), JSON.stringify(packQuartiers(lyon.outlines)));
