import { readFileSync, writeFileSync } from "node:fs";

import { licencesFile, licencesText } from "../lib/software.ts";

const modules = new URL("../../../node_modules/", import.meta.url);
const site = new URL("../public/", import.meta.url);

writeFileSync(new URL(licencesFile, site), licencesText((file) => readFileSync(new URL(file, modules), "utf8")));
