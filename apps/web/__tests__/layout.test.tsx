import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import RootLayout from "../app/layout";

const page = renderToStaticMarkup(<RootLayout><main>screen</main></RootLayout>);

// The brief keeps the app from people until it matches the official tool; until then every screen says it is a trial.
test("every screen says the figures are still being checked against the official tool", () =>
{
    const notice = page.match(/<header class="beta"><p role="note">([^<]*)<\/p><\/header>/)?.[1] ?? "";

    expect(notice).toContain("Version d'essai".replace("'", "&#x27;"));
    expect(notice).toContain("simulateur officiel");
    expect(page.indexOf("beta")).toBeLessThan(page.indexOf("<main>"));
});
