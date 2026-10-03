import { expect, test } from "vitest";

import seen from "./lines.json" with { type: "json" };
import { AdemeError, listingsFrom } from "../src/ademe.js";

// A real answer of the ADEME open data for five diagnoses on the Place du Panthéon, cut down to the fields read.
test("every diagnosis becomes a listing with its rating, its dates and its flat, the newest first", () =>
{
    const listings = listingsFrom(seen);

    expect(listings.map((l) => l.dpe.number)).toEqual(["2675E2325806E", "2475E0959198G", "2375E1929024F", "2375E1759742J", "2375E0345814N"]);
    expect(listings[0]).toEqual({
        dpe: { number: "2675E2325806E", label: "E", establishedOn: "2026-09-10", validUntil: "2036-09-09" },
        address: "3 Place du Panthéon 75005 Paris",
        surface: 14680,
        floor: 4,
        detail: null,
        electric: false,
    });
});

test("a surface is kept in hundredths of a square metre and the floor and lot as written", () =>
{
    const byNumber = new Map(listingsFrom(seen).map((l) => [l.dpe.number, l]));

    expect(byNumber.get("2375E1759742J")).toMatchObject({ surface: 17260, floor: 0, detail: "Bat. 1; Etage 3; Porte Face" });
    expect(byNumber.get("2475E0959198G")).toMatchObject({ surface: 19400, floor: null, detail: "N°Lot : 4" });
});

// The 2026 change of formula lifts many flats heated with electricity out of F and G; the screen has to know which ones.
test("a flat heated with electricity is marked as such", () =>
{
    const byNumber = new Map(listingsFrom(seen).map((l) => [l.dpe.number, l]));

    expect(byNumber.get("2375E0345814N")?.electric).toBe(true);
    expect(byNumber.get("2375E1929024F")?.electric).toBe(false);
});

// ADEME publishes the diagnoses as diagnosticians send them and vouches for none; a line it cannot read is left out.
test("a line without a rating or a date is left out instead of guessed", () =>
{
    const [first, ...rest] = seen.results;
    const broken = [{ ...first, etiquette_dpe: "H" }, { ...first, date_etablissement_dpe: "10/06/2023" }, { ...first, numero_dpe: null }];

    expect(listingsFrom({ results: [...broken, ...rest] })).toHaveLength(4);
});

test("an answer that is not a list of results is a breakage", () =>
{
    expect(() => listingsFrom({})).toThrow(AdemeError);
    expect(() => listingsFrom(null)).toThrow(AdemeError);
});

// 64.35 × 100 is 6434.999999999999 in floating point: cutting it short would lose a hundredth.
test("a surface with two decimals keeps both, and a blank detail is no detail", () =>
{
    const [first] = seen.results;
    const [listing] = listingsFrom({ results: [{ ...first, surface_habitable_logement: 64.35, complement_adresse_logement: "  " }] });

    expect(listing).toMatchObject({ surface: 6435, detail: null });
});
