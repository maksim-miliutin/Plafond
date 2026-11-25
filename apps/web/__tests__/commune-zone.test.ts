/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { zoneListsOf } from "@plafond/import";

import { communeFrom, feeZoneNote, feeZoneOn, tenseNote, tenseOn } from "../lib/commune-zone";

import sources from "../../../db/seed/zone-lists.json?raw";
import { seededZones } from "./zone-seeds";

const communes = seededZones;
const lists = zoneListsOf(JSON.parse(sources));
const named = (code: string) => communes.find((commune) => commune.code === code)!;

test("a link names a commune by its code, and any other code leaves the form as it is", () =>
{
    expect(communeFrom("?commune=94080", communes)?.name).toBe("Vincennes");
    expect(communeFrom("?commune=93066&x=1", communes)?.name).toBe("Saint-Denis");
    expect(communeFrom("?commune=99999", communes)).toBeUndefined();
    expect(communeFrom("?commune=94080%3Cscript%3E", communes)).toBeUndefined();
    expect(communeFrom("", communes)).toBeUndefined();
});

test("Vincennes is very tense for the fees and tense for the notice; Athis-Mons is tense for both", () =>
{
    expect(feeZoneOn(named("94080"), "2026-08-01", lists)).toBe("very-tense");
    expect(tenseOn(named("94080"), "2026-08-01", lists)).toBe(true);
    expect(feeZoneOn(named("91027"), "2026-08-01", lists)).toBe("tense");
    expect(tenseOn(named("91027"), "2026-08-01", lists)).toBe(true);
});

// Alfortville joined zone A bis on 26 June 2026: a lease signed the day before falls under a version the table does not hold.
test("Alfortville gets its zone filled in from 26 June 2026 only", () =>
{
    expect(feeZoneOn(named("94002"), "2026-06-25", lists)).toBeNull();
    expect(feeZoneOn(named("94002"), "2026-06-26", lists)).toBe("very-tense");
    expect(feeZoneNote(named("94002"), null, lists)).toBe("Alfortville : pour un bail signé avant le 26 juin 2026, Plafond n'a pas la liste de l'époque. Choisissez la zone vous-même.");
});

test("a commune only tense is filled in once both lists are in force, and a commune outside both as such", () =>
{
    expect(feeZoneOn(named("91027"), "2026-06-25", lists)).toBeNull();
    expect(feeZoneOn(named("69163"), "2026-07-01", lists)).toBe("other");
    expect(tenseOn(named("69163"), "2026-07-01", lists)).toBe(false);
    expect(tenseOn(named("91027"), "2025-12-23", lists)).toBeNull();
    expect(tenseOn(named("91027"), "2025-12-24", lists)).toBe(true);
});

test("the form says where the zone comes from, and that the tenant may change it", () =>
{
    expect(feeZoneNote(named("94080"), "very-tense", lists)).toBe("Vincennes : zone très tendue, d'après la liste en vigueur depuis le 26 juin 2026. Vous pouvez corriger ce choix.");
    expect(tenseNote(named("94080"), true, lists)).toBe("Vincennes : en zone tendue, d'après la liste en vigueur depuis le 24 décembre 2025. Vous pouvez corriger ce choix.");
    expect(tenseNote(named("94080"), null, lists)).toBe("Vincennes : pour une lettre reçue avant le 24 décembre 2025, Plafond n'a pas la liste de l'époque. Répondez vous-même.");
});
