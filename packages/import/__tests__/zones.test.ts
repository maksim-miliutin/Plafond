/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { metropoleOf } from "../src/metropole.js";
import { ZonesError, zonesOf } from "../src/zones.js";

import communes from "../../../db/seed/grand-paris-communes.csv?raw";
import lyon from "../../../db/seed/lyon-metropole-contours.geojson?raw";
import seed from "../../../db/seed/commune-zones.csv?raw";

const zones = zonesOf(seed);
const zoneOf = (code: string) => zones.find((row) => row.code === code)?.zone;

test("the table gives a zone to every commune of both métropoles, and to no other", () =>
{
    const grandParis = metropoleOf(communes).map((commune) => commune.code);
    const lyonCodes = (JSON.parse(lyon) as { features: { properties: { code: string } }[] }).features.map((feature) => feature.properties.code);

    expect(zones.map((row) => row.code).sort()).toEqual([...grandParis, ...lyonCodes].sort());
});

// Décret n° 2013-392 as amended by décret n° 2025-1267 of 22 December 2025, and zone A bis as the arrêté of
// 5 September 2025 sets it, Alfortville added by the arrêté of 23 June 2026.
test("every commune of the Grand Paris is tense and 68 of them very tense, Paris and Alfortville among them", () =>
{
    const grandParis = new Set(metropoleOf(communes).map((commune) => commune.code));
    const of = (zone: string) => zones.filter((row) => grandParis.has(row.code) && row.zone === zone).length;

    expect([of("very-tense"), of("tense"), of("other")]).toEqual([68, 62, 0]);
    expect(zoneOf("75056")).toBe("very-tense");
    expect(zoneOf("94002")).toBe("very-tense");
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
