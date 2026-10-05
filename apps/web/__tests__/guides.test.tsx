import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Guide } from "../components/Guide";
import { guides } from "../lib/guides";
import { pages } from "../lib/site";

test("every guide is a page of its own in the table, so it gets its title, its card and a place in the sitemap", () =>
{
    for (const guide of guides)
    {
        expect(pages.map((page) => page.path), guide.slug).toContain(`guides/${guide.slug}/`);
    }

    expect(new Set(guides.map((guide) => guide.slug)).size).toBe(guides.length);
    expect(new Set(pages.map((page) => page.title)).size).toBe(pages.length);
});

test("each guide leads to its check twice, at the top and at the end, and back to all the checks", () =>
{
    for (const guide of guides)
    {
        const page = renderToStaticMarkup(<Guide guide={guide} />);

        expect(page.match(new RegExp(`href="\\.\\./\\.\\./${guide.check.href}"`, "g")), guide.slug).toHaveLength(2);
        expect(page, guide.slug).toMatch(/<a[^>]*href="\.\.\/\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
        expect(page.match(/<h1/g), guide.slug).toHaveLength(1);
        expect(page.match(/<h2/g)?.length, guide.slug).toBeGreaterThanOrEqual(3);
    }
});

test("each guide names its official sources, by secure links", () =>
{
    for (const guide of guides)
    {
        expect(guide.sources.length, guide.slug).toBeGreaterThanOrEqual(1);
        for (const source of guide.sources)
        {
            expect(source.href, guide.slug).toMatch(/^https?:\/\//);
        }
    }
});

// Counted by hand: a rent of 1 200 € before charges, keys on 1 July, deadline 1 August, returned 2 September is two
// periods started late, so 240 €. A guide that teaches a rule has to get its own example right.
test("the deposit guide's worked example matches the rule it explains", () =>
{
    const deposit = guides.find((guide) => guide.slug === "depot-de-garantie")!;
    const said = deposit.sections.flatMap((section) => section.paragraphs).join(" ");

    expect(said).toContain("1er août");
    expect(said).toContain("2 septembre");
    expect(said).toContain("deux périodes, soit 240\u00A0€");
});

test("the first screen lists the four guides, and each check's first screen links to its own", async () =>
{
    const { Home } = await import("../components/Home");
    const { AddressStep } = await import("../components/AddressStep");
    const { DpeFindStep } = await import("../components/DpeFindStep");
    const { DepositFormStep } = await import("../components/DepositFormStep");
    const { ChargesFormStep } = await import("../components/ChargesFormStep");
    const home = renderToStaticMarkup(<Home />);

    for (const guide of guides)
    {
        expect(home, guide.slug).toContain(`href="guides/${guide.slug}/"`);
    }

    const firsts: [string, string][] = [
        [renderToStaticMarkup(<AddressStep />), "encadrement-des-loyers-paris"],
        [renderToStaticMarkup(<DpeFindStep />), "dpe-passoire-thermique"],
        [renderToStaticMarkup(<DepositFormStep fields={{} as never} errors={{}} />), "depot-de-garantie"],
        [renderToStaticMarkup(<ChargesFormStep fields={{}} errors={{}} />), "charges-recuperables"],
    ];
    for (const [page, slug] of firsts)
    {
        expect(page, slug).toMatch(new RegExp(`<a[^>]*href="\\.\\./guides/${slug}/"[^>]*>Comprendre la règle</a>`));
    }
});

test("the rent guide lists every arrondissement, so search engines and readers reach each quartier from it", async () =>
{
    const { DistrictLinks } = await import("../components/DistrictLinks");
    const rent = guides.find((guide) => guide.slug === "encadrement-des-loyers-paris")!;
    const districts = Array.from({ length: 20 }, (_, index) => ({ slug: index === 0 ? "paris-1er" : `paris-${index + 1}e`, number: index + 1 }));
    const page = renderToStaticMarkup(<Guide guide={rent} more={<DistrictLinks districts={districts} />} />);

    expect(page.match(/href="\.\.\/\.\.\/arrondissements\/paris-[0-9]+(er|e)\/"/g)).toHaveLength(20);
    expect(page).toContain(">1er arrondissement<");
    expect(page.indexOf("arrondissements/paris-1er")).toBeLessThan(page.indexOf("<h2>Sources</h2>"));
});

test("the three newer guides cover notice, yearly revision and the rent supplement, each with a page", () =>
{
    const slugs = guides.map((guide) => guide.slug);

    expect(slugs).toEqual(expect.arrayContaining(["preavis-de-depart", "revision-du-loyer", "complement-de-loyer"]));
    expect(guides.find((guide) => guide.slug === "preavis-de-depart")!.sections.flatMap((section) => section.paragraphs).join(" ")).toContain("zone tendue");
});
