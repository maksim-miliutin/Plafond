import { expect, test } from "vitest";

import { todayInParis } from "../lib/today";

// Counted by hand: Paris runs two hours ahead of UTC in summer time and one hour in winter.
test("the day is the one on the calendar in Paris, not on the server or the phone", () =>
{
    expect(todayInParis(new Date("2026-10-01T21:59:00Z"))).toBe("2026-10-01");
    expect(todayInParis(new Date("2026-10-01T22:30:00Z"))).toBe("2026-10-02");
    expect(todayInParis(new Date("2026-12-31T22:59:00Z"))).toBe("2026-12-31");
    expect(todayInParis(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
});

test("the night the clocks go back still belongs to the right day", () =>
{
    expect(todayInParis(new Date("2026-10-24T23:30:00Z"))).toBe("2026-10-25");
    expect(todayInParis(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-25");
});
