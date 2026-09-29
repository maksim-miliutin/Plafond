import { expect, test } from "vitest";

import seed from "../../../db/seed/paris-decrees.json" with { type: "json" };
import { DecreesError, decreesOf } from "../src/decrees.js";

function entry(year: number, change: Record<string, unknown> = {}): Record<string, unknown>
{
    return {
        year,
        title: `fixture decree ${year}`,
        url: "https://example.org/decree",
        from: `${year}-07-01`,
        until: `${year + 1}-07-01`,
        contest: null,
        ...change,
    };
}

const annulled = {
    outcome: "annulled",
    court: "Tribunal administratif de Paris",
    decidedOn: "2025-10-24",
    claimsBy: "2025-10-24",
    source: "https://example.org/judgment",
};

test("each entry becomes the decree for its year", () =>
{
    const decrees = decreesOf([entry(2024), entry(2025, { contest: annulled })]);

    expect(decrees.get(2024)).toEqual({
        title: "fixture decree 2024",
        url: "https://example.org/decree",
        from: "2024-07-01",
        until: "2025-07-01",
        contest: null,
    });
    expect(decrees.get(2025)?.contest).toEqual(annulled);
});

test("decrees come back in the order they took effect, whatever the order of the table", () =>
{
    const years = [...decreesOf([entry(2025), entry(2023), entry(2024)]).keys()];

    expect(years).toEqual([2023, 2024, 2025]);
});

test("a gap between decrees is allowed: it is a time without a cap", () =>
{
    expect(decreesOf([entry(2019), entry(2021)]).size).toBe(2);
});

test("two decrees covering the same day are a breakage", () =>
{
    expect(() => decreesOf([entry(2024), entry(2025, { from: "2025-06-30" })])).toThrow(DecreesError);
});

test("a decree that ends before it starts is a breakage", () =>
{
    expect(() => decreesOf([entry(2024, { until: "2024-07-01" })])).toThrow(DecreesError);
});

test("the same year twice is a breakage", () =>
{
    expect(() => decreesOf([entry(2024), entry(2024)])).toThrow(DecreesError);
});

test("every field has to be what the domain expects", () =>
{
    const broken: Record<string, unknown>[] = [
        { year: "2024" },
        { title: "" },
        { url: "http://example.org" },
        { from: "2024-7-1" },
        { until: "2025-02-30" },
        { contest: { ...annulled, outcome: "overturned" } },
        { contest: { ...annulled, decidedOn: "yesterday" } },
        { contest: { ...annulled, claimsBy: "later" } },
        { contest: { ...annulled, court: 7 } },
        { contest: { ...annulled, source: "" } },
    ];

    for (const change of broken)
    {
        expect(() => decreesOf([entry(2024, change)]), JSON.stringify(change)).toThrow(DecreesError);
    }
});

test("a table that is not a list is a breakage", () =>
{
    expect(() => decreesOf({ 2024: entry(2024) })).toThrow(DecreesError);
});

test("the seed covers every day from July 2019 to the end of the experiment without a gap", () =>
{
    const decrees = [...decreesOf(seed).values()];

    expect(decrees[0]?.from).toBe("2019-07-01");
    expect(decrees.at(-1)?.until).toBe("2026-11-25");
    decrees.slice(1).forEach((decree, i) => expect(decree.from).toBe(decrees[i]?.until));
});
