import { expect, test } from "vitest";

import seen from "./lines.json" with { type: "json" };
import type { Fetcher } from "@plafond/address";

import { AdemeError, ademe, listingsFrom } from "../src/ademe.js";

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

function answering(body: unknown, ok = true): Fetcher & { asked: URL[] }
{
    const asked: URL[] = [];
    const fetcher: Fetcher = async (url) =>
    {
        asked.push(new URL(url));

        return { ok, status: ok ? 200 : 503, json: async () => body };
    };

    return Object.assign(fetcher, { asked });
}

// A text search for an address brings the neighbours in: 24 200 matches for one square. Only the exact field keeps them out.
test("the diagnoses of an address are asked by its BAN identifier, exactly", async () =>
{
    const fetcher = answering(seen);
    const found = await ademe(fetcher).atAddress("75105_7034_00005");

    expect(Array.isArray(found) && found.length).toBe(5);
    expect(fetcher.asked[0]!.origin + fetcher.asked[0]!.pathname).toBe("https://data.ademe.fr/data-fair/api/v1/datasets/dpe03existant/lines");
    expect(fetcher.asked[0]!.searchParams.get("qs")).toBe('identifiant_ban:"75105_7034_00005"');
    expect(fetcher.asked[0]!.searchParams.get("select")?.split(",")).toEqual(expect.arrayContaining(["numero_dpe", "etiquette_dpe", "date_etablissement_dpe"]));
});

test("a diagnosis is asked by its number as printed on the lease, spaces and case aside", async () =>
{
    const fetcher = answering(seen);
    await ademe(fetcher).byNumber(" 2375 e192 9024f ");

    expect(fetcher.asked[0]!.searchParams.get("qs")).toBe('numero_dpe:"2375E1929024F"');
});

test("a number that cannot be a diagnosis number is refused without asking", async () =>
{
    const fetcher = answering(seen);

    expect(await ademe(fetcher).byNumber("2375E19")).toEqual({ kind: "malformed" });
    expect(await ademe(fetcher).byNumber('2375E1929024"')).toEqual({ kind: "malformed" });
    expect(fetcher.asked).toEqual([]);
});

test("an ADEME that cannot be reached is told apart from one that answers nonsense", async () =>
{
    const offline: Fetcher = async () =>
    {
        throw new TypeError("Failed to fetch");
    };

    expect(await ademe(offline).atAddress("75105_7034_00005")).toEqual({ kind: "unreachable" });
    expect(await ademe(answering(seen, false)).atAddress("75105_7034_00005")).toEqual({ kind: "unreachable" });
    await expect(ademe(answering({ error: "boom" })).atAddress("75105_7034_00005")).rejects.toThrow(AdemeError);
});

test("an identifier that could break out of the query is a breakage, and nothing is sent", async () =>
{
    const fetcher = answering(seen);

    await expect(ademe(fetcher).atAddress('75105" OR *')).rejects.toThrow(AdemeError);
    expect(fetcher.asked).toEqual([]);
});
