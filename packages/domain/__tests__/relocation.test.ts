import { expect, test } from "vitest";

import { relocation, type Relocation, type RelocationPeriod } from "../src/relocation.js";
import type { IndexRow } from "../src/revision.js";

// The IRL for mainland France as ANIL's table publishes it, with the day INSEE published each quarter.
const index: IndexRow[] = [
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2025, quarter: 3, value: 14577, publishedOn: "2025-10-15" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
    { year: 2026, quarter: 3, value: 14806, publishedOn: "2026-10-15" },
];

// Décret n° 2026-644 extends the decree of 2017 to the leases signed from 1 August 2026 to 31 July 2027.
const periods: RelocationPeriod[] = [{ from: "2026-08-01", until: "2027-08-01", title: "Décret n° 2026-644", url: "https://example.org/2026-644" }];

// A lease in Vincennes: a D dwelling relet after two months, its last rent revised in the year before.
const lease: Relocation = {
    signedOn: "2026-09-01",
    tense: true,
    firstLetting: false,
    dpe: "D",
    vacancy: "within",
    lastRent: 100000,
    revised: true,
    basis: "none",
    proposed: 108000,
};

const check = (changes: Partial<Relocation>) => relocation({ ...lease, ...changes }, periods, index);

test("a last rent revised in the year before is the most the new lease may ask: 1 080 € over 1 000 € is 80 € too much", () =>
{
    expect(check({})).toMatchObject({ kind: "kept", allowed: 100000, excess: 8000, period: periods[0] });
    expect(check({ proposed: 100000 })).toMatchObject({ kind: "kept", excess: 0 });
});

// Article 3: an unrevised last rent may follow the index, the last one published on the day the lease is signed over the
// same quarter a year earlier; a quarter published later does not count.
test("an unrevised last rent follows the index published on the day of signing, never a later one", () =>
{
    expect(check({ revised: false, signedOn: "2026-10-14" })).toMatchObject({
        kind: "indexed",
        to: { year: 2026, quarter: 2 },
        from: { year: 2025, quarter: 2 },
        allowed: 101152,  // 1 000 × 148,37 / 146,68
        excess: 6848,
    });
    expect(check({ revised: false, signedOn: "2026-10-15" })).toMatchObject({ kind: "indexed", to: { year: 2026, quarter: 3 }, from: { year: 2025, quarter: 3 }, allowed: 101571 });
    expect(relocation({ ...lease, revised: false }, periods, index.slice(2))).toEqual({ kind: "missing", field: "index", period: periods[0] });
});

// Article 17 of the law of 1989 freezes an F or G dwelling's rent at its last one, before the decree, its exceptions and its
// limit on vacancy come into it.
test("an F or G dwelling keeps its last rent, however long it stood empty and whatever the landlord gives as a reason", () =>
{
    expect(check({ dpe: "G", vacancy: "beyond", revised: false, basis: "works" })).toEqual({ kind: "frozen", dpe: "G", allowed: 100000, excess: 8000 });
    expect(check({ dpe: "F", signedOn: "2027-09-01" })).toMatchObject({ kind: "frozen", dpe: "F" });
    expect(check({ dpe: "F", lastRent: null })).toEqual({ kind: "missing", field: "lastRent", period: null });
});

// Article 2 leaves out a dwelling empty « depuis plus de dix-huit mois »: eighteen months exactly is still in.
test("a dwelling empty eighteen months at most is in the decree's reach, one empty longer is out of it", () =>
{
    expect(check({ vacancy: "within" }).kind).toBe("kept");
    expect(check({ vacancy: "beyond" })).toEqual({ kind: "vacant", period: periods[0] });
});

test("a first letting has no last rent to compare, and works or an undervalued rent are a case to check by hand", () =>
{
    expect(check({ firstLetting: true, lastRent: null, dpe: null })).toEqual({ kind: "first-letting" });
    expect(check({ basis: "works" })).toEqual({ kind: "special", basis: "works", period: periods[0] });
    expect(check({ basis: "undervalued" })).toEqual({ kind: "special", basis: "undervalued", period: periods[0] });
});

test("an answer the case needs and the tenant does not know is named", () =>
{
    expect(check({ lastRent: null })).toEqual({ kind: "missing", field: "lastRent", period: periods[0] });
    expect(check({ dpe: null })).toEqual({ kind: "missing", field: "dpe", period: periods[0] });
    expect(check({ vacancy: null })).toEqual({ kind: "missing", field: "vacancy", period: periods[0] });
    expect(check({ revised: null })).toEqual({ kind: "missing", field: "revised", period: periods[0] });
});

test("the rules cover leases signed up to 31 July 2027 and stop the next day, and only in the tense zone", () =>
{
    expect(check({ signedOn: "2027-07-31" }).kind).toBe("kept");
    expect(check({ signedOn: "2027-08-01" })).toEqual({ kind: "no-rules", periods });
    expect(check({ signedOn: "2026-07-31" })).toEqual({ kind: "no-rules", periods });
    expect(check({ tense: null })).toEqual({ kind: "no-rules", periods });
    expect(check({ tense: false })).toEqual({ kind: "untense", period: periods[0] });
});
