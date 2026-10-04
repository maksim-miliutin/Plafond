import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { charges, type Regularisation } from "@plafond/domain";

import { ChargesResultStep } from "../components/ChargesResultStep";

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
const money = (whole: string) => `${whole}\u00A0€`;

function page(change: Partial<Regularisation> = {}, writable = false): string
{
    const statement = { ...regularised, ...change };

    return renderToStaticMarkup(<ChargesResultStep regularised={statement} check={charges(statement)} on="2026-03-01" writable={writable} onHelp={() => undefined} />);
}

test("what was charged wrongly heads the screen, then the totals and what the landlord owes back", () =>
{
    const shown = page({}, true);

    expect(shown).toMatch(new RegExp(`<h1[^>]*>.*${money("590,00")}.*facturés à tort.*</h1>`, "s"));
    expect(shown).toContain(money("1\u202F230,00"));
    expect(shown).toContain("À vous rembourser");
    expect(shown).toContain(money("260,00"));
    expect(shown).toContain("Préparer la lettre au propriétaire");
});

test("each line says whether it may be charged, and in what share for a caretaker", () =>
{
    const shown = page();

    expect(shown).toMatch(/Assurance de l&#x27;immeuble.*non récupérable/s);
    expect(shown).toContain("récupérable à 40\u00A0%");
});

test("a late statement with a balance to pay may be paid in twelve parts, and the proofs stay open until their day", () =>
{
    const late = page({ provisions: 20000 });

    expect(late).toContain("Reste à payer");
    expect(late).toContain("douze mensualités");
    expect(page()).toContain("jusqu&#x27;au 10 août 2026");
});

test("a statement that charges only what may be charged says so and offers no letter", () =>
{
    const fair = page({ lines: [{ kind: "water", billed: 30000 }], receivedOn: "2025-06-01" });

    expect(fair).toContain("Ces charges sont récupérables");
    expect(fair).not.toContain("Préparer la lettre");
});

test("the screen points to the full list and says one statement covers one year", () =>
{
    expect(page()).toMatch(/href="https:\/\/www\.economie\.gouv\.fr\/node\/37790"/);
    expect(page()).toContain("trois ans");
});

test("after the six months the screen says the window has closed, and that the proofs can still be asked for", () =>
{
    const statement = { ...regularised };
    const late = renderToStaticMarkup(<ChargesResultStep regularised={statement} check={charges(statement)} on="2026-10-04" writable={false} />);

    expect(late).toContain("a pris fin le 10 août 2026");
    expect(late).not.toContain("Vous pouvez consulter");
});
