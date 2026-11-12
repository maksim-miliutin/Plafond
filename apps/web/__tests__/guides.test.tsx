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

test("the notice guide cites service-public's page and says an e-mail does not count", () =>
{
    const leaving = guides.find((guide) => guide.slug === "preavis-de-depart")!;

    expect(leaving.sources.map((source) => source.href)).toContain("https://www.service-public.gouv.fr/particuliers/vosdroits/F1168");
    expect(leaving.sections.flatMap((section) => section.paragraphs).join(" ")).toContain("Un simple e-mail ne suffit pas.");
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

test("the first screen lists every guide, and each check's first screen links to its own", async () =>
{
    const { Home } = await import("../components/Home");
    const { AddressStep } = await import("../components/AddressStep");
    const { DpeFindStep } = await import("../components/DpeFindStep");
    const { DepositFormStep } = await import("../components/DepositFormStep");
    const { ChargesFormStep } = await import("../components/ChargesFormStep");
    const { NoticeFormStep } = await import("../components/NoticeFormStep");
    const { noticeStart } = await import("../lib/notice-flow");
    const { FeesFormStep } = await import("../components/FeesFormStep");
    const { feesStart } = await import("../lib/fees-flow");
    const { RevisionFormStep } = await import("../components/RevisionFormStep");
    const { revisionStart } = await import("../lib/revision-flow");
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
        [renderToStaticMarkup(<NoticeFormStep fields={noticeStart.fields} errors={{}} />), "preavis-de-depart"],
        [renderToStaticMarkup(<FeesFormStep fields={feesStart.fields} errors={{}} />), "frais-d-agence"],
        [renderToStaticMarkup(<RevisionFormStep fields={revisionStart.fields} errors={{}} />), "revision-du-loyer"],
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

test("Lyon has its own guide, with the day its control began and the annulled decree of 2023", () =>
{
    const lyon = guides.find((guide) => guide.slug === "encadrement-des-loyers-lyon");
    const said = [lyon?.intro ?? "", ...(lyon?.sections.flatMap((section) => section.paragraphs) ?? [])].join(" ");

    expect(lyon?.check.href).toBe("loyer/");
    expect(said).toContain("1er novembre 2021");
    expect(said).toContain("14 octobre 2025");
    expect(said).toContain("préfet du Rhône");
});


test("the Lyon guide lists each commune's page, so readers and search engines reach every zone from it", async () =>
{
    const { CommuneLinks } = await import("../components/CommuneLinks");
    const lyon = guides.find((guide) => guide.slug === "encadrement-des-loyers-lyon")!;
    const communes = [{ slug: "lyon-1er-arrondissement", name: "Lyon 1er Arrondissement" }, { slug: "villeurbanne", name: "Villeurbanne" }];
    const page = renderToStaticMarkup(<Guide guide={lyon} more={<CommuneLinks communes={communes} />} />);

    expect(page).toContain('href="../../lyon/lyon-1er-arrondissement/"');
    expect(page).toContain(">Lyon 1er<");
    expect(page).toContain('href="../../lyon/villeurbanne/"');
});

test("the agency fees guide shows every row of caps from the seed, with its dates and its text", async () =>
{
    const { FeeCapsTable } = await import("../components/FeeCapsTable");
    const seed = (await import("../../../db/seed/agency-fees.json")).default;
    const { feeCapsOf } = await import("@plafond/import");
    const fees = guides.find((guide) => guide.slug === "frais-d-agence")!;
    const page = renderToStaticMarkup(<Guide guide={fees} more={<FeeCapsTable caps={feeCapsOf(seed)} />} />);

    expect(fees.check.href).toBe("frais-agence/");
    expect(page.match(/<table/g)).toHaveLength(2);
    expect(page).toContain("Baux signés du 15 septembre 2014 au 31 décembre 2025");
    expect(page).toContain("Baux signés du 1er janvier 2026 au 31 décembre 2026");
    for (const sum of ["12,10", "10,09", "8,07", "3,03", "12,00", "10,00", "8,00", "3,00"])
    {
        expect(page, sum).toContain(`${sum}\u00A0€`);
    }

    expect(page).toMatch(/<a[^>]*href="https:\/\/www.legifrance.gouv.fr\/loda\/id\/JORFTEXT000051949607\/"/);
    expect(page).toContain(">Décret n° 2014-890 du 1er août 2014</a>");
    expect(page).toContain(">Arrêté du 17 juillet 2025 modifié par l&#x27;arrêté du 13 novembre 2025</a>");
});

test("the agency fees guide names the zones and the way to be paid back, and leaves the sums to the table", () =>
{
    const fees = guides.find((guide) => guide.slug === "frais-d-agence")!;
    const said = fees.sections.flatMap((section) => section.paragraphs).join(" ");

    expect(said).toContain("zone A bis");
    expect(said).toContain("décret n° 2013-392 du 10 mai 2013");
    expect(said).toContain("DGCCRF");
    expect(said).toContain("ne peut pas dépasser celle du propriétaire");
    expect(said).not.toMatch(/\d+,\d{2}/);
});

test("the revision guide shows the index of the last three years from the seed, newest first, with its source", async () =>
{
    const { IndexTable } = await import("../components/IndexTable");
    const seed = (await import("../../../db/seed/irl.json")).default;
    const { indexOf } = await import("@plafond/import");
    const rise = guides.find((guide) => guide.slug === "revision-du-loyer")!;
    const read = indexOf(seed);
    const page = renderToStaticMarkup(<Guide guide={rise} more={<IndexTable index={read} />} />);
    const rows = page.match(/<tr>.*?<\/tr>/gs) ?? [];

    expect(rise.check.href).toBe("revision/");
    expect(rows).toHaveLength(13);
    expect(rows[1]).toContain("3e trimestre 2026");
    expect(rows[1]).toContain("148,06");
    expect(rows[1]).toContain("15 octobre 2026");
    expect(rows[12]).toContain("4e trimestre 2023");
    expect(page).toMatch(/<a[^>]*href="https:\/\/anil.org\/outils\/indices-et-plafonds\/tableau-de-lirl"/);
});
