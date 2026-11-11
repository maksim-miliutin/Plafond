import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { revision, type IndexRow, type Revision } from "@plafond/domain";

import { RevisionResultStep } from "../components/RevisionResultStep";

const index: IndexRow[] = [
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
];
const lease: Revision = { clause: true, rent: 60000, asked: 62000, quarter: 2, signedOn: "2025-07-20", revisedOn: "2026-07-20", askedOn: "2026-08-03" };

function page(change: Partial<Revision> = {}, clauseAssumed = false, writable = true): string
{
    const asked = { ...lease, ...change };

    return renderToStaticMarkup(
        <RevisionResultStep lease={asked} clauseAssumed={clauseAssumed} check={revision(asked, index)} writable={writable} onHelp={() => undefined} />,
    );
}

test("a rise above the index leads with what is too much each month, then the two rents", () =>
{
    expect(page()).toMatch(/<h1[^>]*>.*13,09 €.*de trop chaque mois<\/h1>/);
    expect(page()).toContain("620,00 €");
    expect(page()).toContain("606,91 €");
    expect(page()).toContain("Indice du 2e trimestre 2026 : 148,37. Indice du 2e trimestre 2025 : 146,68.");
    expect(page()).toContain("600,00 € × 148,37 / 146,68 = 606,91 €");
});

test("a rise within the index says so, with no letter to prepare", () =>
{
    expect(page({ asked: 60691 })).toMatch(/<h1[^>]*>La hausse respecte l&#x27;indice<\/h1>/);
    expect(page({ asked: 60691 }, false, false)).not.toContain("Préparer la lettre");
});

test("a rise asked late counts from the request, and the tenant learns until when the judge can be asked", () =>
{
    expect(page()).toContain("La hausse ne compte qu&#x27;à partir de la demande du propriétaire, le 3 août 2026");
    expect(page()).toContain("jusqu&#x27;au 19 juillet 2029");
});

test("a lapsed revision and a lease without a clause each say the rent stays", () =>
{
    expect(page({ askedOn: "2027-07-20" })).toMatch(/<h1[^>]*>La révision de cette année est perdue<\/h1>/);
    expect(page({ askedOn: "2027-07-20" })).toContain("au plus tard le 19 juillet 2027");
    expect(page({ clause: false })).toMatch(/<h1[^>]*>Sans clause de révision, pas de hausse<\/h1>/);
});

test("what was assumed is said, and a flat classed F or G is sent to the energy check", () =>
{
    expect(page({ quarter: null })).toContain("du dernier indice publié à la signature, faute de trimestre indiqué au bail");
    expect(page({}, true)).toContain("Si le bail ne contient pas de clause de révision, aucune hausse n");
    expect(page()).toMatch(/<a[^>]*href="\.\.\/dpe\/"[^>]*>/);
});

test("a date the index table does not reach gives no figure", () =>
{
    expect(page({ revisedOn: "2025-08-01", askedOn: "2025-08-01" })).toMatch(/<h1[^>]*>Indice non disponible<\/h1>/);
});
