import { expect, test } from "vitest";

import { DayError, addMonths, dayBefore, isDay, wholeMonths } from "../src/day.js";

test("a leap day exists only in a leap year", () =>
{
    expect(isDay("2024-02-29")).toBe(true);
    expect(isDay("2000-02-29")).toBe(true);
    expect(isDay("2023-02-29")).toBe(false);
    expect(isDay("1900-02-29")).toBe(false);
});

test("a day is written as four, two and two digits and nothing else", () =>
{
    expect(isDay("2024-07-01")).toBe(true);
    expect(isDay("2024-7-1")).toBe(false);
    expect(isDay("24-07-01")).toBe(false);
    expect(isDay("2024-07-01T00:00")).toBe(false);
    expect(isDay("")).toBe(false);
});

test("a month or a day outside the calendar is not a day", () =>
{
    expect(isDay("2024-13-01")).toBe(false);
    expect(isDay("2024-00-10")).toBe(false);
    expect(isDay("2024-04-31")).toBe(false);
    expect(isDay("2024-04-00")).toBe(false);
});

test("adding months keeps the day of the month across a year", () =>
{
    expect(addMonths("2024-10-04", 1)).toBe("2024-11-04");
    expect(addMonths("2024-11-19", 3)).toBe("2025-02-19");
    expect(addMonths("2024-10-04", 0)).toBe("2024-10-04");
});

test("adding months to a late day stops at the end of a shorter month", () =>
{
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");
    expect(addMonths("2023-01-31", 1)).toBe("2023-02-28");
    expect(addMonths("2024-11-30", 3)).toBe("2025-02-28");
});

test("a month-end start returns to the month end once the month is long enough", () =>
{
    expect(addMonths("2024-01-31", 2)).toBe("2024-03-31");
    expect(addMonths("2024-01-31", 12)).toBe("2025-01-31");
});

test("a month counts only once it has fully passed", () =>
{
    expect(wholeMonths("2024-10-04", "2024-11-03")).toBe(0);
    expect(wholeMonths("2024-10-04", "2024-11-04")).toBe(1);
    expect(wholeMonths("2024-10-04", "2026-09-29")).toBe(23);
});

test("a month from the 31st passes on the last day of a short month", () =>
{
    expect(wholeMonths("2024-01-31", "2024-02-28")).toBe(0);
    expect(wholeMonths("2024-01-31", "2024-02-29")).toBe(1);
});

test("no months pass on or before the start", () =>
{
    expect(wholeMonths("2024-10-04", "2024-10-04")).toBe(0);
    expect(wholeMonths("2024-10-04", "2024-09-01")).toBe(0);
});

test("counting from something that is not a day is a breakage, not a zero", () =>
{
    expect(() => addMonths("2024-02-30", 1)).toThrow(DayError);
    expect(() => wholeMonths("2024-10-04", "tomorrow")).toThrow(DayError);
});

test("the day before steps back across months and years", () =>
{
    expect(dayBefore("2026-07-01")).toBe("2026-06-30");
    expect(dayBefore("2024-03-01")).toBe("2024-02-29");
    expect(dayBefore("2025-01-01")).toBe("2024-12-31");
    expect(dayBefore("2025-05-17")).toBe("2025-05-16");
});
