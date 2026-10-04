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
