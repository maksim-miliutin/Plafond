import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DpeFindStep, dpeProblems } from "../components/DpeFindStep";

const page = renderToStaticMarkup(<DpeFindStep />);

test("one labelled field takes either the diagnosis number or the address", () =>
{
    expect(page).toMatch(/<label for="dpe-search"[^>]*>Numéro du DPE ou adresse du logement<\/label>/);
    expect(page).toMatch(/<input[^>]*id="dpe-search"/);
    expect(page).toContain("13 caractères");
});

test("the screen says where the address goes, and that nothing is kept", () =>
{
    expect(page).toContain("ADEME");
    expect(page).toContain("Rien n&#x27;est enregistré");
    expect(page).toMatch(/<form[^>]*method="dialog"/);
});

test("every reason a search can fail is explained under the field and tied to it", () =>
{
    for (const [problem, explained] of Object.entries(dpeProblems))
    {
        const refused = renderToStaticMarkup(<DpeFindStep typed="7 place du Panthéon" problem={problem as keyof typeof dpeProblems} />);
        const field = refused.match(/<input[^>]*id="dpe-search"[^>]*>/)?.[0] ?? "";

        expect(refused, problem).toContain(explained.replaceAll("'", "&#x27;"));
        expect(field, problem).toMatch(/aria-describedby="[^"]*dpe-search-error"/);
        expect(field, problem).toContain('value="7 place du Panthéon"');
    }
});

test("the first screen of the energy check leads back to all the checks", () =>
{
    expect(page).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
});
