/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { checkedSpans } from "@plafond/domain";

import early from "../../../db/seed/lyon-2022-2023.csv?raw";
import geojson from "../../../db/seed/lyon-2024-2025.geojson?raw";
import recent from "../../../db/seed/lyon-2025-2026.csv?raw";
import lyonDecrees from "../../../db/seed/lyon-decrees.json" with { type: "json" };
import annex from "../../../db/seed/paris-annex-2026.csv?raw";
import table from "../../../db/seed/paris-rates.csv?raw";
import sectors from "../../../db/seed/paris-sectors-2026.csv?raw";
import parisDecrees from "../../../db/seed/paris-decrees.json" with { type: "json" };
import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { decreesOf } from "../src/decrees.js";
import { lawOf } from "../src/law.js";
import { lyonSeed, parisRates } from "../src/seed.js";

// The Lyon page once promised leases from 1 November 2021, though no table of the 2021 or the 2023 decree is in the seeds.
test("the seeds date the leases Plafond can check, gaps included", () =>
{
    const law = lawOf(lawSeed);
    const paris = parisRates({ table, annex, sectors, decrees: decreesOf(parisDecrees) });
    const lyon = lyonSeed({ tables: new Map([[2022, early], [2024, geojson], [2025, recent]]), decrees: decreesOf(lyonDecrees) }).rates;

    expect(checkedSpans("paris", paris, law)).toEqual([{ from: "2019-07-01", lastDay: "2026-11-24" }]);
    expect(checkedSpans("lyon", lyon, law)).toEqual([
        { from: "2022-11-01", lastDay: "2023-10-31" },
        { from: "2024-11-01", lastDay: "2026-10-31" },
    ]);
});
