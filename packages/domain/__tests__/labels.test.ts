import { expect, test } from "vitest";

import { feeZones, letting, periods, rooms } from "../src/labels.js";

test("every label reads mid-sentence, after a comma or after construit", () =>
{
    for (const label of [...Object.values(periods), ...Object.values(rooms), letting(true), letting(false)])
    {
        expect(label, label).toMatch(/^[a-z0-9éè]/);
    }
});

test("a flat is let either furnished or empty", () =>
{
    expect(letting(true)).toBe("loué meublé");
    expect(letting(false)).toBe("loué vide");
});

test("every fee zone reads after \"situé\" in a letter and on the screen", () =>
{
    expect(feeZones).toEqual({ "very-tense": "en zone très tendue", tense: "en zone tendue", other: "hors zone tendue" });
});
