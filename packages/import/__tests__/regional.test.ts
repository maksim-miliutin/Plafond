/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { metropoleOf } from "../src/metropole.js";
import { latestFeeZone, RegionalError, regionalCommunesOf } from "../src/regional.js";

import communes from "../../../db/seed/grand-paris-communes.csv?raw";
import seed from "../../../db/seed/ile-de-france-zones.csv?raw";

const region = regionalCommunesOf(seed);
const named = (code: string) => region.find((row) => row.code === code);
const count = (keep: (row: (typeof region)[number]) => boolean) => region.filter(keep).length;

test("the table holds every commune of Île-de-France once, the 130 of the Grand Paris flagged as the métropole lists them", () =>
{
    expect(region).toHaveLength(1266);
    expect(new Set(region.map((row) => row.code)).size).toBe(1266);
    expect(region.filter((row) => row.grandParis).map((row) => row.code).sort()).toEqual(metropoleOf(communes).map((commune) => commune.code).sort());
});

// Décret n° 2013-392 as décret n° 2025-1267 left it from 24 December 2025; zone A bis as the arrêté of 23 June 2026 left it
// from 26 June 2026, and before that as the arrêté of 5 September 2025 had, from 7 September 2025.
test("431 communes are in part 1 of the list, 103 in part 2, 98 in zone A bis since June 2026 and 97 before", () =>
{
    expect([1, 2, 0].map((part) => count((row) => row.tensePart === part))).toEqual([431, 103, 732]);
    expect(count((row) => row.abcZone === "Abis")).toBe(98);
    expect(count((row) => row.abcZone === "Abis" && row.grandParis)).toBe(68);
    expect(count((row) => row.veryTenseBefore)).toBe(97);
    expect(count((row) => row.grandParis && row.tensePart !== 1)).toBe(0);
    expect(["very-tense", "tense", "other"].map((zone) => count((row) => latestFeeZone(row) === zone))).toEqual([98, 440, 728]);
});

test("the examples the brief names read as it says", () =>
{
    expect(named("78646")).toMatchObject({ name: "Versailles", department: "78", tensePart: 1, abcZone: "Abis" });
    expect(named("91377")).toMatchObject({ name: "Massy", tensePart: 1, abcZone: "A" });
    expect(named("77022")).toMatchObject({ name: "Barbizon", tensePart: 2 });
    expect(named("78043")).toMatchObject({ name: "Bailly", tensePart: 0, abcZone: "Abis", veryTenseBefore: true });
    expect(named("94002")).toMatchObject({ name: "Alfortville", abcZone: "Abis", veryTenseBefore: false });
    expect(region.filter((row) => row.abcZone === "Abis" && row.tensePart === 0).map((row) => row.name)).toEqual(["Aigremont", "Bailly", "Noisy-le-Roi", "Rennemoulin"]);
});

test("a table that is not the one expected is refused", () =>
{
    const head = "code;nom;departement;grand_paris;tlv_part;abc_zone;a_bis_2025\n";

    expect(() => regionalCommunesOf("code;nom\n75056;Paris\n")).toThrow(RegionalError);
    expect(() => regionalCommunesOf(`${head}75056;Paris;92;1;1;Abis;1\n`)).toThrow("line 2 is not a commune of Île-de-France");
    expect(() => regionalCommunesOf(`${head}69123;Lyon;69;0;1;A;0\n`)).toThrow("line 2 is not a commune of Île-de-France");
    expect(() => regionalCommunesOf(`${head}75056;Paris;75;1;3;Abis;1\n`)).toThrow("cannot read");
    expect(() => regionalCommunesOf(`${head}75056;Paris;75;1;1;A bis;1\n`)).toThrow("cannot read");
    expect(() => regionalCommunesOf(`${head}75056;Paris;75;1;1;Abis;1\n75056;Paris;75;1;1;Abis;1\n`)).toThrow("line 3 gives 75056 a second time");
});
