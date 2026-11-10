import { expect, test } from "vitest";

import { letterText } from "../src/letter.js";
import { notice, type Leaving } from "../src/notice.js";
import { noticeLetter } from "../src/notice-letter.js";

const leaving: Leaving = {
    furnished: false,
    reasons: [],
    receivedOn: "2027-03-15",
    rent: 120000,
};
const address = "12 Rue des Lilas 69003 Lyon";

function said(change: Partial<Leaving> = {}): string
{
    const left = { ...leaving, ...change };

    return letterText(noticeLetter({ check: notice(left), address, on: "2027-03-10" }));
}

test("the letter gives notice of the flat, dated from its town on the day it is written", () =>
{
    const sent = noticeLetter({ check: notice(leaving), address, on: "2027-03-10" });

    expect(sent.subject).toBe("Objet : congé du logement");
    expect(sent.dated).toBe("Lyon, le 10 mars 2027");
    expect(sent.sender).toEqual(["[Votre prénom et nom]", address]);
    expect(said()).toContain("Je suis locataire du logement situé au 12 Rue des Lilas, 69003 Lyon. Par la présente, je vous donne congé de ce logement.");
});

test("an empty flat with no reason names the three months and the day they end", () =>
{
    expect(said()).toContain("Le préavis est de trois mois (article 15 de la loi n° 89-462 du 6 juillet 1989).");
    expect(said()).toContain("Il court à compter de la réception de cette lettre : je quitterai donc le logement au plus tard le 15 juin 2027.");
});

// Same article: a tenant who wants the shorter notice states the reason and proves it when sending the letter, or the
// notice stays three months.
test("a shorter notice states its reason and joins its proof", () =>
{
    const text = said({ reasons: ["health"] });

    expect(text).toContain("Je bénéficie d'un préavis réduit à un mois (article 15 de la loi n° 89-462 du 6 juillet 1989) pour le motif "
        + "suivant : mon état de santé, qui justifie un changement de domicile. Vous trouverez ci-joint le certificat médical.");
    expect(text).toContain("au plus tard le 15 avril 2027");
});

test("the tense zone shortens the notice with nothing to join", () =>
{
    const text = said({ reasons: ["tense"] });

    expect(text).toContain("pour le motif suivant : le logement est situé en zone tendue.");
    expect(text).not.toContain("ci-joint");
});

test("a furnished flat's month comes from its own article", () =>
{
    expect(said({ furnished: true })).toContain("Le logement étant loué meublé, le préavis est d'un mois (article 25-8 de la loi n° 89-462 du 6 juillet 1989).");
});

test("the letter asks to set the exit inspection and leaves a place for the new address, so the deposit can come back", () =>
{
    expect(said()).toContain("Je vous propose de convenir ensemble de la date de l'état des lieux de sortie et de la remise des clés.");
    expect(said()).toContain("Ma nouvelle adresse, à laquelle vous pourrez me restituer le dépôt de garantie : [Nouvelle adresse].");
});

test("a notice is not a dispute: it neither asks for an answer nor mentions the conciliation board", () =>
{
    expect(said()).not.toContain("répondre");
    expect(said()).not.toContain("conciliation");
});
