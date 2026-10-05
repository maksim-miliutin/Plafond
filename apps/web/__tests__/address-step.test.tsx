import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { AddressStep, problems } from "../components/AddressStep";

const page = renderToStaticMarkup(<AddressStep />);

test("the address field is labelled so a screen reader can name it", () =>
{
    expect(page).toMatch(/<label for="address"[^>]*>Adresse du logement<\/label>/);
    expect(page).toMatch(/<input[^>]*id="address"/);
    expect(page).toMatch(/<input[^>]*autoComplete="street-address"|<input[^>]*autocomplete="street-address"/);
});

test("the screen says where the address goes and that it is never kept", () =>
{
    expect(page).toContain("Le calcul se fait sur votre appareil");
    expect(page).toContain("jamais enregistrée");
    expect(page).toContain("Trouver le quartier");
});

test("the screen never passes for legal advice", () =>
{
    expect(page).toContain("pas un conseil juridique");
});

test("the screen is in french and asks one plain question", () =>
{
    expect(page).toContain("<h1");
    expect(page).toContain("Votre loyer dépasse-t-il le plafond légal ?");
});

// A form sends its named fields to our own server when it is submitted before the script takes over,
// and the address would land in the server log. A field without a name is never sent.
test("the address field has no name, so a form sent too early carries nothing", () =>
{
    const field = page.match(/<input[^>]*id="address"[^>]*>/)?.[0] ?? "";

    expect(field).not.toBe("");
    expect(field).not.toContain("name=");
});

test("every problem the search can meet is explained under the field and tied to it", () =>
{
    for (const [problem, explained] of Object.entries(problems))
    {
        const refused = renderToStaticMarkup(<AddressStep typed="4 place du louvre" problem={problem as keyof typeof problems} />);
        const field = refused.match(/<input[^>]*id="address"[^>]*>/)?.[0] ?? "";

        expect(refused, problem).toContain(explained.replaceAll("'", "&#x27;"));
        expect(field, problem).toContain('aria-invalid="true"');
        expect(field, problem).toContain('aria-describedby="address-error"');
        expect(refused, problem).toMatch(/id="address-error"/);
    }
});

test("what was typed stays in the field when the search sends it back", () =>
{
    const back = renderToStaticMarkup(<AddressStep typed="4 place du louvre" problem="not-found" />);

    expect(back.match(/<input[^>]*id="address"[^>]*>/)?.[0]).toContain('value="4 place du louvre"');
});

test("a first visit shows no error", () =>
{
    expect(page).not.toContain("address-error");
    expect(page).not.toContain("aria-invalid");
});

test("the address form sends nothing anywhere either", () =>
{
    expect(page).toMatch(/<form[^>]*method="dialog"/);
});

test("while the search runs the button says so and cannot be pressed twice", () =>
{
    const button = renderToStaticMarkup(<AddressStep busy />).match(/<button[^>]*>[^<]*<\/button>/)?.[0] ?? "";

    expect(button).toContain('disabled=""');
    expect(button).toContain("Recherche du quartier");
});

// An app on the home screen has no back button of its own; the first screen of each check needs its own way back.
test("the first screen of the rent check leads back to all the checks", () =>
{
    expect(page).toMatch(/<a[^>]*class="back"[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>|<a[^>]*href="\.\.\/"[^>]*class="back"[^>]*>Toutes les vérifications<\/a>/);
});

test("the screen says which of the four steps it is", () =>
{
    expect(page).toContain("Étape 1 sur 4\u00A0: votre adresse");
    expect(page.match(/class="segment done"/g)).toHaveLength(1);
});
