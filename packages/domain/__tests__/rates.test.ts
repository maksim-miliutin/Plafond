import { expect, test } from "vitest";

import { DayError } from "../src/day.js";
import { RatesError, controlledSince, periodsOf, rateOn, type Flat, type Rate } from "../src/rates.js";

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
    rate("2024-07-01", "2025-07-01", 3144),
    rate("2025-07-01", "2026-07-01", 3180),
];

test("a lease is checked against the rate in force on the day it was signed", () =>
{
    expect(rateOn(rates, flat, "2025-03-10")).toBe(rates[0]);
});

test("rates change on their first day, not the day after", () =>
{
    expect(rateOn(rates, flat, "2025-06-30")).toBe(rates[0]);
    expect(rateOn(rates, flat, "2025-07-01")).toBe(rates[1]);
});

test("a rate stops on the day its decree ends, whatever comes after", () =>
{
    expect(rateOn(rates, flat, "2026-06-30")).toBe(rates[1]);
    expect(rateOn(rates, flat, "2026-07-01")).toEqual({ kind: "no-rate" });
});

test("every one of the four criteria has to match", () =>
{
    const furnished = { ...flat, furnished: true };
    const bigger: Flat = { ...flat, rooms: 3 };
    const older: Flat = { ...flat, period: "before-1946" };
    const elsewhere = { ...flat, quartier: 13 };

    for (const other of [furnished, bigger, older, elsewhere])
    {
        expect(rateOn(rates, other, "2025-03-10")).toEqual({ kind: "no-rate" });
    }
});

test("before the first published rate there is nothing to check against", () =>
{
    expect(rateOn(rates, flat, "2024-06-30")).toEqual({ kind: "no-rate" });
});

test("two rates covering the same day are broken data, not a choice", () =>
{
    const overlapping = [...rates, rate("2025-01-01", "2026-01-01", 3200)];

    expect(() => rateOn(overlapping, flat, "2025-03-10")).toThrow(RatesError);
});

test("looking up a rate on something that is not a day is a breakage", () =>
{
    expect(() => rateOn(rates, flat, "2025-02-30")).toThrow(DayError);
});

test("each city builds with its own periods: Paris stops at 1990, Lyon goes on to 2005", () =>
{
    expect(periodsOf.paris).toEqual(["before-1946", "1946-1970", "1971-1990", "after-1990"]);
    expect(periodsOf.lyon).toEqual(["before-1946", "1946-1970", "1971-1990", "1991-2005", "after-2005"]);
    expect(periodsOf["est-ensemble"]).toEqual(["before-1946", "1946-1970", "1971-1990", "after-1990"]);
});

test("a rate belongs to its city, so Paris quartier 1 and Lyon zone 1 never answer for each other", () =>
{
    const paris = rate("2025-07-01", "2026-07-01", 3180);
    const lyon: Rate = { ...paris, flat: { ...paris.flat, city: "lyon" }, majored: 2100 };

    expect(rateOn([paris, lyon], lyon.flat, "2025-09-01")).toBe(lyon);
    expect(rateOn([paris, lyon], paris.flat, "2025-09-01")).toBe(paris);
});

test("each city's rent control has the day it began: Paris in July 2019, Lyon in November 2021, Est Ensemble in December 2021", () =>
{
    expect(controlledSince).toEqual({ paris: "2019-07-01", lyon: "2021-11-01", "est-ensemble": "2021-12-01" });
});

// Where a decree prices houses and flats apart, each finds its own grid and no other: the same rooms, period and
// letting in a house of sector 318 cost 18,80 € a m² against 17,30 € in a flat under the Est Ensemble decree of 2024.
test("a house and a flat of the same category find their own rates where the decree prices them apart", () =>
{
    const priced = (dwelling: "flat" | "house", majored: number): Rate => ({ ...rate("2024-06-01", "2025-06-01", majored), flat: { ...flat, dwelling } });
    const split = [priced("flat", 1730), priced("house", 1880)];

    expect(rateOn(split, { ...flat, dwelling: "house" }, "2024-06-01")).toBe(split[1]);
    expect(rateOn(split, { ...flat, dwelling: "flat" }, "2024-06-01")).toBe(split[0]);
    expect(rateOn(split, flat, "2024-06-01")).toEqual({ kind: "no-rate" });
    expect(rateOn(rates, { ...flat, dwelling: "house" }, "2025-03-10")).toEqual({ kind: "no-rate" });
});
