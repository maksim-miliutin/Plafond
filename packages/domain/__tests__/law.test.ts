import { expect, test } from "vitest";

import { check, type Claim } from "../src/cap.js";
import { LawError, type LawPeriod } from "../src/law.js";
import type { City, Rate } from "../src/rates.js";

const law: LawPeriod[] = [
    { from: "2018-11-24", until: "2026-11-25", title: "Article 140 de la loi n° 2018-1021 du 23 novembre 2018", url: "https://example.org/law" },
];

function rate(city: City, from: string, until: string): Rate
{
    return {
        flat: { city, quartier: 12, rooms: 2, period: "1946-1970", furnished: false },
        reference: 2650,
        majored: 3180,
        minored: 1855,
        decree: { title: `fixture decree of ${city} from ${from}`, url: "https://example.org/decree", from, until, contest: null },
    };
}

// The decrees in force at the end of 2026: Paris from 1 July 2026 to 24 November 2026, Lyon from 1 November 2025 to 31 October 2026.
const decrees = [rate("paris", "2026-07-01", "2026-11-25"), rate("lyon", "2025-11-01", "2026-11-01")];

function signed(city: City, signedOn: string, rates: readonly Rate[] = decrees, periods: readonly LawPeriod[] = law): ReturnType<typeof check>
{
    const claim: Claim = {
        flat: { city, quartier: 12, rooms: 2, period: "1946-1970", furnished: false },
        surface: 3000,
        signedOn,
        startsOn: signedOn,
        rent: 100000,
        complement: 0,
        on: "2026-12-01",
    };

    return check(claim, rates, periods);
}

test("each signing day around the end of 2026 gets the answer the texts in force give it", () =>
{
    const lapsed = { kind: "lapsed", lastDay: "2026-11-24", title: law[0]!.title, url: law[0]!.url };

    for (const day of ["2026-10-31", "2026-11-01", "2026-11-23", "2026-11-24"])
    {
        expect(signed("paris", day), day).toMatchObject({ kind: "checked" });
    }

    expect(signed("paris", "2026-11-25")).toEqual(lapsed);
    expect(signed("lyon", "2026-10-31")).toMatchObject({ kind: "checked" });
    expect(signed("lyon", "2026-11-01")).toEqual({ kind: "no-rate", side: "after", until: "2026-10-31" });
    expect(signed("lyon", "2026-11-24")).toEqual({ kind: "no-rate", side: "after", until: "2026-10-31" });
    expect(signed("lyon", "2026-11-25")).toEqual(lapsed);
});

test("a lease signed before the law began is told when control began, not that the law lapsed", () =>
{
    expect(signed("paris", "2018-11-23")).toEqual({ kind: "no-rate", side: "before", from: "2019-07-01" });
});

test("the law is asked before the decree: a decree running past it gives no verdict", () =>
{
    expect(signed("lyon", "2026-12-01", [rate("lyon", "2026-11-01", "2027-11-01")])).toMatchObject({ kind: "lapsed", lastDay: "2026-11-24" });
});

test("an extension is one more row: the day after the old end is no longer lapsed", () =>
{
    const extended = [...law, { from: "2026-11-25", until: "2028-11-25", title: "fixture extension", url: "https://example.org/extension" }];

    expect(signed("paris", "2026-11-25", decrees, extended)).toEqual({ kind: "no-rate", side: "after", until: "2026-11-24" });
});

test("checking without any period of the law is a breakage", () =>
{
    expect(() => signed("paris", "2026-10-31", decrees, [])).toThrow(LawError);
    expect(() => signed("paris", "2026-10-31", decrees, [])).toThrow(/^law: /);
});
