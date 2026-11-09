import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { LyonPage } from "../components/LyonPage";
import type { CommunePage } from "../lib/places";
import { communeMetadata } from "../lib/site";

const decree = { title: "Arrêté préfectoral n° DDT 69-2025-10-23-00004", url: "https://example.org/decree", from: "2025-11-01", until: "2026-11-01", contest: null };
const third: CommunePage = {
    slug: "lyon-3e-arrondissement",
    name: "Lyon 3e Arrondissement",
    decree,
    zones: [
        { zone: 2, rents: [{ rooms: 2, period: "before-1946", empty: 1690, furnished: 1890 }, { rooms: 1, period: "after-2005", empty: 1900, furnished: 2100 }] },
        { zone: 3, rents: [{ rooms: 2, period: "before-1946", empty: 1550, furnished: 1750 }] },
    ],
};
const page = renderToStaticMarkup(<LyonPage commune={third} />);

test("the page names the commune, its zones and the decree's dates", () =>
{
    expect(page).toMatch(/<h1[^>]*>Loyer de référence à Lyon 3e<\/h1>/);
    expect(page).toContain("1er novembre 2025");
    expect(page).toContain("31 octobre 2026");
    expect(page.match(/<h2[^>]*>Zone \d<\/h2>/g)).toHaveLength(2);
});

test("each zone gives two tables of caps, with Lyon's five construction periods", () =>
{
    expect(page.match(/<table/g)).toHaveLength(4);
    expect(page).toContain("après 2005");
    expect(page).toContain("16,90\u00A0€");
    expect(page).toContain("21,00\u00A0€");
});

test("the page leads to the check, since the zone depends on the exact address, and names its decree", () =>
{
    expect(page).toMatch(/href="\.\.\/\.\.\/loyer\/"/);
    expect(page).toMatch(/href="https:\/\/example\.org\/decree"/);
});

test("its title and description fit what search engines show", () =>
{
    const described = communeMetadata(third);

    expect(described.title).toBe("Loyer de référence Lyon 3e | Plafond");
    expect(String(described.description).length).toBeLessThanOrEqual(160);
    expect(described.alternates?.canonical).toMatch(/\/lyon\/lyon-3e-arrondissement\/$/);
});
