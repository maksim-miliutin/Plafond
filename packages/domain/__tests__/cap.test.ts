import { expect, test } from "vitest";

import { CapError, check, type Claim } from "../src/cap.js";
import type { LawPeriod } from "../src/law.js";
import type { City, Contest, Flat, Rate } from "../src/rates.js";

const law: LawPeriod[] = [{ from: "2018-11-24", until: "2026-11-25", title: "fixture law", url: "https://example.org/law" }];

const flat: Flat = { city: "paris", quartier: 12, rooms: 2, period: "1946-1970", furnished: false };

function rate(from: string, until: string, majored: number): Rate
{
    return {
        flat,
        reference: Math.round(majored / 1.2),
        majored,
        minored: Math.round(majored / 1.2 * 0.7),
        decree: { title: `fixture decree from ${from}`, url: "https://example.org/decree", from, until, contest: null },
    };
}

const rates = [
    rate("2020-07-01", "2021-07-01", 3000),
    rate("2024-07-01", "2025-07-01", 3144),
    rate("2025-07-01", "2026-07-01", 3180),
];

const claim: Claim = {
    flat,
    surface: 3245,
    signedOn: "2024-09-19",
    startsOn: "2024-10-04",
    rent: 120000,
    complement: 0,
    on: "2026-09-29",
};

// Expected sums are worked out by hand and in decimal arithmetic outside this code:
// 31.44 euros per square metre times 32.45 square metres is 1020.228 euros.
test("a rent above the cap is over by the difference every month", () =>
{
    expect(check(claim, rates, law)).toMatchObject({ kind: "checked", rate: rates[1], cap: 102023, excess: 17977 });
});

test("the overpayment counts whole months from the day the lease took effect", () =>
{
    expect(check(claim, rates, law)).toMatchObject({ months: 23, sinceStart: 413471, recoverable: 413471 });
});

test("the rate comes from the signing day even when the lease starts under the next one", () =>
{
    const lateStart = { ...claim, signedOn: "2025-06-20", startsOn: "2025-07-05" };

    expect(check(lateStart, rates, law)).toMatchObject({ rate: rates[1], cap: 102023 });
});

test("only the last three years can be claimed back", () =>
{
    const old = { ...claim, surface: 3000, signedOn: "2021-01-10", startsOn: "2021-01-15", rent: 100000 };

    expect(check(old, rates, law)).toMatchObject({
        cap: 90000,
        excess: 10000,
        months: 68,
        sinceStart: 680000,
        recoverable: 360000,
    });
});

test("a rent within the cap is a check with nothing to claim, not a refusal", () =>
{
    const within = { ...claim, rent: 100000 };

    expect(check(within, rates, law)).toMatchObject({ kind: "checked", excess: 0, sinceStart: 0, recoverable: 0 });
});

test("the cap rounds a half cent up and less than half down", () =>
{
    const half = [{ ...rates[1]!, majored: 3145 }];

    expect(check({ ...claim, surface: 10 }, half, law)).toMatchObject({ cap: 315 });
    expect(check({ ...claim, surface: 3246 }, rates, law)).toMatchObject({ cap: 102054 });
});

test("a complement is set against the cap with the last day to contest it", () =>
{
    const withComplement = { ...claim, complement: 20000 };

    expect(check(withComplement, rates, law)).toMatchObject({
        excess: 17977,
        complement: { amount: 20000, share: 1960, contestUntil: "2024-12-19" },
    });
});

// Loi n° 2018-1021, article 140, III, B: a complement cannot be applied to a base rent below the majored reference rent.
// 1 020,23 € less 1 000,00 € leaves 20,23 €.
test("a complement on a base rent below the cap carries how far below it falls, and none at or above it", () =>
{
    expect(check({ ...claim, rent: 100000, complement: 20000 }, rates, law)).toMatchObject({ complement: { shortOfCap: 2023 } });
    expect(check({ ...claim, rent: 102023, complement: 20000 }, rates, law)).toMatchObject({ complement: { shortOfCap: 0 } });
    expect(check({ ...claim, complement: 20000 }, rates, law)).toMatchObject({ complement: { shortOfCap: 0 } });
});

test("the window to contest a complement ends on the last day of a shorter month", () =>
{
    const lateInMonth = { ...claim, signedOn: "2024-11-30", startsOn: "2024-12-01", complement: 20000 };

    expect(check(lateInMonth, rates, law)).toMatchObject({ complement: { contestUntil: "2025-02-28" } });
});

// Loi n° 2026-1072 of 21 November 2026 gives a year instead of three months, from 23 November 2026. Under article 2222
// of the Code civil a longer deadline reaches every window still open that day, counted from the same signing; one
// already closed stays closed.
test("the year to contest a complement reaches every lease whose three months were still running on 23 November 2026", () =>
{
    const extended = [...law, { from: "2026-11-25", until: "2028-11-25", title: "fixture extension", url: "https://example.org/extension" }];
    const current = [...rates, rate("2026-07-01", "2027-07-01", 3220)];
    const until = (signedOn: string, startsOn = signedOn) =>
    {
        const result = check({ ...claim, signedOn, startsOn, complement: 20000, on: "2026-11-23" }, current, extended);

        return result.kind === "checked" ? result.complement?.contestUntil : result.kind;
    };

    expect(until("2026-08-22")).toBe("2026-11-22");
    expect(until("2026-08-23")).toBe("2027-08-23");
    expect(until("2026-08-31")).toBe("2027-08-31");
    expect(until("2026-11-23")).toBe("2027-11-23");
    expect(until("2027-02-28")).toBe("2028-02-28");
    expect(until("2026-08-23", "2026-09-15")).toBe("2027-08-23");
});

test("a lease without a complement has none to show", () =>
{
    expect(check(claim, rates, law)).toMatchObject({ complement: null });
});

test("a missing rate says on which side of the known decrees the lease falls", () =>
{
    const signed = (signedOn: string, city: City = "paris") => check({ ...claim, flat: { ...flat, city }, signedOn, startsOn: signedOn }, rates, law);
    const latest = { title: "fixture decree from 2025-07-01", url: "https://example.org/decree" };

    expect(signed("2019-06-01")).toEqual({ kind: "no-rate", side: "before", from: "2019-07-01" });
    expect(signed("2026-07-01")).toEqual({ kind: "no-rate", side: "after", until: "2026-06-30", ...latest });
    expect(signed("2026-08-01")).toEqual({ kind: "no-rate", side: "after", until: "2026-06-30", ...latest });
    expect(check({ ...claim, signedOn: "2026-08-01", startsOn: "2026-08-01" }, [...rates].reverse(), law))
        .toEqual({ kind: "no-rate", side: "after", until: "2026-06-30", ...latest });
    expect(signed("2022-03-01")).toEqual({ kind: "no-rate", side: "between" });
    expect(signed("2021-06-01", "lyon")).toEqual({ kind: "no-rate", side: "before", from: "2021-11-01" });
    expect(signed("2026-08-01", "lyon")).toEqual({ kind: "no-rate", side: "between" });
});

test("a lease that has not taken effect yet has no months to claim", () =>
{
    const ahead = { ...claim, startsOn: "2026-10-01" };

    expect(check(ahead, rates, law)).toMatchObject({ kind: "checked", excess: 17977, months: 0, sinceStart: 0 });
});

test("each impossible field is named in the refusal", () =>
{
    const wrong: [Partial<Claim>, keyof Claim][] = [
        [{ surface: 0 }, "surface"],
        [{ surface: 32.45 }, "surface"],
        [{ rent: 0 }, "rent"],
        [{ complement: -1 }, "complement"],
        [{ signedOn: "2024-02-30" }, "signedOn"],
        [{ startsOn: "" }, "startsOn"],
        [{ on: "2026-13-01" }, "on"],
    ];

    for (const [change, field] of wrong)
    {
        expect(check({ ...claim, ...change }, rates, law)).toEqual({ kind: "invalid", field });
    }
});

test("the court record of the decree comes back with the check", () =>
{
    const contest: Contest = {
        outcome: "annulled",
        court: "Tribunal administratif de Paris",
        decidedOn: "2025-10-24",
        claimsBy: "2025-10-24",
        source: "https://example.org/judgment",
    };
    const judged = [{ ...rates[1]!, decree: { ...rates[1]!.decree, contest } }];

    expect(check(claim, judged, law)).toMatchObject({ rate: { decree: { contest } } });
});

test("a rate that gives a zero cap is broken data", () =>
{
    const broken = [{ ...rates[1]!, majored: 0 }];

    expect(() => check(claim, broken, law)).toThrow(CapError);
});
