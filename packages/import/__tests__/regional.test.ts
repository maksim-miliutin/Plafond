/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { metropoleOf } from "../src/metropole.js";
import { latestFeeZone, lyonCommunesOf, RegionalError, regionalCommunesOf, zoneHistoryOf } from "../src/regional.js";
import { zoneListsOf } from "../src/zones.js";

import communes from "../../../db/seed/grand-paris-communes.csv?raw";
import seed from "../../../db/seed/ile-de-france-zones.csv?raw";
import lyonSeed from "../../../db/seed/lyon-zones.csv?raw";
import lyonOutlines from "../../../db/seed/lyon-metropole-contours.geojson?raw";
import tenseTable from "../../../db/seed/tlv-history.csv?raw";
import veryTenseTable from "../../../db/seed/a-bis-history.csv?raw";
import sources from "../../../db/seed/zone-lists.json?raw";

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

const lists = zoneListsOf(JSON.parse(sources));
const history = zoneHistoryOf(tenseTable, veryTenseTable, lists.tenseHistory.map((list) => list.column), lists.veryTenseHistory.map((list) => list.column));

// The annex of décret n° 2013-392 in its versions of 2013, 2015, 2023 and 2025, and annex I of the arrêté of 1 August 2014 in six
// versions to 6 September 2025, as LEGI dates them; the communes are named by their codes of 2025.
test("the history holds every commune of Île-de-France and around Lyon, Saint-Germain-en-Laye and Saint-Denis mixed in zone A bis", () =>
{
    expect(history.size).toBe(1324);
    expect(region.every((row) => history.has(row.code))).toBe(true);
    expect(history.get("91377")).toEqual({ tense: [1, 1, 1, 1], veryTense: [false, false, false, false, false, false] });
    expect(history.get("94002")?.veryTense).toEqual([false, false, false, false, false, true]);
    expect(history.get("77022")?.tense).toEqual([0, 0, 2, 2]);
    expect([...history].filter(([, past]) => past.veryTense.includes(null)).map(([code]) => code).sort()).toEqual(["78551", "93066"]);
});

test("the versions follow each other up to the current ones, and a history table with an unknown value is refused", () =>
{
    expect(lists.tenseHistory.map((list) => [list.from, list.until])).toEqual([
        ["2013-05-13", "2015-10-16"],
        ["2015-10-16", "2023-08-27"],
        ["2023-08-27", "2025-12-24"],
        ["2025-12-24", "2027-01-01"],
    ]);
    expect(lists.veryTenseHistory.at(-1)).toMatchObject({ from: "2024-07-12", until: "2025-09-07", column: "a_bis_2024" });
    expect(() => zoneHistoryOf("code;tlv_2013\n75056;3\n", "code;a_bis_2014\n75056;1\n", ["tlv_2013"], ["a_bis_2014"])).toThrow(RegionalError);
    expect(() => zoneHistoryOf("code;tlv_2013\n75056;1\n", "code;a_bis_2014\n75056;1\n", ["tlv_2015"], ["a_bis_2014"])).toThrow("lacks the columns");
});

// The same tables for the 58 communes of the Métropole de Lyon: none in zone A bis or part 2, four outside the list.
test("around Lyon no commune is very tense, and four of the Monts d'Or and the plain are not tense at all", () =>
{
    const lyon = lyonCommunesOf(lyonSeed);
    const drawn = (JSON.parse(lyonOutlines) as { features: { properties: { code: string } }[] }).features.map((feature) => feature.properties.code);

    expect(lyon.map((commune) => commune.code).sort()).toEqual([...drawn].sort());
    expect(lyon.find((commune) => commune.code === "69123")).toMatchObject({ name: "Lyon", department: "69", grandParis: false, tensePart: 1 });
    expect(lyon.filter((commune) => commune.tensePart === 0).map((commune) => commune.name).sort()).toEqual(["Jonage", "Poleymieux-au-Mont-d'Or", "Quincieux", "Saint-Germain-au-Mont-d'Or"]);
    expect(lyon.some((commune) => commune.tensePart === 2 || commune.abcZone === "Abis")).toBe(false);
    expect(lyon.every((commune) => history.has(commune.code))).toBe(true);
    expect(() => lyonCommunesOf("code;nom;departement;metropole_lyon;tlv_part;abc_zone;a_bis_2025\n75056;Paris;75;1;1;Abis;1\n")).toThrow("not a commune of the Métropole de Lyon");
});
