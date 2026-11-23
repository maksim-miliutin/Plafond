import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { AddressStep, problems } from "../components/AddressStep";
import { guides } from "../lib/guides";

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
test("the first screen of the rent check leads back home", () =>
{
    expect(page).toMatch(/<a[^>]*class="back"[^>]*href="\.\.\/"[^>]*>Accueil<\/a>|<a[^>]*href="\.\.\/"[^>]*class="back"[^>]*>Accueil<\/a>/);
});

test("the screen says which of the four steps it is", () =>
{
    expect(page).toContain("Étape 1 sur 4\u00A0: votre adresse");
    expect(page.match(/class="segment done"/g)).toHaveLength(1);
});

test("the rent check says it covers Paris, Lyon and Villeurbanne, and a refusal names all three", () =>
{
    expect(page).toContain("Lyon et Villeurbanne");
    expect(problems["not-paris"]).toContain("Lyon");
});

function told(): string
{
    return (page.match(/<section[^>]*aria-labelledby="rent-check"[^>]*>.*?<\/section>/s)?.[0] ?? "").replaceAll("&#x27;", "'");
}

// The page that crawlers and tenants land on showed an address field and little else: not what the check compares, nor what it asks.
test("under the address form, the screen says what the cap is, which day counts and what the lease must give", () =>
{
    expect(page.indexOf('id="rent-check"')).toBeGreaterThan(page.indexOf("Trouver le quartier"));
    expect(told()).toContain('<h2 id="rent-check">Ce que vérifie Plafond</h2>');
    expect(told()).toContain("loyer de référence majoré de l'arrêté en vigueur le jour de la signature du bail");
    for (const asked of ["la date de signature", "la surface habitable", "le nombre de pièces", "l'époque de construction", "meublé", "le loyer hors charges", "complément de loyer"])
    {
        expect(told()).toContain(asked);
    }
});

test("the screen links every guide that explains the rent cap, from the guides' own list", () =>
{
    const explaining = guides.filter((guide) => guide.check.href === "loyer/");

    expect(explaining.map((guide) => guide.slug)).toEqual(["encadrement-des-loyers-paris", "complement-de-loyer", "encadrement-des-loyers-lyon"]);
    for (const guide of explaining)
    {
        expect(told()).toContain(`<a href="../guides/${guide.slug}/">${guide.label}</a>`);
    }
});

// Plafond cannot place every Montreuil address; the prefecture's simulator can, so the refusal links it.
test("an address that falls on no sector of a territory with an official simulator links that simulator", () =>
{
    const simulator = "https://www.service-public.gouv.fr/particuliers/vosdroits/R61539";
    const outside = renderToStaticMarkup(<AddressStep problem="outside" simulator={simulator} />);
    const border = renderToStaticMarkup(<AddressStep problem="border" simulator={simulator} />);
    const unknown = renderToStaticMarkup(<AddressStep problem="not-found" simulator={simulator} />);

    expect(outside).toMatch(/id="address-error"[^>]*>.*<a href="https:\/\/www\.service-public\.gouv\.fr\/particuliers\/vosdroits\/R61539">simulateur officiel<\/a>/s);
    expect(outside).toContain("dans l&#x27;un des secteurs de sa commune");
    expect(outside).not.toContain("couvert par l&#x27;encadrement");
    expect(border).toContain(`href="${simulator}"`);
    expect(unknown).not.toContain(`href="${simulator}"`);
    expect(renderToStaticMarkup(<AddressStep problem="outside" />)).not.toContain("simulateur officiel");
});
