/// <reference types="vite/client" />
import { expect, test } from "vitest";

import annex from "../../../db/seed/paris-annex-2026.csv?raw";
import table from "../../../db/seed/paris-rates.csv?raw";
import sectors from "../../../db/seed/paris-sectors-2026.csv?raw";
import seed from "../../../db/seed/paris-decrees.json" with { type: "json" };
import { annexRates } from "../src/annex.js";
import { decreesOf } from "../src/decrees.js";
import { parisRates } from "../src/seed.js";
import { parseParis } from "../src/paris.js";

// The decrees cover every day from July 2019 to the end of the experiment; each must come with every flat priced.
test("every decree in the seed comes with a rent for every flat in every quartier", () =>
{
    const decrees = decreesOf(seed);
    const rates = parisRates({ table, annex, sectors, decrees });
    const counted = new Map<string, number>();
    for (const rate of rates)
    {
        counted.set(rate.decree.from, (counted.get(rate.decree.from) ?? 0) + 1);
    }

    expect([...decrees.values()].map((decree) => [decree.from, counted.get(decree.from)])).toEqual(
        [...decrees.values()].map((decree) => [decree.from, 80 * 32]),
    );
});

test("the 2026 rents come from the decree and the earlier ones from the published table, unchanged", () =>
{
    const decrees = decreesOf(seed);
    const rates = parisRates({ table, annex, sectors, decrees });
    const latest = [...decrees.values()].find((decree) => decree.from === "2026-07-01")!;

    expect(rates.filter((rate) => rate.decree.from !== "2026-07-01")).toEqual(parseParis(table, decrees));
    expect(rates.filter((rate) => rate.decree.from === "2026-07-01")).toEqual(annexRates(annex, sectors, latest));
});
