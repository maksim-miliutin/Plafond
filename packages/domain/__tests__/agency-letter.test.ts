import { expect, test } from "vitest";

import { agencyFees, type AgencyFees, type FeeCaps } from "../src/agency.js";
import { agencyLetter } from "../src/agency-letter.js";
import { letterText, type Letter } from "../src/letter.js";

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
const address = "4 Place du Louvre 75001 Paris";

function written(change: Partial<AgencyFees> = {}): ReturnType<typeof agencyLetter>
{
    const fees = { ...paid, ...change };

    return agencyLetter({ paid: fees, check: agencyFees(fees, caps), address, on: "2026-10-11" });
}

const said = (change: Partial<AgencyFees> = {}) => letterText(written(change) as Letter);

test("the letter goes to the agency, not the landlord, and names the flat and the lease", () =>
{
    const sent = written() as Letter;

    expect(sent.recipient).toEqual(["[Nom de l'agence]", "[Adresse de l'agence]"]);
    expect(sent.subject).toBe("Objet : remboursement d'honoraires de location");
    expect(said()).toContain("Par un bail signé le 1er mars 2026, votre agence m'a loué, pour le compte du propriétaire, le logement situé au "
        + "4 Place du Louvre, 75001 Paris, d'une surface habitable de 42,5 m².");
});

// Hand-counted: 12,10 € × 42,50 m² = 514,25 €, 3,03 € × 42,50 m² = 128,78 €; 800 € and 150 € charged leave 285,75 € and 21,22 €.
test("each part charged above its cap is set against the cap, and the sum over is claimed", () =>
{
    expect(said()).toContain("Pour la visite, la constitution de mon dossier et la rédaction du bail, vous m'avez facturé 800,00 €. "
        + "Pour un logement situé en zone très tendue, ces honoraires ne peuvent pas dépasser 12,10 € par m² de surface habitable, soit "
        + "514,25 € pour ce logement.");
    expect(said()).toContain("Pour l'état des lieux d'entrée, vous m'avez facturé 150,00 €, alors que ces honoraires ne peuvent pas "
        + "dépasser 3,03 € par m², soit 128,78 €.");
    expect(said()).toContain("je vous mets en demeure de me rembourser la somme de 306,97 €");
    expect(said()).toContain("(Arrêté du 17 juillet 2025)");
});

test("a part within its cap is left out of the letter", () =>
{
    expect(said({ inspection: 10000 })).not.toContain("état des lieux d'entrée, vous m'avez facturé");
    expect(said({ inspection: 10000 })).toContain("la somme de 285,75 €");
});

test("a zone the tenant did not know is argued from the highest cap", () =>
{
    expect(said({ zone: null })).toContain("Même en zone très tendue, où le plafond est le plus élevé, ces honoraires ne peuvent pas dépasser");
});

test("the agency is asked to pay back within a month, with the consumer authority named, not the conciliation board", () =>
{
    expect(said()).toContain("La part des honoraires facturée au locataire ne peut pas non plus dépasser celle facturée au propriétaire.");
    expect(said()).toContain("signaler ce manquement à la DGCCRF");
    expect(said()).not.toContain("conciliation");
});

test("fees within the caps, or a lease without caps, leave nothing to claim", () =>
{
    expect(written({ letting: 50000, inspection: 10000 })).toEqual({ kind: "nothing-to-claim" });
    expect(written({ signedOn: "2025-12-31" })).toEqual({ kind: "nothing-to-claim" });
});
