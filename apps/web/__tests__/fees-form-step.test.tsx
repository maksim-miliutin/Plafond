import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { FeesFormStep } from "../components/FeesFormStep";
import { feesStart, type FeesErrors, type FeesFields } from "../lib/fees-flow";

function page(fields: Partial<FeesFields> = {}, errors: FeesErrors = {}): string
{
    return renderToStaticMarkup(<FeesFormStep fields={{ ...feesStart.fields, ...fields }} errors={errors} />);
}

test("every typed answer has its labelled field, and the zone is a named group of four", () =>
{
    for (const id of ["address", "surface", "signedOn", "letting", "inspection"])
    {
        expect(page(), id).toMatch(new RegExp(`<label for="${id}"`));
    }

    expect(page().match(/name="zone"/g)).toHaveLength(4);
    expect(page()).toMatch(/name="zone" value="unknown"/);
    expect(page().match(/<legend/g)).toHaveLength(1);
});

test("the zone question says where the zones lie", () =>
{
    expect(page()).toContain("Paris et une partie de sa proche banlieue sont en zone très tendue.");
    expect(page()).toContain("la plupart des grandes agglomérations sont en zone tendue");
});

test("the sums and the surface take a number pad, the date a date", () =>
{
    for (const id of ["surface", "letting", "inspection"])
    {
        expect(page().match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0], id).toContain('inputMode="decimal"');
    }

    expect(page().match(/<input[^>]*id="signedOn"[^>]*>/)?.[0]).toContain('type="date"');
});

test("an error sits under its own field and is tied to it", () =>
{
    expect(page({}, { letting: "Indiquez les honoraires." })).toMatch(/<input[^>]*id="letting"[^>]*aria-describedby="[^"]*letting-error"/);
    expect(page({}, { zone: "Indiquez la zone." })).toMatch(/<fieldset[^>]*aria-describedby="zone-error"/);
});

test("the screen says nothing leaves the phone, sends nothing anywhere and leads back to all the checks", () =>
{
    expect(page()).toContain("Rien ne quitte votre appareil");
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
});
