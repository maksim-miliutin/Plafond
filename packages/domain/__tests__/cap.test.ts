import { expect, test } from "vitest";

import { CapError, check, type Claim } from "../src/cap.js";
import type { Contest, Flat, Rate } from "../src/rates.js";

const flat: Flat = { quartier: 12, rooms: 2, period: "1946-1970", furnished: false };

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
    expect(check(claim, rates)).toMatchObject({ kind: "checked", rate: rates[1], cap: 102023, excess: 17977 });
});

test("the overpayment counts whole months from the day the lease took effect", () =>
{
    expect(check(claim, rates)).toMatchObject({ months: 23, sinceStart: 413471, recoverable: 413471 });
});

test("the rate comes from the signing day even when the lease starts under the next one", () =>
{
    const lateStart = { ...claim, signedOn: "2025-06-20", startsOn: "2025-07-05" };

    expect(check(lateStart, rates)).toMatchObject({ rate: rates[1], cap: 102023 });
});

test("only the last three years can be claimed back", () =>
{
    const old = { ...claim, surface: 3000, signedOn: "2021-01-10", startsOn: "2021-01-15", rent: 100000 };

    expect(check(old, rates)).toMatchObject({
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

    expect(check(within, rates)).toMatchObject({ kind: "checked", excess: 0, sinceStart: 0, recoverable: 0 });
});

test("the cap rounds a half cent up and less than half down", () =>
{
    const half = [{ ...rates[1]!, majored: 3145 }];

    expect(check({ ...claim, surface: 10 }, half)).toMatchObject({ cap: 315 });
    expect(check({ ...claim, surface: 3246 }, rates)).toMatchObject({ cap: 102054 });
});

test("a complement is set against the cap with the last day to contest it", () =>
{
    const withComplement = { ...claim, complement: 20000 };

    expect(check(withComplement, rates)).toMatchObject({
        excess: 17977,
        complement: { amount: 20000, share: 1960, contestUntil: "2024-12-19" },
    });
});

test("the window to contest a complement ends on the last day of a shorter month", () =>
{
    const lateInMonth = { ...claim, signedOn: "2024-11-30", startsOn: "2024-12-01", complement: 20000 };

    expect(check(lateInMonth, rates)).toMatchObject({ complement: { contestUntil: "2025-02-28" } });
});

test("a lease without a complement has none to show", () =>
{
    expect(check(claim, rates)).toMatchObject({ complement: null });
});

test("no rate on the signing day is a refusal", () =>
{
    expect(check({ ...claim, signedOn: "2023-01-10" }, rates)).toEqual({ kind: "no-rate" });
    expect(check({ ...claim, signedOn: "2019-06-30" }, rates)).toEqual({ kind: "no-rate" });
});

test("a lease that has not taken effect yet has no months to claim", () =>
{
    const ahead = { ...claim, startsOn: "2026-10-01" };

    expect(check(ahead, rates)).toMatchObject({ kind: "checked", excess: 17977, months: 0, sinceStart: 0 });
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
        expect(check({ ...claim, ...change }, rates)).toEqual({ kind: "invalid", field });
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

    expect(check(claim, judged)).toMatchObject({ rate: { decree: { contest } } });
});

test("a rate that gives a zero cap is broken data", () =>
{
    const broken = [{ ...rates[1]!, majored: 0 }];

    expect(() => check(claim, broken)).toThrow(CapError);
});
