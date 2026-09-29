import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { AddressStep } from "../components/AddressStep";

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
