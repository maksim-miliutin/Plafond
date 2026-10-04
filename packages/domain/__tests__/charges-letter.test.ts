import { expect, test } from "vitest";

import { charges, type Regularisation } from "../src/charges.js";
import { chargesLetter } from "../src/charges-letter.js";
import type { Letter } from "../src/letter.js";

const regularised: Regularisation = {
    year: 2024,
    lines: [
        { kind: "water", billed: 30000 },
        { kind: "insurance", billed: 15000 },
        { kind: "manager-fees", billed: 20000 },
        { kind: "caretaker", billed: 40000, caretaker: "one" },
        { kind: "waste-tax", billed: 18000 },
    ],
    provisions: 90000,
    receivedOn: "2026-02-10",
};
const address = "12 Rue des Lilas 69003 Lyon";
const euros = (whole: string) => `${whole}\u00A0€`;

function written(change: Partial<Regularisation> = {}, on = "2026-03-01"): ReturnType<typeof chargesLetter>
{
    const statement = { ...regularised, ...change };

    return chargesLetter({ regularised: statement, check: charges(statement), address, on });
}

const said = (letter: Letter, ground: string) => letter.demands.find((demand) => demand.ground === ground)?.paragraphs.join(" ") ?? "";

test("each line charged beyond what the decree allows is named with the amount to take off, and the overpaid advances claimed", () =>
{
    const sent = written() as Letter;

    expect(sent.demands.map((demand) => demand.ground)).toEqual(["charges", "proofs"]);
    expect(said(sent, "charges")).toContain(`Assurance de l'immeuble\u00A0: ${euros("150,00")}`);
    expect(said(sent, "charges")).toContain(`Honoraires du syndic, frais de gestion\u00A0: ${euros("200,00")}`);
    expect(said(sent, "charges")).toContain(`Gardien ou employé d'immeuble\u00A0: ${euros("240,00")}`);
    expect(said(sent, "charges")).not.toContain("Eau froide");
    expect(said(sent, "charges")).toContain(`je vous mets en demeure de retirer ces sommes de la régularisation et de me rembourser ${euros("260,00")}`);
});

test("the tenant asks to see the proofs until the day the law keeps them open", () =>
{
    expect(said(written() as Letter, "proofs")).toContain("jusqu'au 10 août 2026");
});

test("a balance owed on a late regularisation is announced in twelve monthly parts", () =>
{
    const sent = written({ provisions: 20000 }) as Letter;

    expect(sent.demands.map((demand) => demand.ground)).toEqual(["charges", "twelfths", "proofs"]);
    expect(said(sent, "twelfths")).toContain(`le solde de ${euros("440,00")} en douze mensualités`);
});

test("a regularisation that charges only what the decree allows, received in time, asks for nothing", () =>
{
    expect(written({ lines: [{ kind: "water", billed: 30000 }], receivedOn: "2025-06-01" })).toEqual({ kind: "nothing-to-claim" });
});

test("the letter is dated from the town of the flat and names the year it contests", () =>
{
    const sent = written() as Letter;

    expect(sent.dated).toBe("Lyon, le 1er mars 2026");
    expect(sent.subject).toContain("régularisation des charges de 2024");
});

// The bug this guards: written after the six months had run out, the letter asked the landlord to keep the proofs open
// until a day already past.
test("once the six months are over the letter asks for copies of the proofs instead of a past deadline", () =>
{
    const late = said(written({}, "2026-10-04") as Letter, "proofs");

    expect(late).toContain("de me communiquer les pièces justificatives");
    expect(late).not.toContain("jusqu'au");
});
