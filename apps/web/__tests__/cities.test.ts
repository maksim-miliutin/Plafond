/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { estEnsemble, plaineCommune } from "@plafond/address";

import { cityOf } from "../lib/cities";

import eastCommunes from "../../../db/seed/est-ensemble-communes.csv?raw";
import northCommunes from "../../../db/seed/plaine-commune-communes.csv?raw";

test("a commune code tells the city whose rules apply: Paris for 751, Lyon for its arrondissements and Villeurbanne", () =>
{
    expect(cityOf("75105")).toBe("paris");
    expect(cityOf("69383")).toBe("lyon");
    expect(cityOf("69266")).toBe("lyon");
    expect(cityOf("93055")).toBe("est-ensemble");
    expect(cityOf("93066")).toBe("plaine-commune");
});

function named(communes: string): string[]
{
    return [...new Set(communes.trim().split("\n").slice(1).map((line) => line.split(";")[0]!))].sort();
}

// The geocoder lets through the communes it lists, and each decree's annex 1 names them: the lists must agree.
test("every commune the decrees around Paris name is let through by the geocoder and checked under its own decree", () =>
{
    expect([...estEnsemble].sort()).toEqual(named(eastCommunes));
    expect([...plaineCommune].sort()).toEqual(named(northCommunes));
    expect(named(eastCommunes).map(cityOf)).toEqual(named(eastCommunes).map(() => "est-ensemble"));
    expect(named(northCommunes).map(cityOf)).toEqual(named(northCommunes).map(() => "plaine-commune"));
});
