import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { Home } from "../components/Home";

const page = renderToStaticMarkup(<Home />);
const tiles = page.match(/<a[^>]*class="check"[^>]*>.*?<\/a>/gs) ?? [];

test("the first screen offers every check, each a link relative to the page, so it works under the project path too", () =>
{
    expect(page).toMatch(/<a[^>]*href="loyer\/"[^>]*>.*Mon loyer.*<\/a>/s);
    expect(page).toMatch(/<a[^>]*href="dpe\/"[^>]*>.*DPE.*<\/a>/s);
    expect(page).toMatch(/<a[^>]*href="depot\/"[^>]*>.*dépôt de garantie.*<\/a>/s);
    expect(page).toMatch(/<a[^>]*href="charges\/"[^>]*>.*régularisation de charges.*<\/a>/s);
    expect(page.match(/<h1/g)).toHaveLength(1);
});

test("each check has its own drawing, kept from screen readers, and says what to have at hand and how long it takes", () =>
{
    expect(tiles).toHaveLength(4);
    for (const tile of tiles)
    {
        expect(tile).toMatch(/<svg[^>]*aria-hidden="true"/);
        expect(tile).toMatch(/environ \d minutes/);
    }

    expect(new Set(tiles.map((tile) => tile.match(/<svg.*?<\/svg>/s)?.[0])).size).toBe(4);
});

test("the welcome says every check ends with a letter to send", () =>
{
    expect(page).toContain("lettre prête à envoyer");
});
