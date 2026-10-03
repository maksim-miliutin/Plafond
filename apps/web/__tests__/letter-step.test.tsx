import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { check, letter, type Check, type Claim, type Contest, type Letter } from "@plafond/domain";

import { LetterStep } from "../components/LetterStep";
import { claim as lease, rate } from "./fixtures";

const claim: Claim = { ...lease, complement: 20000, on: "2025-09-25" };

const address = "4 Place du Louvre 75001 Paris";

function page(contest: Contest | null = null): string
{
    const rates = [{ ...rate, decree: { ...rate.decree, contest } }];
    const sent = letter({ check: check(claim, rates) as Check, claim, address, quartier: "Saint-Germain-l'Auxerrois", stated: false });

    return renderToStaticMarkup(<LetterStep letter={sent as Letter} />);
}

test("the letter leaves brackets where only the tenant can fill in", () =>
{
    for (const blank of ["[Votre prénom et nom]", "[Nom du propriétaire]", "[Adresse du propriétaire]", "[Signature]"])
    {
        expect(page()).toContain(blank);
    }
});

test("the letter is headed by the tenant's address and dated from paris", () =>
{
    const document = page().slice(page().indexOf("<article"));

    expect(document.indexOf(address)).toBeLessThan(document.indexOf("Madame, Monsieur"));
    expect(document).toContain("Paris, le 25 septembre 2025");
});

test("each demand is numbered, in the order the letter gives them", () =>
{
    const list = page().match(/<ol[^>]*>(.*)<\/ol>/s)?.[1] ?? "";
    const order = ["article 140, III, A", "article 140, V", "article 140, III, B"].map((ground) => list.indexOf(ground));

    expect(list.match(/<li/g)).toHaveLength(3);
    expect(order.every((at) => at >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("a decree contested in court is flagged before the letter and kept out of it", () =>
{
    const contest: Contest = {
        outcome: "pending",
        court: "Conseil d'État",
        decidedOn: "2024-11-18",
        claimsBy: null,
        source: "https://example.org/judgment",
    };
    const flagged = page(contest);
    const document = flagged.slice(flagged.indexOf("<article"));

    expect(flagged).toContain("Conseil d&#x27;État, 18 novembre 2024");
    expect(document).not.toContain("Conseil d&#x27;État");
    expect(page()).not.toContain("Conseil d&#x27;État");
});

test("the screen says it is not legal advice and where free advice is", () =>
{
    expect(page()).toContain("pas un conseil juridique");
    expect(page()).toContain("ADIL");
});

test("the letter can be printed or copied from the screen", () =>
{
    expect(page()).toContain("Imprimer ou enregistrer en PDF");
    expect(page()).toContain("Copier le texte");
});

test("the letter on screen states how it is sent above its subject", () =>
{
    const document = page().slice(page().indexOf("<article"));

    expect(document.indexOf("Lettre recommandée avec accusé de réception")).toBeLessThan(document.indexOf("Objet"));
});
