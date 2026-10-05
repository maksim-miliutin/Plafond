import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { QuartierPage } from "../components/QuartierPage";
import type { PlacePage } from "../lib/places";
import { placeMetadata } from "../lib/site";

const sorbonne: PlacePage = {
    slug: "sorbonne",
    number: 20,
    name: "Sorbonne",
    arrondissement: 5,
    decree: { title: "Arrêté préfectoral n° IDF-2026-06-12-00003", url: "https://example.org/decree", from: "2026-07-01", until: "2026-11-25", contest: null },
    rents: [
        { rooms: 2, period: "before-1946", empty: 3730, furnished: 4210 },
        { rooms: 1, period: "after-1990", empty: 3900, furnished: 4400 },
    ],
};
const page = renderToStaticMarkup(<QuartierPage place={sorbonne} />);

test("the page names the quartier, its arrondissement and the decree's dates", () =>
{
    expect(page).toMatch(/<h1[^>]*>Loyer de référence à Sorbonne<\/h1>/);
    expect(page).toContain("5e arrondissement");
    expect(page).toContain("1er juillet 2026");
    expect(page).toContain("24 novembre 2026");
});

test("two tables give the cap per square metre, empty and furnished, by size and period", () =>
{
    expect(page.match(/<table/g)).toHaveLength(2);
    expect(page).toContain("37,30\u00A0€");
    expect(page).toContain("42,10\u00A0€");
    expect(page.match(/<th[^>]*scope="col"/g)?.length).toBeGreaterThanOrEqual(8);
});

// 37,30 € per square metre times 40 m² is 1 492,00 €, counted by hand.
test("a worked example turns the cap into a monthly rent for a flat of 40 m²", () =>
{
    expect(page).toContain("1\u202F492,00\u00A0€");
});

test("the page leads to the check and names its decree", () =>
{
    expect(page).toMatch(/href="\.\.\/\.\.\/loyer\/"/);
    expect(page).toMatch(/href="https:\/\/example\.org\/decree"/);
});

test("its title and description fit what search engines show", () =>
{
    const described = placeMetadata(sorbonne);

    expect(String(described.title).length).toBeLessThanOrEqual(60);
    expect(String(described.description).length).toBeLessThanOrEqual(160);
    expect(described.alternates?.canonical).toMatch(/\/quartiers\/sorbonne\/$/);
});
