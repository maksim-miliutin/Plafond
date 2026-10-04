import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DepositFormStep } from "../components/DepositFormStep";
import { depositQuestions, type DepositFields } from "../lib/deposit-flow";

const blank = Object.fromEntries(Object.keys(depositQuestions).map((key) => [key, ""])) as unknown as DepositFields;

function page(fields: Partial<DepositFields> = {}, errors: Partial<Record<keyof DepositFields, string>> = {}): string
{
    return renderToStaticMarkup(<DepositFormStep fields={{ ...blank, ...fields }} errors={errors} />);
}

test("every answer has its labelled field, and the three yes or no questions are named groups", () =>
{
    for (const id of ["address", "rent", "paid", "keysOn", "returned", "returnedOn"])
    {
        expect(page(), id).toMatch(new RegExp(`<label for="${id}"`));
    }

    for (const name of ["furnished", "conforming", "addressGiven"])
    {
        expect(page().match(new RegExp(`name="${name}"`, "g")), name).toHaveLength(2);
    }

    expect(page().match(/<legend/g)).toHaveLength(3);
});

test("the address takes words and the sums take a number pad", () =>
{
    expect(page().match(/<input[^>]*id="address"[^>]*>/)?.[0]).not.toContain('inputMode="decimal"');
    expect(page().match(/<input[^>]*id="address"[^>]*>/)?.[0]).toMatch(/type="text"[^>]*autoComplete="street-address"|autoComplete="street-address"[^>]*type="text"/);
    expect(page().match(/<input[^>]*id="rent"[^>]*>/)?.[0]).toContain('inputMode="decimal"');
});

test("an error sits under its own field and is tied to it", () =>
{
    expect(page({}, { keysOn: "Indiquez la date de remise des clés." })).toMatch(/<input[^>]*id="keysOn"[^>]*aria-describedby="[^"]*keysOn-error"/);
});

test("the screen says nothing leaves the phone, sends nothing anywhere and leads back to all the checks", () =>
{
    expect(page()).toContain("Rien ne quitte votre appareil");
    expect(page()).toMatch(/<form[^>]*method="dialog"/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
    expect(page()).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
});
