import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { notice, type Leaving } from "@plafond/domain";

import { NoticeResultStep } from "../components/NoticeResultStep";

const leaving: Leaving = { furnished: false, reasons: [], receivedOn: "2027-03-15", rent: 120000 };

function page(change: Partial<Leaving> = {}, unsure = false): string
{
    const left = { ...leaving, ...change };
    const ifTense = unsure ? notice({ ...left, reasons: ["tense"] }) : null;

    return renderToStaticMarkup(<NoticeResultStep check={notice(left)} receivedOn={left.receivedOn} ifTense={ifTense} onWrite={() => undefined} />);
}

test("the headline gives the length, and the lead the day it ends counted from the landlord's receipt", () =>
{
    expect(page()).toMatch(/<h1[^>]*>.*Trois mois.*de préavis<\/h1>/);
    expect(page()).toContain("Votre préavis prend fin le 15 juin 2027 à minuit, si le propriétaire reçoit votre lettre le 15 mars 2027.");
    expect(page({ reasons: ["tense"] })).toMatch(/<h1[^>]*>.*Un mois.*de préavis<\/h1>/);
});

test("the last month's rent is shown with its days", () =>
{
    expect(page()).toContain("600,00 €");
    expect(page()).toContain("Du 1er juin 2027 au 15 juin 2027, soit 15 jours sur 30.");
});

test("a reason with a proof says what to join, and that without it the notice stays three months", () =>
{
    const text = page({ reasons: ["health"] });

    expect(text).toContain("Joignez à votre lettre le certificat médical\u00A0:");
    expect(text).toContain("le préavis reste de trois mois");
});

test("a reason that holds only under a condition says so next to its proof", () =>
{
    expect(page({ reasons: ["transfer"] })).toContain("La mutation doit être proche de l&#x27;envoi du congé");
    expect(page({ reasons: ["tense"] })).not.toContain("doit être proche");
});

test("the tense zone and a furnished flat need nothing joined", () =>
{
    expect(page({ reasons: ["tense"] })).toContain("zone tendue");
    expect(page({ reasons: ["tense"] })).not.toContain("Joignez");
    expect(page({ furnished: true })).toContain("Un logement meublé se quitte avec un mois de préavis.");
    expect(page({ furnished: true })).not.toContain("Joignez");
});

test("a tenant unsure of the zone sees when one month would end", () =>
{
    expect(page({}, true)).toContain("Si le logement est en zone tendue, le préavis n&#x27;est que d&#x27;un mois et prendrait fin le 15 avril 2027.");
    expect(page()).not.toContain("prendrait fin");
});

test("the rent stays due until the end, and the deposit check is the next step", () =>
{
    expect(page()).toContain("Le loyer et les charges restent dus jusqu&#x27;à la fin du préavis");
    expect(page()).toMatch(/<a[^>]*href="\.\.\/depot\/"[^>]*>Vérifier mon dépôt de garantie<\/a>/);
    expect(page()).toMatch(/<button[^>]*>Préparer la lettre de congé<\/button>/);
});
