import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { RevisionFormStep } from "../components/RevisionFormStep";
import { revisionStart, type RevisionErrors, type RevisionFields } from "../lib/revision-flow";

function page(fields: Partial<RevisionFields> = {}, errors: RevisionErrors = {}): string
{
    return renderToStaticMarkup(<RevisionFormStep fields={{ ...revisionStart.fields, ...fields }} errors={errors} />);
}

test("every typed answer has its labelled field, and the clause and the quarter are named groups", () =>
{
    for (const id of ["address", "signedOn", "revisedOn", "rent", "asked", "askedOn"])
    {
        expect(page(), id).toMatch(new RegExp(`<label for="${id}"`));
    }

    expect(page().match(/name="clause"/g)).toHaveLength(3);
    expect(page().match(/name="quarter"/g)).toHaveLength(5);
    expect(page()).toMatch(/name="quarter" value="none"/);
    expect(page().match(/<legend/g)).toHaveLength(2);
});

test("the three dates take a date and the two rents a number pad", () =>
{
    for (const id of ["signedOn", "revisedOn", "askedOn"])
    {
        expect(page().match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0], id).toContain('type="date"');
    }

    for (const id of ["rent", "asked"])
    {
        expect(page().match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0], id).toContain('inputMode="decimal"');
    }
});

test("the screen says which index it uses and that the revision date defaults to the lease's anniversary", () =>
{
    expect(page()).toContain("France hexagonale");
    expect(page()).toContain("la date anniversaire du bail");
});

test("an error sits under its own field and is tied to it", () =>
{
    expect(page({}, { askedOn: "Indiquez la date." })).toMatch(/<input[^>]*id="askedOn"[^>]*aria-describedby="[^"]*askedOn-error"/);
    expect(page({}, { quarter: "Indiquez le trimestre." })).toMatch(/<fieldset[^>]*aria-describedby="quarter-error"/);
});

test("the screen says nothing leaves the phone, sends nothing anywhere and leads back to all the checks", () =>
{
    expect(page()).toContain("Rien ne quitte votre appareil");
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
});
