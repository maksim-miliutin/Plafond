import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { CheckList } from "../components/Checks";
import { Home } from "../components/Home";
import { homeMaps } from "./fixtures";

const page = renderToStaticMarkup(<Home maps={homeMaps} />);

test("beside the map, one plain line reaches both city pages and the rest of France, with no picture doors", () =>
{
    const line = /<nav class="elsewhere" aria-label="Villes">.*?<\/nav>/s.exec(page)?.[0] ?? "";
    const links = [...line.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(([, href, name]) => [href, name]);

    expect(line).toContain("Sans passer par la carte");
    expect(links).toEqual([["paris/", "Paris"], ["lyon/", "Lyon et Villeurbanne"], ["ailleurs/", "une autre ville en\u00A0France"]]);
    expect(page).not.toContain('class="check"');
    expect(page).not.toContain('href="grand-paris/"');
});

test("the first screen asks where the home is and leaves the guides to the city pages", () =>
{
    expect(page.match(/<h1[^>]*>.*?<\/h1>/g)).toEqual(['<h1 class="title">Où se trouve votre logement ?</h1>']);
    expect(page).not.toMatch(/href="guides\//);
});

// A crawler and a tenant in a hurry both reached the checks only through a city page; the cities still come first.
test("under the cities, the first screen links the seven checks by their questions, the rent check with the towns it covers", () =>
{
    const listed = page.match(/<section[^>]*aria-labelledby="home-checks"[^>]*>.*?<\/section>/s)?.[0] ?? "";
    const links = [...listed.matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(([, href, question]) => [href, question!.replaceAll("&#x27;", "'")]);

    expect(page.indexOf("home-checks")).toBeGreaterThan(page.indexOf('href="lyon/"'));
    expect(links).toEqual([
        ["loyer/", "Mon loyer dépasse-t-il le plafond légal\u00A0?"],
        ["revision/", "Ma hausse de loyer respecte-t-elle l'indice\u00A0?"],
        ["dpe/", "Mon logement est-il une passoire thermique\u00A0?"],
        ["depot/", "Mon dépôt de garantie m'a-t-il été rendu à temps\u00A0?"],
        ["charges/", "Ma régularisation de charges est-elle juste\u00A0?"],
        ["preavis/", "Combien de temps dure mon préavis\u00A0?"],
        ["frais-agence/", "Mes frais d'agence dépassent-ils le plafond\u00A0?"],
    ]);
    expect(listed).toMatch(/plafond légal\u00A0\?<\/a><span class="reach">À Paris, Lyon, Villeurbanne, Est Ensemble et Plaine Commune\.<\/span>/);
});

test("the home names the very checks a city page offers, from the same list", () =>
{
    const city = renderToStaticMarkup(<CheckList base="" rentReach="Partout." />);
    const hrefs = (markup: string) => [...markup.matchAll(/<a href="([^"]+)"/g)].map(([, href]) => href);
    const listed = page.match(/<section[^>]*aria-labelledby="home-checks"[^>]*>.*?<\/section>/s)?.[0] ?? "";

    expect(hrefs(listed)).toEqual(hrefs(city));
});

// The agency fees letter goes to the agency, and a check that finds nothing to claim offers no letter at all.
test("the welcome promises a letter only when the case calls for one, to the landlord or to the agency", () =>
{
    const text = page.replaceAll("&#x27;", "'");

    expect(text).toContain("Quand votre cas le justifie, Plafond prépare la lettre au propriétaire ou à l'agence.");
    expect(text).not.toContain("Chacune se termine par une lettre");
});

// On a phone the list of checks broke two questions before their question mark, which then stood alone on a line.
test("no question of a check can break before its question mark, in the list or in the cards", () =>
{
    const city = renderToStaticMarkup(<CheckList base="" rentReach="Partout." />);
    const questions = [...`${page}${city}`.matchAll(/(?:<strong>|<a href="[^"]+">)([^<]*\?)<\/(?:strong|a)>/g)].map(([, question]) => question);

    expect(questions.length).toBe(14);
    expect(questions.filter((question) => !question!.endsWith(" ?"))).toEqual([]);
});
