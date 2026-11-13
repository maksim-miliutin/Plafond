import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Home } from "../components/Home";

const page = renderToStaticMarkup(<Home shapes={{ paris: "M1,1Z", lyon: "M2,2Z" }} />);
const doors = page.match(/<a[^>]*class="check"[^>]*>.*?<\/a>/gs) ?? [];

test("the first screen offers only the two cities, as links relative to the page", () =>
{
    expect(doors).toHaveLength(2);
    expect(doors[0]).toMatch(/href="paris\/"/);
    expect(doors[0]).toContain("<strong>Paris</strong>");
    expect(doors[0]).toContain("Les 20 arrondissements. Le plan de la zone et les sept vérifications.");
    expect(doors[0]).toMatch(/<svg[^>]*aria-hidden="true".*d="M1,1Z"/s);
    expect(doors[1]).toMatch(/href="lyon\/"/);
    expect(doors[1]).toContain("<strong>Lyon et Villeurbanne</strong>");
    expect(doors[1]).toMatch(/<svg[^>]*aria-hidden="true".*d="M2,2Z"/s);
});

test("the first screen asks where the home is and keeps no check or guide", () =>
{
    expect(page.match(/<h1[^>]*>.*?<\/h1>/g)).toEqual(['<h1 class="title">Où se trouve votre logement ?</h1>']);
    expect(page).not.toMatch(/href="(loyer|depot|guides)\//);
});

test("the welcome says every check ends with a letter to send", () =>
{
    expect(page).toContain("lettre prête à envoyer");
});
