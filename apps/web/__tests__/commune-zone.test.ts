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

// The older versions reach back to 13 May 2013 for the list and 7 August 2014 for zone A bis. Alfortville entered zone A bis
// on 12 July 2024, left it on 7 September 2025 and came back on 26 June 2026.
test("for an older lease the zone comes from the version in force on its day, back to 2013 and 2014", () =>
{
    expect(fee("94080", "2025-10-01")).toBe("very-tense");
    expect(fee("94080", "2025-09-06")).toBe("very-tense");
    expect(fee("91377", "2025-12-23")).toBe("tense");
    expect(tense("91377", "2020-01-01")).toBe(true);
    expect(fee("94002", "2024-07-11")).toBe("tense");
    expect(fee("94002", "2024-07-12")).toBe("very-tense");
    expect(fee("94002", "2025-09-07")).toBe("tense");
    expect([fee("77022", "2020-01-01"), tense("77022", "2020-01-01")]).toEqual(["other", false]);
    expect([fee("77022", "2024-01-01"), tense("77022", "2024-01-01")]).toEqual(["tense", false]);
});

test("before the oldest versions, and for a commune merged from parts the zone treated apart, the tenant says", () =>
{
    expect(tense("91377", "2013-05-12")).toBeNull();
    expect(fee("91377", "2014-08-06")).toBeNull();
    expect(feeZoneNote(named("91377"), null, lists, "2014-08-06")).toBe("Massy : pour un bail signé avant le 7 août 2014, Plafond n'a pas les listes de l'époque. Choisissez la zone vous-même.");
    expect(fee("93066", "2020-01-01")).toBeNull();
    expect(fee("93066", "2025-10-01")).toBe("very-tense");
    expect(feeZoneNote(named("78551"), null, lists, "2020-01-01")).toBe("Saint-Germain-en-Laye : à cette date, la zone dépend de l'ancienne commune où se trouve le logement, réunie depuis à Saint-Germain-en-Laye. Choisissez la zone vous-même.");
    expect(tenseNote(named("91377"), null, lists, true)).toContain("avant le 13 mai 2013");
});

test("the form says where the zone comes from, asks for the lease's date for the notice, and lets the tenant change it", () =>
{
    expect(feeZoneNote(named("94080"), "very-tense", lists, today)).toBe("Vincennes : zone très tendue pour les frais d'agence, d'après les listes en vigueur à la date du bail. Vous pouvez corriger ce choix.");
    expect(tenseNote(named("94080"), null, lists, false)).toBe("Vincennes : indiquez la date de signature ou du dernier renouvellement du bail pour que Plafond retrouve la zone, ou répondez vous-même.");
    expect(tenseNote(named("77186"), false, lists, true)).toBe("Fontainebleau : hors zone tendue, d'après la liste en vigueur à la date du bail. Un autre motif peut tout de même réduire le préavis.");
});
