import { expect, test } from "vitest";

import seed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { LawTableError, lawOf } from "../src/law.js";

function period(from: string, until: string, change: Record<string, unknown> = {}): Record<string, unknown>
{
    return { from, until, title: `fixture law from ${from}`, url: "https://example.org/law", ...change };
}

// Article 140 of loi ELAN runs eight years from its publication on 24 November 2018 (loi 3DS of 21 February 2022);
// the arrêté IDF-2026-06-12-00003 reads its end as 24 November 2026 at midnight. The Senate's report says 23 November.
// Loi n° 2026-1072 of 21 November 2026 (JORF of 22 November) made it ten years, and the same reading ends it a day
// later than the Senate would: 24 November 2028.
test("the seed holds the law from its publication through 24 November 2028, as extended in 2026", () =>
{
    expect(lawOf(seed)).toEqual([
        {
            from: "2018-11-24",
            until: "2026-11-25",
            title: "Article 140 de la loi n° 2018-1021 du 23 novembre 2018",
            url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000037639478/",
        },
        {
            from: "2026-11-25",
            until: "2028-11-25",
            title: "Loi n° 2026-1072 du 21 novembre 2026",
            url: "https://www.legifrance.gouv.fr/jorf/jo/2026/11/22/0273",
        },
    ]);
});

test("periods come back in the order they start", () =>
{
    const read = lawOf({ periods: [period("2026-11-25", "2028-11-25"), period("2018-11-24", "2026-11-25")] });

    expect(read.map((one) => one.from)).toEqual(["2018-11-24", "2026-11-25"]);
});

test("a gap between two periods is allowed, as a law may lapse before it is extended", () =>
{
    const read = lawOf({ periods: [period("2018-11-24", "2026-11-25"), period("2026-12-10", "2028-11-25")] });

    expect(read).toHaveLength(2);
});

test("overlapping periods, a period ending before it starts, a missing field or no rows are breakages", () =>
{
    const broken: unknown[] = [
        { periods: [period("2018-11-24", "2026-11-25"), period("2026-11-24", "2028-11-25")] },
        { periods: [period("2026-11-25", "2026-11-25")] },
        { periods: [period("2018-11-24", "2026-11-25", { title: "" })] },
        { periods: [period("2018-11-24", "2026-11-25", { url: "http://example.org/law" })] },
        { periods: [period("2018-11-24", "2026-11-31")] },
        { periods: [] },
        [period("2018-11-24", "2026-11-25")],
    ];

    for (const table of broken)
    {
        expect(() => lawOf(table), JSON.stringify(table)).toThrow(LawTableError);
        expect(() => lawOf(table)).toThrow(/^law table: /);
    }
});
