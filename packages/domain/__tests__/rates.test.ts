import { expect, test } from "vitest";

import { DayError } from "../src/day.js";
import { RatesError, rateOn, type Flat, type Rate } from "../src/rates.js";

const flat: Flat = { quartier: 12, rooms: 2, period: "1946-1970", furnished: false };

function rate(from: string, until: string | null, majored: number): Rate
{
    return {
        flat,
        from,
        until,
        reference: Math.round(majored / 1.2),
        majored,
        minored: Math.round(majored / 1.2 * 0.7),
        decree: { title: `fixture decree from ${from}`, url: "https://example.org/decree" },
    };
}

const rates = [
    rate("2024-07-01", "2025-07-01", 3144),
    rate("2025-07-01", null, 3180),
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

test("a rate with no end is still in force", () =>
{
    expect(rateOn(rates, flat, "2030-01-01")).toBe(rates[1]);
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
