import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { Quartier } from "@plafond/domain";

import { QuartierStep } from "../components/QuartierStep";

const ring: [number, number][] = [[2.34, 48.86], [2.345, 48.86], [2.345, 48.863], [2.34, 48.863], [2.34, 48.86]];

function page(number: number): string
{
    const quartier: Quartier = { number, name: "Saint-Germain-l'Auxerrois", rings: [ring] };

    return renderToStaticMarkup(
        <QuartierStep quartier={quartier} around={[]} address="2 Rue de Rivoli 75001 Paris" point={{ lon: 2.342, lat: 48.861 }} />,
    );
}

test("the quartier is named the way the street sign names it", () =>
{
    expect(page(1)).toMatch(/<h1[^>]*>.*Saint-Germain-l&#x27;Auxerrois.*<\/h1>/s);
    expect(page(1)).toContain("1er arrondissement");
    expect(page(17)).toContain("5e arrondissement");
});

test("the map says in words what it shows", () =>
{
    expect(page(1)).toMatch(/<svg[^>]*role="img"[^>]*aria-label="[^"]*Saint-Germain-l&#x27;Auxerrois/);
});

test("the address found is shown so a wrong match can be caught", () =>
{
    expect(page(1)).toContain("2 Rue de Rivoli 75001 Paris");
    expect(page(1)).toContain("C&#x27;est bien ça");
    expect(page(1)).toContain("Corriger l&#x27;adresse");
});

test("the quartier is drawn over the official map of France, with its streets", () =>
{
    const html = page(1);

    expect(html).toMatch(/<image[^>]*href="https:\/\/data\.geopf\.fr\/wmts\?[^"]*PLANIGNV2/);
    expect(html.indexOf("<image")).toBeLessThan(html.indexOf("<path"));
});

test("the map credits IGN, as its open licence asks", () =>
{
    expect(page(1)).toMatch(/© <a href="https:\/\/www\.ign\.fr\/">IGN<\/a>/);
});
