/// <reference types="vite/client" />
import { expect, test } from "vitest";

import stylesheet from "../app/globals.css?raw";
import manifest from "../app/manifest";
import { viewport } from "../app/layout";
import { navy, paper, sky } from "../lib/brand";

// The icon is the source of the palette: its background, its arrow. A colour copied by hand drifts the day one copy changes.
test("the stylesheet takes its blue and its light blue from the icon", () =>
{
    expect(stylesheet).toContain(`--blue: ${navy};`);
    expect(stylesheet).toContain(`--sky: ${sky};`);
    expect(stylesheet).toContain(`--paper: ${paper};`);
});

test("the installed app and the browser bar wear the blue of the icon", () =>
{
    const app = manifest();

    expect(app.background_color).toBe(navy);
    expect(app.theme_color).toBe(navy);
    expect(viewport.themeColor).toBe(navy);
});

test("no colour of the old palette is left in the stylesheet", () =>
{
    for (const old of ["#1D3F73", "#F3F4F1", "#132B50", "29, 63, 115"])
    {
        expect(stylesheet, old).not.toContain(old);
    }
});
