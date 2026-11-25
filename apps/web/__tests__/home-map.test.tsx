import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { HomeMap, zoneSentences } from "../components/HomeMap";
import { homeMaps } from "./fixtures";

const page = renderToStaticMarkup(<HomeMap maps={homeMaps} />).replaceAll("&#x27;", "'");

test("the map opens on the Grand Paris, and a tab switches it to Lyon", () =>
{
    expect(page).toMatch(/<div role="tablist" aria-label="Choisir le plan"/);
    expect(page).toMatch(/<button type="button" role="tab" id="map-tab-grand-paris" aria-selected="true" aria-controls="map-panel">Grand Paris<\/button>/);
    expect(page).toMatch(/<button type="button" role="tab" id="map-tab-lyon" aria-selected="false" aria-controls="map-panel">Lyon et Villeurbanne<\/button>/);
    expect(page).toMatch(/<div role="tabpanel" id="map-panel" aria-labelledby="map-tab-grand-paris"/);
});

test("the plan says in words what it shows, and names each shape where the pointer rests", () =>
{
    expect(page).toMatch(/<svg role="img" aria-label="Plan du Grand Paris : Paris par arrondissement, Est Ensemble, Plaine Commune et les autres communes de la Métropole"/);
    expect(page.match(/<title>[^<]+<\/title>/g)).toEqual(["<title>Paris 11e</title>", "<title>Montreuil</title>", "<title>Vincennes</title>"]);
    expect(page).toContain('class="shape plain"');
    expect(page).toContain('class="shape est-ensemble"');
});

test("before a touch, the card says what a touch tells, and the key names what each colour means", () =>
{
    expect(page).toContain("Touchez votre arrondissement ou votre commune sur le plan pour savoir ce que Plafond y vérifie.");
    expect([...page.matchAll(/<li class="[^"]+">([^<]+)<\/li>/g)].map(([, text]) => text)).toEqual([
        "Paris, loyer encadré",
        "Est Ensemble, loyer encadré",
        "Plaine Commune, loyer encadré",
        "Sans loyer de référence",
    ]);
});

// Article 15 of loi n° 89-462: one month of notice for an empty dwelling in a tense zone, three elsewhere; décret
// n° 2014-890 caps agency fees highest in zone A bis, lower in the rest of the tense zone, lowest outside it.
test("a commune without reference rents is told the notice and the agency fee cap of its zone", () =>
{
    expect(zoneSentences["very-tense"]).toBe("Zone très tendue : le préavis d'un logement vide est d'un mois, et les frais d'agence suivent le plafond le plus élevé.");
    expect(zoneSentences.tense).toBe("Zone tendue : le préavis d'un logement vide est d'un mois, et les frais d'agence suivent le plafond de la zone tendue.");
    expect(zoneSentences.other).toBe("Hors zone tendue : le préavis d'un logement vide est de trois mois, et les frais d'agence suivent le plafond le plus bas.");
});

test("the small map of Île-de-France shows where the Grand Paris lies", () =>
{
    expect(page).toMatch(/<g transform="translate\(468,12\)" class="inset">/);
});

// The outlines are reused under the Open Database License and the zones under the Licence Ouverte: both ask for the source.
test("the plan names where its outlines and its zones come from, and their licences", () =>
{
    expect(page).toContain('Contours des communes\u00A0: <a href="https://www.data.gouv.fr/datasets/contours-administratifs">data.gouv.fr</a> (ODbL).');
    expect(page).toContain("(Licence Ouverte)");
});
