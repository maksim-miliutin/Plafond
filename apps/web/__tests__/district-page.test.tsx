import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DistrictPage as District } from "../components/DistrictPage";
import { QuartierPage } from "../components/QuartierPage";
import type { DistrictPage, PlacePage } from "../lib/places";
import { districtMetadata } from "../lib/site";

const decree = { title: "Arrêté préfectoral n° IDF-2026-06-12-00003", url: "https://example.org/decree", from: "2026-07-01", until: "2026-11-25", contest: null };
const place = (number: number, name: string, slug: string): PlacePage => ({
    slug, number, name, arrondissement: 5, decree, rents: [{ rooms: 2, period: "before-1946", empty: 3730, furnished: 4210 }],
});
const fifth: DistrictPage = {
    slug: "paris-5e",
    number: 5,
    quartiers: [place(17, "Saint-Victor", "saint-victor"), place(18, "Jardin-des-Plantes", "jardin-des-plantes"), place(19, "Val-de-Grâce", "val-de-grace"), place(20, "Sorbonne", "sorbonne")],
    lowest: 2810,
    highest: 4860,
};
const page = renderToStaticMarkup(<District district={fifth} />);

test("the arrondissement page links each of its quartiers and gives the span of its caps", () =>
{
    expect(page).toMatch(/<h1[^>]*>Encadrement des loyers dans le 5e arrondissement<\/h1>/);
    for (const quartier of fifth.quartiers)
    {
        expect(page, quartier.slug).toContain(`href="../../quartiers/${quartier.slug}/"`);
    }

    expect(page).toContain("28,10\u00A0€");
    expect(page).toContain("48,60\u00A0€");
    expect(page).toMatch(/href="\.\.\/\.\.\/loyer\/"/);
});

test("each quartier page leads back to its arrondissement", () =>
{
    expect(renderToStaticMarkup(<QuartierPage place={fifth.quartiers[3]!} />)).toContain('href="../../arrondissements/paris-5e/"');
    expect(renderToStaticMarkup(<QuartierPage place={{ ...fifth.quartiers[3]!, arrondissement: 1 }} />)).toContain('href="../../arrondissements/paris-1er/"');
});

test("its title and description fit what search engines show", () =>
{
    const described = districtMetadata(fifth);

    expect(String(described.title).length).toBeLessThanOrEqual(60);
    expect(String(described.description).length).toBeLessThanOrEqual(160);
    expect(described.alternates?.canonical).toMatch(/\/arrondissements\/paris-5e\/$/);
});
