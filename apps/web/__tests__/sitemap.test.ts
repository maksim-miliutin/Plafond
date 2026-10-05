import { expect, test, vi } from "vitest";

import sitemap from "../app/sitemap";
import { pages, siteUrl } from "../lib/site";

vi.mock("../lib/disk", () => ({ fromDisk: () => ({ places: [{ slug: "sorbonne" }, { slug: "odeon" }], districts: [{ slug: "paris-5e" }] }) }));

test("the sitemap lists every page of the table, every arrondissement and every quartier, at absolute addresses", () =>
{
    expect(sitemap().map((entry) => entry.url)).toEqual([
        ...pages.map((page) => `${siteUrl}/${page.path}`),
        `${siteUrl}/arrondissements/paris-5e/`,
        `${siteUrl}/quartiers/sorbonne/`,
        `${siteUrl}/quartiers/odeon/`,
    ]);
});
