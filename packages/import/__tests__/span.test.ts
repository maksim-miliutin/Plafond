/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { checkedSpans } from "@plafond/domain";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { lawOf } from "../src/law.js";
import { seedsFrom } from "../src/seed.js";

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function read(name: string): string
{
    const text = files[`../../../db/seed/${name}`];
    if (text === undefined)
    {
        throw new Error(`no seed file is called ${name}`);
    }

    return text;
}

// The Lyon page once promised leases from 1 November 2021, though no table of the 2021 or the 2023 decree was loaded.
test("the seeds the site reads date the leases Plafond can check, gaps included", () =>
{
    const { paris, lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);

    expect(checkedSpans("paris", paris, law)).toEqual([{ from: "2019-07-01", lastDay: "2026-11-24" }]);
    expect(checkedSpans("lyon", lyon.rates, law)).toEqual([
        { from: "2022-11-01", lastDay: "2023-10-31" },
        { from: "2024-11-01", lastDay: "2026-10-31" },
    ]);
});
