import { expect, test } from "vitest";

import seed from "../../../db/seed/agency-fees.json" with { type: "json" };
import { FeeCapsError, feeCapsOf } from "../src/fees.js";

function row(from: string, until: string, change: Record<string, unknown> = {}): Record<string, unknown>
{
    return {
        from,
        until,
        letting: { "very-tense": 1200, tense: 1000, other: 800 },
        inspection: 300,
        title: `fixture caps from ${from}`,
        url: "https://example.org/caps",
        ...change,
    };
}

test("each row becomes the caps in force between its two days, in order", () =>
{
    const caps = feeCapsOf([row("2026-01-01", "2027-01-01"), row("2014-09-15", "2026-01-01")]);

    expect(caps.map((one) => one.from)).toEqual(["2014-09-15", "2026-01-01"]);
    expect(caps[0]).toEqual({
        from: "2014-09-15",
        until: "2026-01-01",
        letting: { "very-tense": 1200, tense: 1000, other: 800 },
        inspection: 300,
        title: "fixture caps from 2014-09-15",
        url: "https://example.org/caps",
    });
});

test("a row that leaves a gap or overlaps the next is refused, so every lease finds exactly one row", () =>
{
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-01"), row("2026-02-01", "2027-01-01")])).toThrow(FeeCapsError);
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-01"), row("2025-12-01", "2027-01-01")])).toThrow(/^fee caps: /);
});

test("a cap that is not a whole number of cents, a zone left out, a day that is not one or a plain link is refused", () =>
{
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-01", { inspection: 3.03 })])).toThrow(FeeCapsError);
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-01", { letting: { "very-tense": 1200, tense: 1000 } })])).toThrow(FeeCapsError);
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-31")].map((one) => ({ ...one, until: "2026-02-30" })))).toThrow(FeeCapsError);
    expect(() => feeCapsOf([row("2014-09-15", "2026-01-01", { url: "http://example.org" })])).toThrow(FeeCapsError);
    expect(() => feeCapsOf([row("2026-01-01", "2026-01-01")])).toThrow(FeeCapsError);
    expect(() => feeCapsOf([])).toThrow(FeeCapsError);
});

// Décret n° 2014-890, article 2, and the arrêté of 17 July 2025 as amended in November 2025, which raised the caps from
// 1 January 2026 by the change of the rent index from the third quarter of 2024 to that of 2025: +0,87 %.
test("the seed holds the caps of 2014 and those of 2026, the second the first raised by 0,87 % to the cent", () =>
{
    const [old, raised] = feeCapsOf(seed);

    expect(old).toMatchObject({ from: "2014-09-15", until: "2026-01-01", letting: { "very-tense": 1200, tense: 1000, other: 800 }, inspection: 300 });
    expect(raised).toMatchObject({ from: "2026-01-01", until: "2027-01-01", letting: { "very-tense": 1210, tense: 1009, other: 807 }, inspection: 303 });
    for (const zone of ["very-tense", "tense", "other"] as const)
    {
        expect(raised!.letting[zone], zone).toBe(Math.round(old!.letting[zone] * 1.0087));
    }

    expect(raised!.inspection).toBe(Math.round(old!.inspection * 1.0087));
});
