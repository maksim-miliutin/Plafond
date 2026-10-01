import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { LeaseStep } from "../components/LeaseStep";
import type { LeaseFields } from "../lib/lease";

const blank: LeaseFields = {
    rooms: "",
    period: "",
    furnished: "",
    surface: "",
    rent: "",
    complement: "",
    signedOn: "",
    startsOn: "",
    stated: "",
};

function page(fields: Partial<LeaseFields> = {}, errors: Partial<Record<keyof LeaseFields, string>> = {}): string
{
    return renderToStaticMarkup(<LeaseStep fields={{ ...blank, ...fields }} errors={errors} />);
}

test("every typed field has a label a screen reader can name", () =>
{
    for (const id of ["surface", "rent", "complement", "signedOn", "startsOn"])
    {
        expect(page()).toMatch(new RegExp(`<label for="${id}"`));
        expect(page()).toMatch(new RegExp(`<input[^>]*id="${id}"`));
    }
});

test("the choices offered are the ones the published table distinguishes", () =>
{
    expect(page().match(/name="rooms"/g)).toHaveLength(4);
    expect(page().match(/name="period"/g)).toHaveLength(4);
    expect(page().match(/name="furnished"/g)).toHaveLength(2);
    expect(page().match(/name="stated"/g)).toHaveLength(2);
    expect(page()).toContain("loyer de référence majoré");
    expect(page()).toContain("4 pièces et plus");
    expect(page()).toContain("entre 1946 et 1970");
});

test("the rent asked for is the base rent without charges", () =>
{
    expect(page()).toContain("hors charges");
});

test("an error sits under its own field and is tied to it", () =>
{
    const wrong = page({ rent: "1.500" }, { rent: "Écrivez le loyer sans point, par exemple 1 500." });

    expect(wrong).toMatch(/<input[^>]*id="rent"[^>]*aria-invalid="true"[^>]*aria-describedby="[^"]*rent-error"/);
    expect(wrong).toMatch(/id="rent-error"[^>]*>Écrivez le loyer sans point, par exemple 1 500\.</);
    expect(wrong).not.toMatch(/id="surface"[^>]*aria-invalid="true"/);
});

test("what was typed stays in place when the form comes back", () =>
{
    const back = page({ rent: "1 500", rooms: "3", furnished: "yes" });

    const inputs = back.match(/<input[^>]*>/g) ?? [];
    const checked = inputs.filter((input) => input.includes('checked=""'));

    expect(inputs.find((input) => input.includes('id="rent"'))).toContain('value="1 500"');
    expect(checked).toHaveLength(2);
    expect(checked.some((input) => input.includes('name="rooms"') && input.includes('value="3"'))).toBe(true);
    expect(checked.some((input) => input.includes('name="furnished"') && input.includes('value="yes"'))).toBe(true);
});

// A form sends its named fields to our own server when submitted before the script takes over,
// and the rent would land in the server log. A form with method dialog outside a dialog sends nothing.
test("the lease form sends nothing anywhere, even before the page wakes up", () =>
{
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
});

test("a lease signed on a day no rate covers is told so, above the button, and only then", () =>
{
    const refused = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} noRate />);
    const notice = refused.match(/<p[^>]*role="alert"[^>]*>([^<]*)<\/p>/)?.[1] ?? "";

    expect(notice).toContain("Aucun loyer de référence");
    expect(refused.indexOf("Aucun loyer de référence")).toBeLessThan(refused.indexOf("Vérifier mon loyer"));
    expect(page()).not.toContain("Aucun loyer de référence");
});
