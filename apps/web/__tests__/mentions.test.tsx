import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { AddressStep } from "../components/AddressStep";
import { DpeFindStep } from "../components/DpeFindStep";
import { Home } from "../components/Home";
import { Mentions } from "../components/Mentions";

const page = renderToStaticMarkup(<Mentions />);

test("the notice names the host with its address and telephone, as the LCEN asks", () =>
{
    expect(page).toContain("GitHub, Inc.");
    expect(page).toContain("88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis");
    expect(page).toContain("+1 415 735 4488");
});

test("a private publisher keeps its own details off the page and gives them to the host instead", () =>
{
    expect(page).toContain("à titre non professionnel");
    expect(page).toContain("communiquées à l&#x27;hébergeur");
    expect(page).toMatch(/href="https:\/\/github\.com\/maksim-miliutin\/Plafond\/issues"/);
});

test("the notice says what leaves the device and where it goes, and that nothing is kept", () =>
{
    expect(page).toContain("ni cookie ni mesure d&#x27;audience");
    expect(page).toContain("IGN");
    expect(page).toContain("ADEME");
    expect(page).toContain("adresse IP des visiteurs");
});

test("the notice is one tap away from the first screen of the app and of each check", () =>
{
    expect(renderToStaticMarkup(<Home />)).toMatch(/<a[^>]*href="mentions\/"[^>]*>Mentions légales<\/a>/);
    expect(renderToStaticMarkup(<AddressStep />)).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
    expect(renderToStaticMarkup(<DpeFindStep />)).toMatch(/<a[^>]*href="\.\.\/mentions\/"[^>]*>Mentions légales<\/a>/);
    expect(page).toMatch(/<a[^>]*href="\.\.\/"[^>]*>Toutes les vérifications<\/a>/);
});
