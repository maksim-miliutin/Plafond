import { expect, test } from "vitest";

import type { Decree, Flat, Period, Rate } from "@plafond/domain";

import { ParisError, parseParis } from "../src/paris.js";

type Row = Record<string, string>;

const header = [
    "Année",
    "Secteurs géographiques",
    "Numéro du quartier",
    "Nom du quartier",
    "Nombre de pièces principales",
    "Epoque de construction",
    "Type de location",
    "Loyers de référence",
    "Loyers de référence majorés",
    "Loyers de référence minorés",
    "Ville",
    "Numéro INSEE du quartier",
];

const labels: [string, Period][] = [
    ["Avant 1946", "before-1946"],
    ["1946-1970", "1946-1970"],
    ["1971-1990", "1971-1990"],
    ["Apres 1990", "after-1990"],
];

function decree(from: string, until: string): Decree
{
    return { title: `fixture decree from ${from}`, url: "https://example.org/decree", from, until, contest: null };
}

const decrees = new Map([
    [2025, decree("2025-07-01", "2026-07-01")],
    [2026, decree("2026-07-01", "2026-11-25")],
]);

function yearOf(year: string): Row[]
{
    const quartiers = Array.from({ length: 80 }, (_, i) => String(i + 1));

    return quartiers.flatMap((quartier) => ["1", "2", "3", "4"].flatMap((rooms) => labels.flatMap(([period]) =>
        ["non meublé", "meublé"].map((letting) => ({
            "Année": year,
            "Secteurs géographiques": "1",
            "Numéro du quartier": quartier,
            "Nom du quartier": `Quartier ${quartier}`,
            "Nombre de pièces principales": rooms,
            "Epoque de construction": period,
            "Type de location": letting,
            "Loyers de référence": "20.0",
            "Loyers de référence majorés": "24.0",
            "Loyers de référence minorés": "14.0",
            "Ville": "PARIS",
            "Numéro INSEE du quartier": `751${quartier.padStart(4, "0")}`,
        })))));
}

function text(rows: Row[], columns = header): string
{
    const quoted = (value: string) => `"${value.replaceAll("\"", "\"\"")}"`;
    const lines = [columns, ...rows.map((row) => columns.map((column) => row[column] ?? ""))];

    return lines.map((line) => line.map(quoted).join(";")).join("\r\n") + "\r\n";
}

const first = { "Numéro du quartier": "1", "Nombre de pièces principales": "3", "Epoque de construction": "1946-1970", "Type de location": "meublé" };
const firstFlat: Flat = { quartier: 1, rooms: 3, period: "1946-1970", furnished: true };

function patched(rows: Row[], change: Row): Row[]
{
    return rows.map((row) => Object.entries(first).every(([column, value]) => row[column] === value) ? { ...row, ...change } : row);
}

function rateFor(rates: Rate[], flat: Flat): Rate | undefined
{
    return rates.find((r) => r.flat.quartier === flat.quartier
        && r.flat.rooms === flat.rooms
        && r.flat.period === flat.period
        && r.flat.furnished === flat.furnished);
}

// Real rents from the 2025 table: St-Germain-l'Auxerrois, three rooms, 1946-1970, furnished.
test("a published row becomes the rate for its flat, in whole cents", () =>
{
    const rows = patched(yearOf("2025"), { "Loyers de référence": "26.7", "Loyers de référence majorés": "32.0", "Loyers de référence minorés": "18.7" });

    expect(rateFor(parseParis(text(rows), decrees), firstFlat)).toEqual({
        flat: firstFlat,
        reference: 2670,
        majored: 3200,
        minored: 1870,
        decree: decrees.get(2025),
    });
});

// 35.3 and 19.74 are rents from the published table that lose a cent once
// multiplied by 100 in floating point and cut down to a whole number.
test("every cent survives where floating point would lose one", () =>
{
    const rows = patched(yearOf("2025"), { "Loyers de référence majorés": "35.3", "Loyers de référence minorés": "19.74" });

    expect(rateFor(parseParis(text(rows), decrees), firstFlat)).toMatchObject({ majored: 3530, minored: 1974 });
});

test("a year gives exactly one rate for every flat the domain knows", () =>
{
    const rates = parseParis(text(yearOf("2025")), decrees);

    expect(rates).toHaveLength(2560);
    for (let quartier = 1; quartier <= 80; quartier++)
    {
        for (const [, period] of labels)
        {
            expect(rateFor(rates, { quartier, rooms: 4, period, furnished: false })).toBeDefined();
            expect(rateFor(rates, { quartier, rooms: 1, period, furnished: true })).toBeDefined();
        }
    }
});

test("rates take their dates from the decree, not from the year in the table", () =>
{
    const rates = parseParis(text(yearOf("2026")), decrees);

    expect(rates.every((r) => r.decree === decrees.get(2026))).toBe(true);
    expect(rates[0]?.decree.until).toBe("2026-11-25");
});

test("columns are found by name, in any order and among columns the city adds", () =>
{
    const shape = { "geo_shape": "{\"type\": \"Polygon\"; \"coordinates\": [[2.33, 48.86]]}" };
    const rows = yearOf("2025").map((row) => ({ ...row, ...shape }));
    const columns = ["geo_shape", ...header].reverse();

    expect(parseParis(text(rows, columns), decrees)).toHaveLength(2560);
});

test("an unknown label is a breakage, not a skipped row", () =>
{
    const rows = patched(yearOf("2025"), { "Epoque de construction": "Après 1990" });

    expect(() => parseParis(text(rows), decrees)).toThrow(ParisError);
    expect(() => parseParis(text(rows), decrees)).toThrow("Après 1990");
});

test("a year without a decree is a breakage", () =>
{
    expect(() => parseParis(text(yearOf("2027")), decrees)).toThrow(ParisError);
});

test("a year short of a flat is a breakage", () =>
{
    expect(() => parseParis(text(yearOf("2025").slice(1)), decrees)).toThrow(ParisError);
});

test("the same flat twice in a year is a breakage, even when the year is otherwise whole", () =>
{
    const rows = yearOf("2025");
    const twice = [rows[0]!, ...rows];

    expect(() => parseParis(text(twice), decrees)).toThrow(ParisError);
});

test("a missing column is a breakage", () =>
{
    const columns = header.filter((column) => column !== "Loyers de référence majorés");

    expect(() => parseParis(text(yearOf("2025"), columns), decrees)).toThrow(ParisError);
    expect(() => parseParis(text(yearOf("2025"), columns), decrees)).toThrow("Loyers de référence majorés");
});

test("a rent that is not plain euros and cents is a breakage", () =>
{
    for (const rent of ["31.445", "31,4", "", "-2.0", "3e1"])
    {
        const rows = patched(yearOf("2025"), { "Loyers de référence majorés": rent });

        expect(() => parseParis(text(rows), decrees)).toThrow(ParisError);
    }
});

test("a quartier outside 1 to 80 is a breakage", () =>
{
    for (const quartier of ["0", "81", "1.5", "x"])
    {
        const rows = patched(yearOf("2025"), { "Numéro du quartier": quartier });

        expect(() => parseParis(text(rows), decrees)).toThrow(ParisError);
    }
});
