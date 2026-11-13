/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { check, checkedSpans } from "@plafond/domain";

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
    expect(checkedSpans("lyon", lyon.rates, law)).toEqual([{ from: "2022-11-01", lastDay: "2026-10-31" }]);
});

test("a lease signed under the annulled decree of 2023 is priced, and carries the annulment for the screen to show", () =>
{
    const { lyon } = seedsFrom(read);
    const flat = { city: "lyon" as const, quartier: lyon.outlines[0]!.number, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const claim = { flat, surface: 2500, signedOn: "2024-02-01", startsOn: "2024-02-01", rent: 60000, complement: 0, on: "2026-11-13" };

    expect(check(claim, lyon.rates, lawOf(lawSeed))).toMatchObject({ kind: "checked", rate: { decree: { from: "2023-11-01", contest: { outcome: "annulled" } } } });
});
