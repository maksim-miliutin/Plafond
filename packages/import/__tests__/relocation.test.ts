/// <reference types="vite/client" />
import { expect, test } from "vitest";

import seed from "../../../db/seed/relocation-rules.json?raw";
import { RelocationRulesError, relocationRulesOf } from "../src/relocation.js";

const period = { from: "2026-08-01", until: "2027-08-01", title: "Décret n° 2026-644", url: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000054451221" };

// Décret n° 2017-1198 and the nine yearly decrees that carried it on, each for the leases of one year from 1 August.
test("the seed holds every year from 1 August 2017 to 31 July 2027 without a gap, each with its decree", () =>
{
    const periods = relocationRulesOf(JSON.parse(seed));

    expect(periods).toHaveLength(10);
    expect(periods.map((one) => one.from)).toEqual(Array.from({ length: 10 }, (_, index) => `${2017 + index}-08-01`));
    expect(periods.every((one, index) => one.until === `${2018 + index}-08-01`)).toBe(true);
    expect(periods[0]?.title).toMatch(/^Décret n° 2017-1198 du 27 juillet 2017/);
    expect(periods.at(-1)).toMatchObject({ from: "2026-08-01", until: "2027-08-01", url: period.url });
});

test("periods come out in order of their first day", () =>
{
    const before = { ...period, from: "2025-08-01", until: "2026-08-01" };

    expect(relocationRulesOf({ periods: [period, before] }).map((one) => one.from)).toEqual(["2025-08-01", "2026-08-01"]);
});

test("a period without a day, a title or a secure link, that ends before it starts or that overlaps another is refused", () =>
{
    expect(() => relocationRulesOf({})).toThrow(RelocationRulesError);
    expect(() => relocationRulesOf({ periods: [{ ...period, from: "2026-02-30" }] })).toThrow(/entry 1/);
    expect(() => relocationRulesOf({ periods: [{ ...period, title: "" }] })).toThrow(RelocationRulesError);
    expect(() => relocationRulesOf({ periods: [{ ...period, url: "http://www.legifrance.gouv.fr/" }] })).toThrow(RelocationRulesError);
    expect(() => relocationRulesOf({ periods: [{ ...period, until: "2026-08-01" }] })).toThrow(/no later than it starts/);
    expect(() => relocationRulesOf({ periods: [period, { ...period, from: "2027-07-01", until: "2028-08-01" }] })).toThrow(/overlaps/);
});
