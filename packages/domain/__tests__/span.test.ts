import { expect, test } from "vitest";

import type { LawPeriod } from "../src/law.js";
import type { City, Decree, Rate } from "../src/rates.js";
import { SpanError, checkedSpans } from "../src/span.js";

function decree(from: string, until: string): Decree
{
    return { title: `fixture decree from ${from}`, url: "https://example.org/decree", from, until, contest: null };
}

function period(from: string, until: string): LawPeriod
{
    return { from, until, title: `fixture law from ${from}`, url: "https://example.org/law" };
}

function priced(city: City, ...decrees: Decree[]): Rate[]
{
    return decrees.map((decree) => ({
        flat: { city, quartier: 1, rooms: 1, period: "before-1946", furnished: false },
        reference: 2000,
        majored: 2400,
        minored: 1400,
        decree,
    }));
}

const law = [period("2018-11-24", "2026-11-25")];
const lyon = [decree("2022-11-01", "2023-11-01"), decree("2024-11-01", "2025-11-01"), decree("2025-11-01", "2026-11-01")];
const paris = [decree("2025-07-01", "2026-07-01"), decree("2026-07-01", "2027-07-01")];
const resumed = [...law, period("2027-01-01", "2029-01-01")];

test("the days start with the first decree that has rents, and a year without rents splits them", () =>
{
    expect(checkedSpans("lyon", priced("lyon", ...lyon), law)).toEqual([
        { from: "2022-11-01", lastDay: "2023-10-31" },
        { from: "2024-11-01", lastDay: "2026-10-31" },
    ]);
});

test("the days end with the law when the last decree runs past it", () =>
{
    expect(checkedSpans("paris", priced("paris", ...paris), law)).toEqual([{ from: "2025-07-01", lastDay: "2026-11-24" }]);
});

test("an extension of the law is one more row and moves the end", () =>
{
    const extended = [...law, period("2026-11-25", "2028-11-25")];

    expect(checkedSpans("paris", priced("paris", ...paris), extended)).toEqual([{ from: "2025-07-01", lastDay: "2027-06-30" }]);
});

test("a lapse between two periods of the law splits the days", () =>
{
    expect(checkedSpans("paris", priced("paris", ...paris), resumed)).toEqual([
        { from: "2025-07-01", lastDay: "2026-11-24" },
        { from: "2027-01-01", lastDay: "2027-06-30" },
    ]);
});

test("rents from before the law began run on into it, as the check lets both through", () =>
{
    const early = priced("paris", decree("2018-07-01", "2019-07-01"), decree("2019-07-01", "2020-07-01"));

    expect(checkedSpans("paris", early, law)).toEqual([{ from: "2018-07-01", lastDay: "2020-06-30" }]);
});

test("the other city's rents do not count", () =>
{
    expect(checkedSpans("lyon", [...priced("paris", ...paris), ...priced("lyon", lyon[0]!)], law)).toEqual([{ from: "2022-11-01", lastDay: "2023-10-31" }]);
});

test("rates and law rows count in any order", () =>
{
    const rates = [...priced("lyon", ...lyon), ...priced("paris", ...paris)];

    expect(checkedSpans("paris", [...rates].reverse(), [...resumed].reverse())).toEqual(checkedSpans("paris", rates, resumed));
    expect(checkedSpans("lyon", [...rates].reverse(), [...resumed].reverse())).toEqual(checkedSpans("lyon", rates, resumed));
});

test("no rent for the city or no period of the law is a breakage", () =>
{
    expect(() => checkedSpans("lyon", priced("paris", ...paris), law)).toThrow(SpanError);
    expect(() => checkedSpans("paris", priced("paris", ...paris), [])).toThrow(SpanError);
    expect(() => checkedSpans("lyon", [], law)).toThrow(/^span: /);
});

test("rents that all fall after the law has lapsed are a breakage, not an empty page", () =>
{
    expect(() => checkedSpans("paris", priced("paris", decree("2027-07-01", "2028-07-01")), law)).toThrow(/^span: /);
});
