import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { check, type Check, type Claim, type Contest, type Rate } from "@plafond/domain";

import { ResultStep } from "../components/ResultStep";
import { claim, rate } from "./fixtures";

const thin = "\u202F";
const hard = "\u00A0";

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

test("the result says when the lease was signed, since that date picks the decree", () =>
{
    const signed = page({ signedOn: "2025-08-20", startsOn: "2025-09-01" });

    expect(signed).toMatch(/<dt>Bail<\/dt><dd>[^<]*signé le 20 août 2025[^<]*pris effet le 1er septembre 2025/);
});

// Loi du 16 août 2022: from 18 August 2022 nine characteristics bar a complement; the screen cannot see the flat, so it
// lists them and points to the DPE check, without judging this complement.
test("a complement in a lease signed since 18 August 2022 comes with the nine characteristics that bar one, and a way to check", () =>
{
    const recent = page({ complement: 20000 });
    const decree2022 = { ...rate, decree: { ...rate.decree, from: "2022-07-01", until: "2023-07-01" } };
    const older = page({ complement: 20000, signedOn: "2022-08-17", startsOn: "2022-08-17" }, [decree2022]);
    const listed = /<ul class="bars">(.*?)<\/ul>/.exec(recent)?.[1] ?? "";

    expect(recent).toContain("Pour un bail signé depuis le 18 août 2022, aucun complément de loyer ne peut être appliqué si le "
        + "logement présente l&#x27;une de ces caractéristiques");
    expect(listed.match(/<li>/g)).toHaveLength(9);
    expect(listed).toContain("<li>un diagnostic de performance énergétique de classe F ou G</li>");
    expect(recent).toMatch(/<a[^>]*href="\.\.\/dpe\/"[^>]*>Vérifier le DPE du logement<\/a>/);
    expect(older).not.toContain("ces caractéristiques");
    expect(older).not.toContain("Vérifier le DPE du logement");
    expect(page()).not.toContain("ces caractéristiques");
});

// The law asks for characteristics that justify the complement against comparable flats of the sector, not exceptional ones.
test("a complement is described in the terms of the law, the proof left to the landlord", () =>
{
    const said = page({ complement: 20000 });

    expect(said).toContain("Il n&#x27;est permis que si le logement présente des caractéristiques de localisation ou de confort qui "
        + "le justifient, par comparaison avec les logements de la même catégorie du même secteur, et c&#x27;est au propriétaire "
        + "de le démontrer.");
    expect(said).not.toContain("exceptionnel");
});

test("a complement on a base rent below the cap comes with the floor the law sets and the gap to it", () =>
{
    expect(page({ rent: 120000, complement: 20000 })).toContain("Un complément ne peut s&#x27;ajouter qu&#x27;à un loyer de base au "
        + `moins égal au plafond. Le loyer de base de votre bail est inférieur de 80,00${hard}€ au plafond.`);
    expect(page({ rent: 128000, complement: 20000 })).not.toContain("au moins égal au plafond");
});

test("a complement leads to what judges have accepted and rejected", () =>
{
    expect(page({ complement: 20000 })).toMatch(/<a[^>]*href="\.\.\/guides\/complement-de-loyer\/#juges"[^>]*>Ce que les juges ont admis ou écarté<\/a>/);
    expect(page()).not.toContain("Ce que les juges");
});

test("the screen says which of the four steps it is", () =>
{
    expect(page()).toContain("Étape 4 sur 4\u00A0: le résultat");
    expect(page().match(/class="segment done"/g)).toHaveLength(4);
});

test("a rent over the cap is explained in one sentence: what it means and what can be asked", () =>
{
    expect(page()).toContain("Vous pouvez demander au propriétaire de le ramener au plafond et de vous rembourser le trop-perçu.");
    expect(page({ rent: 100000 })).not.toContain("Vous pouvez demander au propriétaire");
});

test("a contested decree sends the reader to the ADIL of the flat's own city", async () =>
{
    const { ContestNote } = await import("../components/ContestNote");
    const contest = { outcome: "annulled" as const, court: "tribunal administratif de Lyon", decidedOn: "2025-10-14", claimsBy: null, source: "https://example.org" };

    expect(renderToStaticMarkup(<ContestNote contest={contest} city="lyon" />)).toContain("ADIL du Rhône");
    expect(renderToStaticMarkup(<ContestNote contest={contest} city="paris" />)).toContain("ADIL de Paris");
});
