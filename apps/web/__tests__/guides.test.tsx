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
