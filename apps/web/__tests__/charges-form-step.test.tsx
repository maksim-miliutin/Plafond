import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { chargeKinds } from "@plafond/domain";

import { ChargesFormStep } from "../components/ChargesFormStep";
import { chargesStart } from "../lib/charges-flow";

const blank = chargesStart.at === "form" ? chargesStart.fields : {};

function page(errors: Record<string, string> = {}): string
{
    return renderToStaticMarkup(<ChargesFormStep fields={blank} errors={errors} />);
}

test("each kind of charge in the table has its own labelled amount, named as in the table", () =>
{
    for (const kind of chargeKinds)
    {
        expect(page(), kind.id).toMatch(new RegExp(`<label for="amount-${kind.id}"[^>]*>`));
    }

    expect(page().match(/<input[^>]*id="amount-/g)).toHaveLength(chargeKinds.length);
    expect(page()).toContain("Taxe foncière");
});

test("the caretaker's tasks are one named group of three choices", () =>
{
    expect(page().match(/name="caretaker"/g)).toHaveLength(3);
    expect(page()).toMatch(/<legend[^>]*>Que fait le gardien/);
});

test("a form with no line says so above the button", () =>
{
    const refused = page({ lines: "Reportez au moins un poste de votre décompte." });

    expect(refused.indexOf("Reportez au moins un poste")).toBeLessThan(refused.indexOf("Vérifier ma régularisation"));
    expect(refused).toMatch(/role="alert"[^>]*>Reportez au moins un poste/);
});

test("the screen says nothing leaves the phone, sends nothing anywhere and leads back to all the checks", () =>
{
    expect(page()).toContain("Rien ne quitte votre appareil");
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
});

const rare = ["outdoors", "hygiene", "equipment", "works", "replacement", "legal-fees"];

test("the six rarer lines fold away under one summary, so the form opens on the ten most statements carry", () =>
{
    const folded = page().match(/<details[^>]*>.*<\/details>/s)?.[0] ?? "";

    expect(folded).toMatch(/<summary[^>]*>Autres postes/);
    for (const id of rare)
    {
        expect(folded, id).toContain(`id="amount-${id}"`);
    }

    expect(folded).not.toContain('id="amount-water"');
    expect(folded).not.toContain('id="amount-property-tax"');
    expect(page()).not.toMatch(/<details[^>]*open/);
});

test("the fold opens by itself when one of its lines is filled or wrong, so nothing typed is hidden", () =>
{
    const filled = renderToStaticMarkup(<ChargesFormStep fields={{ ...blank, "amount-works": "500" }} errors={{}} />);
    const wrong = page({ "amount-hygiene": "Indiquez un montant en euros." });

    expect(filled).toMatch(/<details[^>]*open/);
    expect(wrong).toMatch(/<details[^>]*open/);
});

test("each line is one row, its name beside a short amount, the euro sign shown but not read out", () =>
{
    expect(page().match(/class="amount-row"/g)).toHaveLength(chargeKinds.length);
    expect(page().match(/<span aria-hidden="true">€<\/span>/g)).toHaveLength(chargeKinds.length);
    expect(page()).toMatch(/<div class="question"><fieldset/);
});
