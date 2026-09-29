import { expect, test } from "vitest";

import { DayError } from "../src/day.js";
import { FormatError, euros, frenchDay, squareMetres } from "../src/format.js";

// French typography: a narrow no-break space between thousands, a no-break space before the sign.
const thin = "\u202F";
const hard = "\u00A0";

test("an amount in cents reads as french euros with a comma and grouped thousands", () =>
{
    expect(euros(128000)).toBe(`1${thin}280,00${hard}€`);
    expect(euros(123456789)).toBe(`1${thin}234${thin}567,89${hard}€`);
    expect(euros(22000)).toBe(`220,00${hard}€`);
    expect(euros(5)).toBe(`0,05${hard}€`);
    expect(euros(0)).toBe(`0,00${hard}€`);
});

test("an amount that is not a whole number of cents is a breakage", () =>
{
    expect(() => euros(-1)).toThrow(FormatError);
    expect(() => euros(1.5)).toThrow(FormatError);
});

test("a surface drops needless decimals but keeps real ones", () =>
{
    expect(squareMetres(4000)).toBe(`40${hard}m²`);
    expect(squareMetres(3245)).toBe(`32,45${hard}m²`);
    expect(squareMetres(3250)).toBe(`32,5${hard}m²`);
});

test("a day reads the french way, with 1er for the first of the month", () =>
{
    expect(frenchDay("2025-07-01")).toBe("1er juillet 2025");
    expect(frenchDay("2026-09-29")).toBe("29 septembre 2026");
    expect(frenchDay("2026-02-02")).toBe("2 février 2026");
    expect(frenchDay("2026-12-31")).toBe("31 décembre 2026");
});

test("formatting something that is not a day is a breakage", () =>
{
    expect(() => frenchDay("2026-02-30")).toThrow(DayError);
});
