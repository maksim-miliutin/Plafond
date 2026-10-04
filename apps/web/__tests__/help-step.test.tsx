import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { HelpStep } from "../components/HelpStep";
import { helpers, parisRent } from "../lib/help";

test("every free helper is named, says what it does and how to reach it", () =>
{
    const page = renderToStaticMarkup(<HelpStep helpers={helpers} />);

    expect(page).toMatch(/<h1[^>]*>Trouver une aide gratuite<\/h1>/);
    for (const helper of helpers)
    {
        expect(page).toContain(helper.name.replaceAll("'", "&#x27;"));
        for (const way of helper.reach)
        {
            expect(page).toContain(`href="${way.href}"`);
        }
    }
});

test("the ADIL is found through the national directory, and the commission through the official page", () =>
{
    const hrefs = helpers.flatMap((helper) => helper.reach.map((way) => way.href));

    expect(hrefs).toContain("https://www.anil.org/lanil-et-les-adil/votre-adil/");
    expect(hrefs).toContain("https://www.service-public.fr/particuliers/vosdroits/F1216");
});

test("the rent check adds the line the ADIL of Paris keeps for rent control", () =>
{
    const page = renderToStaticMarkup(<HelpStep helpers={[parisRent, ...helpers]} />);

    expect(page).toContain('href="tel:+33142795049"');
    expect(page).toContain('href="mailto:loyer.paris@adil75.org"');
});
