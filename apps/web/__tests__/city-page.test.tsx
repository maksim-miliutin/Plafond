import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { Quartier, Span } from "@plafond/domain";

import { CityPage } from "../components/CityPage";
import { guides } from "../lib/guides";

const square: Quartier["rings"] = [[[2.3, 48.85], [2.31, 48.85], [2.31, 48.86], [2.3, 48.86], [2.3, 48.85]]];
const span: Span = { from: "2019-07-01", lastDay: "2026-11-24" };
const links = [
    { href: "../arrondissements/paris-1er/", label: "1er arrondissement" },
    { href: "../arrondissements/paris-2e/", label: "2e arrondissement" },
];

function paris(lastDay = span.lastDay): string
{
    return renderToStaticMarkup(<CityPage city="paris" outlines={[square]} span={{ ...span, lastDay }} links={links} />);
}

test("the page names the leases Plafond can check, with the days of the data", () =>
{
    expect(paris()).toContain("Plafond vérifie les baux signés du 1er juillet 2019 au 24 novembre 2026, dans les 20 arrondissements");
    expect(paris("2028-11-23")).toContain("au 23 novembre 2028, dans les 20 arrondissements");
});

test("every check is offered one floor up, even before the map loads", () =>
{
    const tiles = paris().match(/<a[^>]*class="check"[^>]*>.*?<\/a>/gs) ?? [];

    expect(tiles.map((tile) => tile.match(/href="([^"]*)"/)?.[1])).toEqual(["../loyer/", "../revision/", "../dpe/", "../depot/", "../charges/", "../preavis/", "../frais-agence/"]);
    expect(tiles[0]).toContain("Dans les 20 arrondissements, avec l&#x27;encadrement des loyers.");
    expect(tiles[0]).not.toContain("Lyon");
});

test("the district links come as given", () =>
{
    expect(paris()).toMatch(/href="\.\.\/arrondissements\/paris-1er\/"[^>]*>1er arrondissement<\/a>.*href="\.\.\/arrondissements\/paris-2e\/"[^>]*>2e arrondissement<\/a>/s);
});

test("the guides leave out the other city's", () =>
{
    const page = paris();

    expect(page.match(/href="\.\.\/guides\//g)).toHaveLength(guides.length - 1);
    expect(page).toContain('href="../guides/encadrement-des-loyers-paris/"');
    expect(page).not.toContain('href="../guides/encadrement-des-loyers-lyon/"');
});

test("the neighbours line points to the ANIL list of the territories", () =>
{
    expect(paris()).toContain("Plaine Commune et Est Ensemble");
    expect(paris()).toContain('href="https://www.anil.org/aj-experimentation-encadrement-niveau-loyers-zones-tendues/"');
});

test("the map is labelled in French and credits IGN and Leaflet", () =>
{
    expect(paris()).toMatch(/role="region"[^>]*aria-label="Plan de Paris avec la limite de l&#x27;encadrement des loyers"|aria-label="Plan de Paris avec la limite de l&#x27;encadrement des loyers"[^>]*role="region"/);
    expect(paris()).toContain("Fond de carte");
    expect(paris()).toContain('href="https://www.ign.fr/"');
    expect(paris()).toContain('href="https://leafletjs.com/"');
});

test("Changer de ville leads home and the notice is one tap away", () =>
{
    expect(paris()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Changer de ville<\/a>/);
    expect(paris()).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
});
