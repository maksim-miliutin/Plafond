/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { estEnsemble } from "@plafond/address";

import { cityOf } from "../lib/cities";

import communes from "../../../db/seed/est-ensemble-communes.csv?raw";

test("a commune code tells the city whose rules apply: Paris for 751, Lyon for its arrondissements and Villeurbanne", () =>
{
    expect(cityOf("75105")).toBe("paris");
    expect(cityOf("69383")).toBe("lyon");
    expect(cityOf("69266")).toBe("lyon");
    expect(cityOf("93055")).toBe("est-ensemble");
});

// The geocoder lets through the communes it lists, and the decree's annex 1 names them: the two lists must agree.
test("every commune the Est Ensemble decree names is let through by the geocoder and checked under its decree", () =>
{
    const named = [...new Set(communes.trim().split("\n").slice(1).map((line) => line.split(";")[0]!))].sort();

    expect([...estEnsemble].sort()).toEqual(named);
    expect(named.map(cityOf)).toEqual(named.map(() => "est-ensemble"));
});
