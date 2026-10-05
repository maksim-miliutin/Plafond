import { expect, test, vi } from "vitest";

import sitemap from "../app/sitemap";
import { pages, siteUrl } from "../lib/site";

vi.mock("../lib/disk", () => ({ fromDisk: () => ({ places: [{ slug: "sorbonne" }, { slug: "odeon" }], districts: [] }) }));

test("the sitemap lists every page of the table and every quartier, at absolute addresses, and nothing else", () =>
{
    expect(sitemap().map((entry) => entry.url)).toEqual([
        ...pages.map((page) => `${siteUrl}/${page.path}`),
        `${siteUrl}/quartiers/sorbonne/`,
        `${siteUrl}/quartiers/odeon/`,
    ]);
});
