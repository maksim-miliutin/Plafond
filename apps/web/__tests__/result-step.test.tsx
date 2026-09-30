import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { check, type Check, type Claim, type Contest, type Rate } from "@plafond/domain";

import { ResultStep } from "../components/ResultStep";

const thin = "\u202F";
const hard = "\u00A0";

// The 2025 rate for St-Germain-l'Auxerrois, three rooms, 1946-1970, furnished, from the published table.
const rate: Rate = {
    flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
    reference: 2670,
    majored: 3200,
    minored: 1870,
    decree: {
        title: "Arrêté préfectoral n° 2025-06-16-00003",
        url: "https://example.org/decree",
        from: "2025-07-01",
        until: "2026-07-01",
        contest: null,
    },
};

const claim: Claim = {
    flat: rate.flat,
    surface: 4000,
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    rent: 150000,
    complement: 0,
    on: "2026-09-29",
};

function page(change: Partial<Claim> = {}, rates: Rate[] = [rate], writable = true): string
{
    const lease = { ...claim, ...change };
    const result = check(lease, rates) as Check;

    return renderToStaticMarkup(<ResultStep check={result} claim={lease} quartier="Saint-Germain-l'Auxerrois" writable={writable} />);
}

test("the overpayment each month is the headline", () =>
{
    expect(page()).toMatch(new RegExp(`<h1[^>]*>.*220,00${hard}€.*de trop chaque mois.*</h1>`, "s"));
});

test("the rent and the cap stand side by side, each under its own name", () =>
{
    expect(page()).toMatch(new RegExp(`Votre loyer de base</dt><dd[^>]*>1${thin}500,00${hard}€</dd>`));
    expect(page()).toMatch(new RegExp(`Plafond légal</dt><dd[^>]*>1${thin}280,00${hard}€</dd>`));
});

test("the claim back says how far it reaches and why it stops there", () =>
{
    expect(page()).toContain(`2${thin}640,00${hard}€`);
    expect(page()).toContain("12 mois complets depuis le 1er septembre 2025");
    expect(page()).toContain("trois dernières années");
});

test("every figure shows where it came from", () =>
{
    const sources = page();

    expect(sources).toContain("Saint-Germain-l&#x27;Auxerrois");
    expect(sources).toContain("3 pièces, construit entre 1946 et 1970, loué meublé");
    expect(sources).toContain("Arrêté préfectoral n° 2025-06-16-00003");
    expect(sources).toContain("du 1er juillet 2025 au 30 juin 2026");
    expect(sources).toContain(`32,00${hard}€ × 40${hard}m² = 1${thin}280,00${hard}€`);
});

test("a rent within the cap is told plainly and, with nothing to claim, asks for no letter", () =>
{
    const within = page({ rent: 120000 }, [rate], false);

    expect(within).toContain("respecte le plafond");
    expect(within).not.toContain("de trop");
    expect(within).not.toContain("Trop-perçu");
    expect(within).not.toContain("Préparer la lettre");
});

test("a complement is set out with its deadline and never judged", () =>
{
    const late = page({ complement: 20000 });
    const early = page({ complement: 20000, on: "2025-10-15" });

    expect(late).toContain(`200,00${hard}€`);
    expect(late).toContain(`15,63${hard}%`);
    expect(late).toContain("expiré le 1er décembre 2025");
    expect(early).toContain("avant le 1er décembre 2025");
    for (const word of ["illégal", "illicite", "abusif"])
    {
        expect(late + early).not.toContain(word);
    }
});

test("a decree struck down in court is flagged beside the figures", () =>
{
    const contest: Contest = {
        outcome: "annulled",
        court: "Tribunal administratif de Paris",
        decidedOn: "2025-10-24",
        claimsBy: "2025-10-24",
        source: "https://example.org/judgment",
    };
    const judged = page({}, [{ ...rate, decree: { ...rate.decree, contest } }]);

    expect(judged).toContain("Tribunal administratif de Paris, 24 octobre 2025");
    expect(judged).toContain("au plus tard le 24 octobre 2025");
});

test("a letter is offered whenever there is something to claim, even within the cap", () =>
{
    expect(page({ rent: 120000 }, [rate], true)).toContain("Préparer la lettre");
    expect(page({}, [rate], false)).not.toContain("Préparer la lettre");
});
