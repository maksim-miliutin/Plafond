import { expect, test } from "vitest";

import manifest from "../app/manifest";

const app = manifest();

test("the app opens full screen from the home screen, in french", () =>
{
    expect(app.display).toBe("standalone");
    expect(app.lang).toBe("fr");
    expect(app.name).toBe("Plafond");
});

// GitHub Pages serves the app under /Plafond/; addresses relative to the manifest keep working there and at the root.
test("every address in the manifest is relative, so the app installs from under a project path", () =>
{
    const addresses = [app.start_url, app.scope, ...(app.icons ?? []).map((icon) => icon.src)];

    expect(addresses.every((address) => typeof address === "string" && !address.startsWith("/") && !address.includes("://"))).toBe(true);
});

test("phones get the icon sizes they ask for, one of them safe to crop into a circle", () =>
{
    const icons = app.icons ?? [];

    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
    expect(icons.some((icon) => icon.purpose === "maskable")).toBe(true);
});
