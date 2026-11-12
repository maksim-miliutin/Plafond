import { expect, test } from "vitest";

import type { LawPeriod } from "../src/law.js";
import type { Decree } from "../src/rates.js";
import { SpanError, checkedSpan } from "../src/span.js";

function decree(from: string, until: string): Decree
{
    return { title: `fixture decree from ${from}`, url: "https://example.org/decree", from, until, contest: null };
}

function period(from: string, until: string): LawPeriod
{
    return { from, until, title: `fixture law from ${from}`, url: "https://example.org/law" };
}

const law = [period("2018-11-24", "2026-11-25")];
const lyon = [decree("2024-11-01", "2025-11-01"), decree("2025-11-01", "2026-11-01")];
const paris = [decree("2025-07-01", "2026-07-01"), decree("2026-07-01", "2027-07-01")];

test("the span ends with the last decree when the law runs longer", () =>
{
    expect(checkedSpan("lyon", lyon, law)).toEqual({ from: "2021-11-01", lastDay: "2026-10-31" });
});

test("the span ends with the law when the last decree runs past it", () =>
{
    expect(checkedSpan("paris", paris, law)).toEqual({ from: "2019-07-01", lastDay: "2026-11-24" });
});

test("an extension of the law is one more row and moves the end", () =>
{
    const extended = [...law, period("2026-11-25", "2028-11-25")];

    expect(checkedSpan("paris", paris, extended)).toEqual({ from: "2019-07-01", lastDay: "2027-06-30" });
});

test("decrees and law rows count in any order", () =>
{
    const extended = [...law, period("2026-11-25", "2028-11-25")];

    expect(checkedSpan("paris", [...paris].reverse(), [...extended].reverse())).toEqual(checkedSpan("paris", paris, extended));
    expect(checkedSpan("lyon", [...lyon].reverse(), law)).toEqual(checkedSpan("lyon", lyon, law));
});

test("no decree or no period of the law is a breakage", () =>
{
    expect(() => checkedSpan("paris", [], law)).toThrow(SpanError);
    expect(() => checkedSpan("paris", paris, [])).toThrow(SpanError);
    expect(() => checkedSpan("paris", [], law)).toThrow(/^span: /);
});
