import { expect, test } from "vitest";

import { communeFrom, feeZoneNote, feeZoneOn, tenseNote, tenseOn } from "../lib/commune-zone";
import { regionList as communes, regionNamed as named, seededLists as lists } from "./zone-seeds";

// The acceptance cases read the lists on a lease of 25 November 2026.
const today = "2026-11-25";
const fee = (code: string, day = today) => feeZoneOn(named(code), day, lists);
const tense = (code: string, day = today) => tenseOn(named(code), day, lists);

test("a link names a commune by its code as text, and any other code leaves the form as it is", () =>
{
    expect(communeFrom("?commune=94080", communes)?.name).toBe("Vincennes");
    expect(communeFrom("?commune=93066&x=1", communes)?.name).toBe("Saint-Denis");
    expect(communeFrom("?commune=91377", communes)?.name).toBe("Massy");
    expect(communeFrom("?commune=01053", communes)).toBeUndefined();
    expect(communeFrom("?commune=99999", communes)).toBeUndefined();
    expect(communeFrom("?commune=94080%3Cscript%3E", communes)).toBeUndefined();
    expect(communeFrom("", communes)).toBeUndefined();
});

test("Versailles and Saint-Germain-en-Laye are tense and very tense; Massy and Cergy tense for both", () =>
{
    expect([fee("78646"), tense("78646"), fee("78551"), tense("78551")]).toEqual(["very-tense", true, "very-tense", true]);
    expect([fee("91377"), tense("91377"), fee("95127"), tense("95127")]).toEqual(["tense", true, "tense", true]);
});

// Part 2 of the list counts for agency fees only; zone A bis makes the fees very tense even outside both parts.
test("Barbizon is tense for the fees only, Bailly very tense for the fees only, Fontainebleau and Provins neither", () =>
{
    expect([fee("77022"), tense("77022")]).toEqual(["tense", false]);
    expect([fee("78043"), tense("78043")]).toEqual(["very-tense", false]);
    expect([fee("77186"), tense("77186"), fee("77379"), tense("77379")]).toEqual(["other", false, "other", false]);
});

// Alfortville joined zone A bis on 26 June 2026; the day before, it was only on the list, which Plafond holds from 24 December 2025.
test("Alfortville's fees are tense for a lease of 25 June 2026 and very tense from the next day", () =>
{
    expect(fee("94002", "2026-06-25")).toBe("tense");
    expect(fee("94002", "2026-06-26")).toBe("very-tense");
});

// Zone A bis is known from 7 September 2025 under the arrêté of 5 September 2025; the list only from 24 December 2025.
test("for a lease older than the versions Plafond holds, the zone is left to the tenant", () =>
{
    expect(fee("94080", "2025-10-01")).toBe("very-tense");
    expect(fee("94080", "2025-09-06")).toBeNull();
    expect(fee("91377", "2025-12-23")).toBeNull();
    expect(fee("91377", "2025-12-24")).toBe("tense");
    expect(tense("91377", "2025-12-23")).toBeNull();
    expect(feeZoneNote(named("91377"), null, lists)).toBe("Massy : pour un bail signé avant le 24 décembre 2025, Plafond n'a pas les listes de l'époque. Choisissez la zone vous-même.");
    expect(feeZoneNote(named("94080"), null, lists)).toContain("avant le 7 septembre 2025");
});

test("the form says where the zone comes from, asks for the lease's date for the notice, and lets the tenant change it", () =>
{
    expect(feeZoneNote(named("94080"), "very-tense", lists)).toBe("Vincennes : zone très tendue pour les frais d'agence, d'après les listes en vigueur à la date du bail. Vous pouvez corriger ce choix.");
    expect(tenseNote(named("94080"), null, lists, false)).toBe("Vincennes : indiquez la date de signature ou du dernier renouvellement du bail pour que Plafond retrouve la zone, ou répondez vous-même.");
    expect(tenseNote(named("94080"), null, lists, true)).toContain("avant le 24 décembre 2025, Plafond n'a pas la liste de l'époque");
    expect(tenseNote(named("77186"), false, lists, true)).toBe("Fontainebleau : hors zone tendue, d'après la liste en vigueur à la date du bail. Un autre motif peut tout de même réduire le préavis.");
});
