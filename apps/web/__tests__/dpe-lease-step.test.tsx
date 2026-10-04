import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DpeLeaseStep } from "../components/DpeLeaseStep";
import type { DpeFields } from "../lib/dpe-flow";

const blank: DpeFields = { signedOn: "", furnished: "", landlord: "", raised: "", raisedOn: "" };

function page(fields: Partial<DpeFields> = {}, errors: Partial<Record<keyof DpeFields, string>> = {}): string
{
    return renderToStaticMarkup(<DpeLeaseStep fields={{ ...blank, ...fields }} errors={errors} />);
}

test("the two dates are labelled fields, and the choices are named groups of two", () =>
{
    for (const id of ["signedOn", "raisedOn"])
    {
        expect(page()).toMatch(new RegExp(`<label for="${id}"`));
        expect(page()).toMatch(new RegExp(`<input[^>]*id="${id}"[^>]*type="date"`));
    }

    expect(page().match(/name="furnished"/g)).toHaveLength(2);
    expect(page().match(/name="raised"/g)).toHaveLength(2);
    expect(page().match(/name="landlord"/g)).toHaveLength(2);
    expect(page().match(/<legend/g)).toHaveLength(3);
});

test("a filled date is spelled out under its field", () =>
{
    expect(page({ signedOn: "2023-03-01" })).toContain("Soit le 1er mars 2023.");
});

test("an error sits under its own field and is tied to it", () =>
{
    const wrong = page({}, { raisedOn: "Indiquez la date de l'augmentation." });

    expect(wrong).toMatch(/<input[^>]*id="raisedOn"[^>]*aria-describedby="[^"]*raisedOn-error"/);
    expect(wrong).toMatch(/id="raisedOn-error"[^>]*>Indiquez la date de l&#x27;augmentation\.</);
});

test("the form asks who lets the flat, since a company's lease runs twice as long", () =>
{
    expect(page()).toMatch(/<legend[^>]*>Qui vous loue le logement/);
    expect(page()).toContain("une société");
});

test("the form sends nothing anywhere, even before the page wakes up", () =>
{
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
});
