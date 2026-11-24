/// <reference types="vite/client" />
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { lawOf, seedsFrom } from "@plafond/import";

import { TerritoryPage } from "../components/TerritoryPage";
import { simulators } from "../lib/metropole";
import { PlacesError, territoryFacts } from "../lib/places";
import { territoryCopy } from "../lib/territory-copy";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const { estEnsemble, plaineCommune } = seedsFrom((name) => files[`../../../db/seed/${name}`]!);
const copy = territoryCopy["est-ensemble"];
const facts = territoryFacts("est-ensemble", estEnsemble, lawOf(lawSeed), copy.example);
const page = renderToStaticMarkup(<TerritoryPage copy={copy} {...facts} simulator={simulators["est-ensemble"]} />).replaceAll("&#x27;", "'");

// 48 m² at 22,30 €, the majored rent of sector 307 for an empty flat of two rooms built 1946-1970, page 14 of the 2026 decree.
test("the worked example at 29 rue Parmentier is checked against the tables, and names the page of the decree it reads", () =>
{
    expect(facts.example).toMatchObject({ kind: "checked", cap: 107040, rate: { majored: 2230 } });
    expect(page).toContain("Prenons un appartement de 2 pièces, loué vide,");
    expect(page).toContain("Le 29 rue Parmentier, à Montreuil, est dans le secteur 307.");
    expect(page).toContain("1 070,40 € par mois hors charges");
    expect(page).toMatch(/<a href="https:\/\/www\.drihl\.ile-de-france\.developpement-durable\.gouv\.fr\/IMG\/pdf\/arrete_ee-2\.pdf#page=14">Arrêté préfectoral n° IDF-2026-04-28-00032, page 14<\/a>/);
});

test("the page lists the nine communes with their sectors, Montreuil with two, and the days of the leases it checks", () =>
{
    expect(facts.communes).toHaveLength(9);
    expect(page).toContain("Montreuil, secteurs 307 et 308");
    expect(page).toContain("Pantin, secteur 308");
    expect(page).toContain("Plafond vérifie les baux signés du 1er décembre 2021 au 24 novembre 2026.");
});

test("the page leads to the check, to Service Public's pages and to the official simulator, and has one main heading", () =>
{
    expect(page).toMatch(/<a class="primary link-button" href="\.\.\/\.\.\/loyer\/">Vérifier mon loyer à Est Ensemble<\/a>/);
    expect(page).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/F36219"');
    expect(page).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/R61539"');
    expect(page).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/F34401"');
    expect(page.match(/<h1/g)).toHaveLength(1);
    expect(page).not.toContain("renouvellement");
    expect(page).toContain("Pour un bail signé après le dernier arrêté connu, Plafond le dit et renvoie à cet arrêté.");
});

test("an example no decree prices stops the build rather than printing a guess", () =>
{
    expect(() => territoryFacts("est-ensemble", estEnsemble, lawOf(lawSeed), { ...copy.example, signedOn: "2026-12-15" })).toThrow(PlacesError);
});

// 50 m² at 18,60 €, the majored rent of sector 311 for an empty flat of two rooms built 1946-1970, page 6 of the 2026 decree.
test("the Plaine Commune page works its example at 11 rue Guy Môquet and lists Saint-Denis in two sectors, Pierrefitte in one", () =>
{
    const north = territoryCopy["plaine-commune"];
    const known = territoryFacts("plaine-commune", plaineCommune, lawOf(lawSeed), north.example);
    const html = renderToStaticMarkup(<TerritoryPage copy={north} {...known} simulator={simulators["plaine-commune"]} />).replaceAll("&#x27;", "'");

    expect(known.example).toMatchObject({ kind: "checked", cap: 93000, rate: { majored: 1860 } });
    expect(html).toContain("Le 11 rue Guy Môquet, à Saint-Denis, est dans le secteur 311.");
    expect(html).toContain("930,00\u00A0€ par mois hors charges");
    expect(html).toContain("arrete_pco-2.pdf#page=6");
    expect(html).toContain("Saint-Denis, secteurs 311 et 312");
    expect(html).toContain("Pierrefitte-sur-Seine, secteur 317");
    expect(known.communes).toHaveLength(9);
    expect(html).toContain("Plafond vérifie les baux signés du 1er juin 2021 au 24 novembre 2026.");
    expect(html).toContain('href="https://www.service-public.gouv.fr/particuliers/vosdroits/F35761"');
});
