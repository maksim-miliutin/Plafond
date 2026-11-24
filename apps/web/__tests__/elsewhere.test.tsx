import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Elsewhere } from "../components/Elsewhere";
import { territories } from "../lib/city-copy";

const page = renderToStaticMarkup(<Elsewhere />);
const checks = page.match(/<a[^>]*class="check"[^>]*>.*?<\/a>/gs) ?? [];

test("a tenant elsewhere in France gets the six checks that do not depend on the town, and no rent cap", () =>
{
    expect(checks.map((check) => check.match(/href="([^"]+)"/)![1])).toEqual(["../revision/", "../dpe/", "../depot/", "../charges/", "../preavis/", "../frais-agence/"]);
    expect(page).not.toMatch(/href="[^"]*loyer\//);
});

test("the page says where Plafond checks the rent cap and where other capped towns are listed", () =>
{
    expect(page).toContain("Plafond le vérifie à Paris, à Lyon, à Villeurbanne et dans les communes d&#x27;Est Ensemble et de Plaine Commune");
    expect(page).toContain(`href="${territories.href}"`);
    expect(page).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Accueil<\/a>/);
    expect(page.match(/<h1/g)).toHaveLength(1);
});
