/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { MetropoleError, metropoleOf } from "../src/metropole.js";

import seed from "../../../db/seed/grand-paris-communes.csv?raw";

// The Métropole du Grand Paris counts 130 communes since Pierrefitte-sur-Seine joined Saint-Denis on 1 January 2025.
// https://www.insee.fr/fr/metadonnees/geographie/intercommunalite/200054781-le-grand-paris
test("the seed lists the 130 communes of the Métropole once each, Paris among them as one commune", () =>
{
    const communes = metropoleOf(seed);
    const codes = new Set(communes.map((commune) => commune.code));

    expect(communes).toHaveLength(130);
    expect(codes.size).toBe(130);
    expect(communes.filter((commune) => commune.code.startsWith("75"))).toEqual([{ code: "75056", name: "Paris", territory: "paris", former: [] }]);
    expect(codes.has("93059")).toBe(false);
    expect(communes.find((commune) => commune.code === "93066")?.former).toEqual(["Pierrefitte-sur-Seine"]);
});

// Annex 1 of each decree names the communes: nine for Est Ensemble, and for Plaine Commune eight communes and the
// commune déléguée of Pierrefitte-sur-Seine, which has been part of Saint-Denis since 2025.
test("nine communes are capped by the Est Ensemble decree, eight by the Plaine Commune one, and 112 by none", () =>
{
    const communes = metropoleOf(seed);
    const of = (territory: string | null) => communes.filter((commune) => commune.territory === territory).map((commune) => commune.name).sort();

    expect(of("est-ensemble")).toEqual(["Bagnolet", "Bobigny", "Bondy", "Le Pré-Saint-Gervais", "Les Lilas", "Montreuil", "Noisy-le-Sec", "Pantin", "Romainville"].sort());
    expect(of("plaine-commune")).toEqual(["Aubervilliers", "Épinay-sur-Seine", "L'Île-Saint-Denis", "La Courneuve", "Saint-Denis", "Saint-Ouen-sur-Seine", "Stains", "Villetaneuse"].sort());
    expect(of(null)).toHaveLength(112);
});

test("a commune listed twice, a code that is not five digits, an arrondissement or an unknown territory is refused", () =>
{
    const list = (...lines: string[]) => ["code;name;territory;former", ...lines].join("\n");

    expect(metropoleOf(list("93048;Montreuil;est-ensemble;", "93006;Bagnolet;est-ensemble;"))).toHaveLength(2);
    expect(() => metropoleOf(list("93048;Montreuil;est-ensemble;", "93048;Montreuil;est-ensemble;"))).toThrow(MetropoleError);
    expect(() => metropoleOf(list("9348;Montreuil;est-ensemble;"))).toThrow(/^metropole: line 2/);
    expect(() => metropoleOf(list("93048;Montreuil;est-ensemble"))).toThrow(/^metropole: line 2/);
    expect(() => metropoleOf(list("75105;Paris 5e;paris;"))).toThrow(MetropoleError);
    expect(() => metropoleOf(list("94080;Vincennes;val-de-marne;"))).toThrow(/not a territory/);
    expect(() => metropoleOf("code;nom;territoire;anciennes\n93048;Montreuil;est-ensemble;")).toThrow(/first line/);
});
