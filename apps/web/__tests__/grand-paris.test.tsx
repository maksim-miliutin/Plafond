import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { MetropoleCommune } from "@plafond/import";

import { CommuneSearch } from "../components/CommuneSearch";
import { GrandParis } from "../components/GrandParis";
import { applicability, matching, reachOf } from "../lib/metropole";

const communes: MetropoleCommune[] = [
    { code: "75056", name: "Paris", territory: "paris", former: [] },
    { code: "93048", name: "Montreuil", territory: "est-ensemble", former: [] },
    { code: "93039", name: "L'Île-Saint-Denis", territory: "plaine-commune", former: [] },
    { code: "93066", name: "Saint-Denis", territory: "plaine-commune", former: ["Pierrefitte-sur-Seine"] },
    { code: "94080", name: "Vincennes", territory: null, former: [] },
];

const page = renderToStaticMarkup(<GrandParis communes={communes} areas={[]} />);
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

// Plafond checks every territory around Paris whose rents a decree caps; one it did not check would send the tenant to
// the prefecture's simulator for that territory rather than say nothing is capped.
test("an Est Ensemble or Plaine Commune commune leads to the check, and an unchecked capped one to its official simulator", () =>
{
    expect(itemOf("Montreuil")).toMatch(/<a href="\.\.\/loyer\/">vérifier mon loyer<\/a>/);
    expect(itemOf("Saint-Denis")).toMatch(/<a href="\.\.\/loyer\/">vérifier mon loyer<\/a>/);
    expect(reachOf(communes[3]!, [])).toEqual({ kind: "capped", territory: "plaine-commune" });

    const unchecked = renderToStaticMarkup(<CommuneSearch communes={[communes[3]!]} checked={[]} />);
    expect(unchecked).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/R59027"');
    expect(unchecked).not.toContain("../loyer/");
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

// Every commune of the Grand Paris is in the tense zone: the list offers, as the map does, the checks that read the zone,
// each opening with the commune's code so that the form fills the zone in.
test("with its zone known, each commune offers the notice and agency fee checks for its own code", () =>
{
    const zoned = renderToStaticMarkup(<CommuneSearch communes={communes} zones={{ "94080": "very-tense", "93066": "very-tense" }} />).replaceAll("&#x27;", "'");
    const item = (name: string) => (zoned.match(/<li><strong>.*?<\/li>/g) ?? []).find((one) => one.includes(`<strong>${name}</strong>`)) ?? "";

    expect(item("Vincennes")).toContain('<span class="zone-tag">Zone tendue</span>');
    expect(item("Vincennes")).toContain('<a href="../preavis/?commune=94080">Vérifier mon préavis</a>');
    expect(item("Vincennes")).toContain('<a href="../frais-agence/?commune=94080">Vérifier les frais d\'agence</a>');
    expect(item("Saint-Denis")).toContain('href="../preavis/?commune=93066"');
    expect(item("Montreuil")).not.toContain("zone-tag");
});
