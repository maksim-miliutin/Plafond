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
    expect(checkedSpans("lyon", lyon.rates, law)).toEqual([{ from: "2021-11-01", lastDay: "2026-11-23" }]);
});

test("a lease signed under the annulled decree of 2023 is priced, and carries the annulment for the screen to show", () =>
{
    const { lyon } = seedsFrom(read);
    const flat = { city: "lyon" as const, quartier: lyon.outlines[0]!.number, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const claim = { flat, surface: 2500, signedOn: "2024-02-01", startsOn: "2024-02-01", rent: 60000, complement: 0, on: "2026-11-13" };

    expect(check(claim, lyon.rates, lawOf(lawSeed))).toMatchObject({ kind: "checked", rate: { decree: { from: "2023-11-01", contest: { outcome: "annulled" } } } });
});

// Article 3 of each Lyon decree sets these edges. The 2026 decree stops on 23 November 2026, while the law of
// 21 November 2026 runs the control on to 24 November 2028: between the two a lease finds no rate, not a lapsed law.
test("a Lyon lease is priced by the decree in force on the day it was signed, edge days included", () =>
{
    const { lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const flat = { city: "lyon" as const, quartier: lyon.outlines[0]!.number, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const signed = (day: string) =>
    {
        const result = check({ flat, surface: 2500, signedOn: day, startsOn: day, rent: 60000, complement: 0, on: "2026-11-13" }, lyon.rates, law);
        if (result.kind === "checked")
        {
            return `decree from ${result.rate.decree.from}`;
        }

        return result.kind === "no-rate" ? `no rate, ${result.side}` : result.kind;
    };

    expect(signed("2021-10-31")).toBe("no rate, before");
    expect(signed("2021-11-01")).toBe("decree from 2021-11-01");
    expect(signed("2022-10-31")).toBe("decree from 2021-11-01");
    expect(signed("2022-11-01")).toBe("decree from 2022-11-01");
    expect(signed("2026-10-31")).toBe("decree from 2025-11-01");
    expect(signed("2026-11-01")).toBe("decree from 2026-11-01");
    expect(signed("2026-11-23")).toBe("decree from 2026-11-01");
    expect(signed("2026-11-24")).toBe("no rate, after");
    expect(signed("2026-11-25")).toBe("no rate, after");
    expect(signed("2028-11-24")).toBe("no rate, after");
    expect(signed("2028-11-25")).toBe("lapsed");
});

// The bug this guards: the law of 21 November 2026 extended the control to 24 November 2028, yet a Paris lease signed
// on 25 November 2026 was still told that no published text extends it. The 2026 decree itself stops on 24 November.
test("a Paris lease signed after the 2026 decree finds no rate under the extended law, and lapses only after 24 November 2028", () =>
{
    const { paris } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const flat = paris.find((rate) => rate.decree.from === "2026-07-01")!.flat;
    const signed = (day: string) =>
    {
        const result = check({ flat, surface: 2500, signedOn: day, startsOn: day, rent: 60000, complement: 0, on: "2026-11-22" }, paris, law);
        if (result.kind === "checked")
        {
            return `decree from ${result.rate.decree.from}`;
        }

        return result.kind === "no-rate" ? `no rate, ${result.side}` : result.kind;
    };

    expect(signed("2026-06-30")).toBe("decree from 2025-07-01");
    expect(signed("2026-07-01")).toBe("decree from 2026-07-01");
    expect(signed("2026-11-24")).toBe("decree from 2026-07-01");
    expect(signed("2026-11-25")).toBe("no rate, after");
    expect(signed("2028-11-24")).toBe("no rate, after");
    expect(signed("2028-11-25")).toBe("lapsed");
});

