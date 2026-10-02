/// <reference types="vite/client" />
import { expect, test } from "vitest";

import type { Decree } from "@plafond/domain";

import annex from "../../../db/seed/paris-annex-2026.csv?raw";
import sectors from "../../../db/seed/paris-sectors-2026.csv?raw";
import { AnnexError, annexRates } from "../src/annex.js";

const decree: Decree = {
    title: "Arrêté préfectoral n° IDF-2026-06-12-00003",
    url: "https://example.org/2026",
    from: "2026-07-01",
    until: "2026-11-25",
    contest: null,
};

test("the 2026 decree prices every quartier in all 32 categories, once each", () =>
{
    const rates = annexRates(annex, sectors, decree);
    const keys = new Set(rates.map(({ flat }) => `${flat.quartier} ${flat.rooms} ${flat.period} ${flat.furnished}`));

    expect(rates).toHaveLength(80 * 32);
    expect(keys.size).toBe(80 * 32);
    expect(rates.every((rate) => rate.decree === decree)).toBe(true);
});

// Read off the decree's own pages: quartier 1 and quartier 16 both sit in sector 2.
test("rents read exactly as the decree prints them, through each quartier's sector", () =>
{
    const rates = annexRates(annex, sectors, decree);
    const find = (quartier: number, rooms: number, period: string, furnished: boolean) =>
        rates.find(({ flat }) => flat.quartier === quartier && flat.rooms === rooms && flat.period === period && flat.furnished === furnished);

    expect(find(1, 3, "1946-1970", true)).toMatchObject({ reference: 2750, majored: 3300, minored: 1930 });
    expect(find(1, 3, "1946-1970", false)).toMatchObject({ reference: 2410, majored: 2890, minored: 1690 });
    expect(find(16, 1, "before-1946", true)).toMatchObject({ majored: 4940 });
    expect(find(51, 4, "after-1990", false)).toMatchObject({ reference: 2340, majored: 2810, minored: 1640 });
});

// Article 3 builds the furnished reference from the empty one plus a unit supplement; a slip in copying breaks the sum.
test("a furnished reference that is not the empty one plus the supplement is a copying error", () =>
{
    const slipped = annex.replace("1;1;< 1946;24,9;35,5;42,6;5,0;28,4;40,5;48,6", "1;1;< 1946;24,9;35,5;42,6;5,0;28,4;40,6;48,7");

    expect(() => annexRates(slipped, sectors, decree)).toThrow(/supplement/);
});

test("a majored or reduced rent off the 20 and 30 percent rule is a copying error", () =>
{
    const majored = annex.replace("1;1;< 1946;24,9;35,5;42,6;", "1;1;< 1946;24,9;35,5;43,6;");
    const minored = annex.replace("1;1;< 1946;24,9;35,5;42,6;", "1;1;< 1946;23,9;35,5;42,6;");

    expect(() => annexRates(majored, sectors, decree)).toThrow(/majored/);
    expect(() => annexRates(minored, sectors, decree)).toThrow(/reduced/);

    const tenthUp = annex.replace("1;1;< 1946;24,9;35,5;42,6;", "1;1;< 1946;24,9;35,5;42,7;");
    const tenthDown = annex.replace("1;1;< 1946;24,9;35,5;42,6;", "1;1;< 1946;25,0;35,5;42,6;");

    expect(() => annexRates(tenthUp, sectors, decree)).toThrow(/majored/);
    expect(() => annexRates(tenthDown, sectors, decree)).toThrow(/reduced/);
});

test("a category missing, given twice or unknown is a breakage", () =>
{
    const lines = annex.trimEnd().split("\n");
    const missing = lines.slice(0, -1).join("\n");
    const twice = [...lines, lines[1]].join("\n");
    const unknown = annex.replace("1;1;< 1946;", "1;5;< 1946;");
    const instead = [lines[0], lines[1], lines[1], ...lines.slice(3)].join("\n");

    expect(() => annexRates(missing, sectors, decree)).toThrow(AnnexError);
    expect(() => annexRates(twice, sectors, decree)).toThrow(AnnexError);
    expect(() => annexRates(unknown, sectors, decree)).toThrow(AnnexError);
    expect(() => annexRates(instead, sectors, decree)).toThrow(/second time/);
});

test("a quartier left out of the sectors, or put in a sector the annex does not price, is a breakage", () =>
{
    const lines = sectors.trimEnd().split("\n");

    expect(() => annexRates(annex, lines.slice(0, -1).join("\n"), decree)).toThrow(AnnexError);
    expect(() => annexRates(annex, sectors.replace("80;Charonne;13", "80;Charonne;15"), decree)).toThrow(AnnexError);
});
