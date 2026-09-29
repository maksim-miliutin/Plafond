import { expect, test } from "vitest";

import { centsFrom, hundredthsFrom } from "../src/input.js";

const unreadable = { kind: "unreadable" };

test("a rent reads the way people type it in france", () =>
{
    expect(centsFrom("1500")).toBe(150000);
    expect(centsFrom("1 500")).toBe(150000);
    expect(centsFrom("1\u202F500,50 €")).toBe(150050);
    expect(centsFrom(" 1\u00A0280,5 ")).toBe(128050);
    expect(centsFrom("980.25")).toBe(98025);
    expect(centsFrom("0,05")).toBe(5);
});

test("a surface reads in hundredths of a square metre", () =>
{
    expect(hundredthsFrom("40")).toBe(4000);
    expect(hundredthsFrom("32,45 m²")).toBe(3245);
    expect(hundredthsFrom("32.5m2")).toBe(3250);
});

// 1.500 is fifteen hundred to some and one and a half to others; asking again beats guessing.
test("three digits after a separator are ambiguous and read as nothing", () =>
{
    expect(centsFrom("1.500")).toEqual(unreadable);
    expect(centsFrom("1,500")).toEqual(unreadable);
});

test("anything that is not an amount reads as nothing", () =>
{
    for (const text of ["", "   ", "abc", "-50", "1 50", "12,345", "1500 $", "15e2", "1,5,5"])
    {
        expect(centsFrom(text), text).toEqual(unreadable);
    }
});
