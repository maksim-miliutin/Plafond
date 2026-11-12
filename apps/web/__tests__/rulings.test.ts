import { expect, test } from "vitest";

import { isDay } from "@plafond/domain";

import { rulings } from "../lib/rulings";

test("every ruling names its court, a real day and its number, and both sides have one at least", () =>
{
    for (const ruling of rulings)
    {
        expect(isDay(ruling.on), ruling.number).toBe(true);
        expect(ruling.court, ruling.number).not.toBe("");
        expect(ruling.number).toMatch(/^(RG )?n°\u00A0\S+$/);
        expect(ruling.what, ruling.number).toMatch(/^\p{Lu}.*\.$/u);
    }

    expect(rulings.filter((ruling) => ruling.held === "accepted").length).toBeGreaterThan(0);
    expect(rulings.filter((ruling) => ruling.held === "rejected").length).toBeGreaterThan(0);
});
