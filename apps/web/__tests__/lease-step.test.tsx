import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { LeaseStep } from "../components/LeaseStep";
import type { LeaseFields } from "../lib/lease";

const blank: LeaseFields = {
    dwelling: "",
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

const pastParis = { kind: "no-rate", side: "after", until: "2026-11-24", title: "Arrêté préfectoral n° IDF-2026-06-12-00003", url: "https://example.org/decree" } as const;

test("a lease signed on a day no rate covers is told so, above the button, and only then", () =>
{
    const refused = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={{ kind: "no-rate", side: "between" }} />);
    const notice = refused.match(/<p[^>]*role="alert"[^>]*>(.*?)<\/p>/)?.[1] ?? "";

    expect(notice).toContain("Aucun loyer de référence");
    expect(refused.indexOf("Aucun loyer de référence")).toBeLessThan(refused.indexOf("Vérifier mon loyer"));
    expect(page()).not.toContain("Aucun loyer de référence");
});

// Past the latest decree the law runs on and only the next table is missing, so the notice says the official data
// is not out yet rather than that no reference rent exists.
test("a lease signed past the latest known decree is told the official data for its date is not available", () =>
{
    const late = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={pastParis} />);
    const notice = late.match(/<p[^>]*role="alert"[^>]*>(.*?)<\/p>/)?.[1] ?? "";

    expect(notice).toMatch(/^Données officielles indisponibles pour cette date de bail\. /);
    expect(notice).not.toContain("Aucun loyer de référence");
});

// After 24 November 2026 the old notice blamed a missing update for what may be the end of the experiment itself.
test("the notice says why no rate applies: too early for the scheme, or past the latest known decree", () =>
{
    const early = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={{ kind: "no-rate", side: "before", from: "2019-07-01" }} />);
    const late = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={pastParis} />);

    expect(early).toContain("aux baux signés à partir du 1er juillet 2019");
    expect(late).toContain(") s&#x27;applique jusqu&#x27;au 24 novembre 2026");
    expect(late).not.toContain("1er juillet 2019");
});

// A notice that no rate applies leads to its official source: the latest decree, whose last day it states.
test("past the latest known decree, the notice links that decree by its title", () =>
{
    const late = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={pastParis} />);

    expect(late).toMatch(/le plus récent \(<a[^>]*href="https:\/\/example.org\/decree"[^>]*>Arrêté préfectoral n° IDF-2026-06-12-00003<\/a>\)/);
});

test("a lapsed law is named with its last day, and nothing says the rent is free", () =>
{
    const lapsed = renderToStaticMarkup(
        <LeaseStep
            fields={blank}
            errors={{}}
            unchecked={{ kind: "lapsed", lastDay: "2026-11-24", title: "Article 140 de la loi n° 2018-1021 du 23 novembre 2018", url: "https://example.org/law" }}
        />,
    );

    expect(lapsed).toContain("Plafond ne peut pas vérifier un bail signé après le 24 novembre 2026");
    expect(lapsed).toMatch(/<a[^>]*href="https:\/\/example.org\/law"[^>]*>Article 140 de la loi/);
    expect(lapsed).not.toContain("Aucun loyer de référence");
    for (const words of ["libre", "n&#x27;est plus encadré", "ne s&#x27;applique plus"])
    {
        expect(lapsed).not.toContain(words);
    }
});

// A date field shows the phone's own order of day and month; 01/09/2025 reads as January to a phone set to English.
test("a date already filled is spelled out under its field, so day and month cannot be swapped unseen", () =>
{
    const filled = page({ signedOn: "2025-09-01" });
    const field = filled.match(/<input[^>]*id="signedOn"[^>]*>/)?.[0] ?? "";

    expect(filled).toMatch(/id="signedOn-read"[^>]*>Soit le 1er septembre 2025\.</);
    expect(field).toMatch(/aria-describedby="[^"]*signedOn-read/);
    expect(page()).not.toContain("Soit le");
});

test("the screen says which of the four steps it is", () =>
{
    expect(page()).toContain("Étape 3 sur 4\u00A0: votre bail");
    expect(page().match(/class="segment done"/g)).toHaveLength(3);
});

test("the construction periods offered are the city's own", () =>
{
    const lyon = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} city="lyon" />);

    expect(lyon.match(/name="period"/g)).toHaveLength(5);
    expect(lyon).toContain("après 2005");
    expect(page().match(/name="period"/g)).toHaveLength(4);
});


test("a gap in the tables says Plafond lacks that period, without blaming the decree", () =>
{
    const gap = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} unchecked={{ kind: "no-rate", side: "between" }} />);

    expect(gap).toContain("Plafond ne dispose pas encore des loyers de référence de cette période");
    expect(gap).not.toContain("Aucun arrêté");
});

// The Est Ensemble decree prices houses and flats apart; the Paris and Lyon ones do not, so there the question is not asked.
test("the form asks whether the home is a flat or a house only where the decree prices them apart", () =>
{
    const east = renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} city="est-ensemble" />);

    expect(east.match(/name="dwelling"/g)).toHaveLength(2);
    expect(east).toMatch(/<legend[^>]*>Type de logement<\/legend>/);
    expect(east.indexOf('name="dwelling"')).toBeLessThan(east.indexOf('name="rooms"'));
    expect(east).toMatch(/<fieldset[^>]*aria-describedby="dwelling-hint"[^>]*><legend[^>]*>Type de logement<\/legend><p id="dwelling-hint"[^>]*>Une maison est un bâtiment qui ne compte qu&#x27;un seul logement/);
    expect(east).toContain("Construction du bâtiment");
    expect(page()).not.toContain('name="dwelling"');
    expect(renderToStaticMarkup(<LeaseStep fields={blank} errors={{}} city="lyon" />)).not.toContain('name="dwelling"');
});
