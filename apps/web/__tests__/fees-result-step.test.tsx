import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { agencyFees, type AgencyFees, type FeeCaps } from "@plafond/domain";

import { FeesResultStep } from "../components/FeesResultStep";

const caps: FeeCaps[] = [
    {
        from: "2026-01-01",
        until: "2027-01-01",
        letting: { "very-tense": 1210, tense: 1009, other: 807 },
        inspection: 303,
        title: "Arrêté du 17 juillet 2025",
        url: "https://example.org/caps",
    },
];
const paid: AgencyFees = { zone: "very-tense", surface: 4250, letting: 80000, inspection: 15000, signedOn: "2026-03-01" };

function page(change: Partial<AgencyFees> = {}, writable = true): string
{
    const fees = { ...paid, ...change };

    return renderToStaticMarkup(<FeesResultStep paid={fees} check={agencyFees(fees, caps)} writable={writable} onHelp={() => undefined} />);
}

test("fees over the caps lead with the sum over, then each cap against what was charged", () =>
{
    expect(page()).toMatch(/<h1[^>]*>.*306,97 €.*au-delà du plafond<\/h1>/);
    expect(page()).toContain("514,25 €");
    expect(page()).toContain("128,78 €");
    expect(page()).toContain("950,00 €");
    expect(page()).toContain("12,10 € par m² en zone très tendue et 3,03 € par m² pour l&#x27;état des lieux, pour 42,5 m²");
    expect(page()).toMatch(/<a[^>]*href="https:\/\/example.org\/caps"[^>]*>Arrêté du 17 juillet 2025<\/a>/);
    expect(page()).toMatch(/<button[^>]*>Préparer la lettre à l&#x27;agence<\/button>/);
});

test("fees within the caps say so, with no letter to prepare", () =>
{
    const within = page({ letting: 50000, inspection: 10000 }, false);

    expect(within).toMatch(/<h1[^>]*>Les honoraires respectent le plafond<\/h1>/);
    expect(within).not.toContain("Préparer la lettre");
});

test("a zone the tenant did not know is checked against the highest cap, and the screen says what that means", () =>
{
    expect(page({ zone: null })).toContain("Plafond retient le plafond le plus haut, celui de la zone très tendue");
    expect(page()).not.toContain("le plafond le plus haut");
});

test("a lease outside the caps known says which way it falls", () =>
{
    expect(page({ signedOn: "2025-12-31" }, false)).toContain("Pas de plafond connu pour ce bail");
    expect(page({ signedOn: "2025-12-31" }, false)).toContain("baux signés à partir du 1er janvier 2026");
    expect(page({ signedOn: "2027-01-02" }, false)).toContain("Plafond connaît les plafonds jusqu&#x27;au 31 décembre 2026");
});

test("the tenant learns that the landlord must pay at least as much", () =>
{
    expect(page()).toContain("La part du locataire ne peut pas non plus dépasser celle du propriétaire.");
});
