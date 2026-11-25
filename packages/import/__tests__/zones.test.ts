/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { metropoleOf } from "../src/metropole.js";
import { ZonesError, zoneListsOf, zonesOf } from "../src/zones.js";

import communes from "../../../db/seed/grand-paris-communes.csv?raw";
import lyon from "../../../db/seed/lyon-metropole-contours.geojson?raw";
import seed from "../../../db/seed/commune-zones.csv?raw";
import lists from "../../../db/seed/zone-lists.json?raw";

const zones = zonesOf(seed);
const zoneOf = (code: string) => zones.find((row) => row.code === code)?.zone;

// The communes of Île-de-France, the Grand Paris among them, have a table of their own: this one keeps the rest.
test("the table gives a zone to every commune drawn around Lyon, and to none of Île-de-France", () =>
{
    const grandParis = new Set(metropoleOf(communes).map((commune) => commune.code));
    const lyonCodes = (JSON.parse(lyon) as { features: { properties: { code: string } }[] }).features.map((feature) => feature.properties.code);

    expect(zones.map((row) => row.code).sort()).toEqual([...lyonCodes].sort());
    expect(zones.some((row) => grandParis.has(row.code))).toBe(false);
});

test("around Lyon no commune is very tense, and four of the Monts d'Or and the plain are not tense at all", () =>
{
    expect(zoneOf("69123")).toBe("tense");
    expect(zoneOf("69266")).toBe("tense");
    expect(zones.filter((row) => row.zone === "other").map((row) => row.name).sort()).toEqual(["Jonage", "Poleymieux-au-Mont-d'Or", "Quincieux", "Saint-Germain-au-Mont-d'Or"]);
});

test("a table that is not the one expected is refused", () =>
{
    expect(() => zonesOf("code;nom;zone\n75056;Paris;A bis\n")).toThrow(ZonesError);
    expect(() => zonesOf("code;nom;tendue;tres_tendue\n75056;Paris;1;2\n")).toThrow("line 2 is not a commune's code");
    expect(() => zonesOf("code;nom;tendue;tres_tendue\n75056;Paris;1;1\n75056;Paris;1;1\n")).toThrow("line 3 gives 75056 a second time");
    expect(() => zonesOf("code;nom;tendue;tres_tendue\n75056;Paris;0;1\n")).toThrow("puts Paris in zone A bis but outside the tense zone");
});

// The TLV list as décret n° 2025-1267 set it took effect on 24 December 2025; zone A bis as the arrêté of 23 June 2026 set it, on 26 June.
test("each list carries the day its version took effect and its source", () =>
{
    const read = zoneListsOf(JSON.parse(lists));

    expect([read.tense.from, read.veryTense.from]).toEqual(["2025-12-24", "2026-06-26"]);
    expect([read.earlierVeryTense.from, read.earlierVeryTense.until]).toEqual(["2025-09-07", "2026-06-26"]);
    expect(() => zoneListsOf({ ...read, earlierVeryTense: { ...read.earlierVeryTense, until: "2026-06-25" } })).toThrow("does not end the day");
    expect(read.tense.url).toMatch(/^https:\/\/www\.legifrance\.gouv\.fr\//);
    expect(() => zoneListsOf({ tense: read.tense })).toThrow("the veryTense list has no day it took effect");
    expect(() => zoneListsOf({ ...read, tense: { ...read.tense, from: "24/12/2025" } })).toThrow("the tense list has no day it took effect");
});
