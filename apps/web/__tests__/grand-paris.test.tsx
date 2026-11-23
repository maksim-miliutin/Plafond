import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { MetropoleCommune } from "@plafond/import";

import { GrandParis } from "../components/GrandParis";
import { applicability, matching, reachOf } from "../lib/metropole";

const communes: MetropoleCommune[] = [
    { code: "75056", name: "Paris", territory: "paris", former: [] },
    { code: "93048", name: "Montreuil", territory: "est-ensemble", former: [] },
    { code: "93039", name: "L'Île-Saint-Denis", territory: "plaine-commune", former: [] },
    { code: "93066", name: "Saint-Denis", territory: "plaine-commune", former: ["Pierrefitte-sur-Seine"] },
    { code: "94080", name: "Vincennes", territory: null, former: [] },
];

const page = renderToStaticMarkup(<GrandParis communes={communes} />);
const items = page.match(/<li><strong>.*?<\/li>/g) ?? [];

function itemOf(name: string): string
{
    return items.find((item) => item.includes(`<strong>${name.replace("'", "&#x27;")}</strong>`)) ?? "";
}

test("every commune is listed before anything is typed, each with what Plafond can do for it", () =>
{
    expect(items).toHaveLength(5);
    expect(page).toContain("5 communes");
    expect(itemOf("Paris")).toMatch(/<a href="\.\.\/loyer\/">vérifier mon loyer<\/a>/);
    expect(itemOf("Vincennes")).toContain("Pas de loyer de référence");
    expect(itemOf("Vincennes")).toMatch(/<a href="\.\.\/ailleurs\/">/);
});

// The decrees of Est Ensemble and Plaine Commune cap the rents there; until Plafond prices them, it sends the tenant
// to the prefecture's simulator for that territory rather than saying nothing is capped.
test("a capped commune Plafond does not check yet is sent to its territory's official simulator", () =>
{
    expect(itemOf("Montreuil")).toContain("Est Ensemble");
    expect(itemOf("Montreuil")).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/R61539"');
    expect(itemOf("Saint-Denis")).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/R59027"');
    expect(itemOf("Saint-Denis")).not.toContain("../loyer/");
    expect(reachOf(communes[1]!, ["est-ensemble"])).toEqual({ kind: "checked" });
});

test("the page names the official check of each commune's rules and has one heading of the first level", () =>
{
    expect(page).toContain(`href="${applicability}"`);
    expect(page).toMatch(/<label for="commune"[^>]*>Votre commune<\/label>/);
    expect(page.match(/<h1/g)).toHaveLength(1);
});

test("a name typed without its accents, hyphens, spaces or apostrophe still finds the commune, and a former commune the one it joined", () =>
{
    const names = (typed: string) => matching(communes, typed).map((commune) => commune.name);

    expect(names("montreuil")).toEqual(["Montreuil"]);
    expect(names("  MONTREUIL ")).toEqual(["Montreuil"]);
    expect(names("ile saint denis")).toEqual(["L'Île-Saint-Denis"]);
    expect(names("lile saint denis")).toEqual(["L'Île-Saint-Denis"]);
    expect(names("saint-denis")).toEqual(["L'Île-Saint-Denis", "Saint-Denis"]);
    expect(names("Pierrefitte")).toEqual(["Saint-Denis"]);
    expect(names("Lyon")).toEqual([]);
    expect(names("")).toHaveLength(5);
});

// A postal code would match an INSEE code by chance, 93100 none and 930 the wrong communes: digits ask for the name.
test("digits typed in the search find nothing and ask for the commune's name", () =>
{
    expect(matching(communes, "93100")).toEqual([]);
    expect(matching(communes, "93 0")).toEqual([]);
    expect(itemOf("Saint-Denis")).toContain("(avec Pierrefitte-sur-Seine)");
});
