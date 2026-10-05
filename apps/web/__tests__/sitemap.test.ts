import { expect, test } from "vitest";

import sitemap from "../app/sitemap";
import { pages, siteUrl } from "../lib/site";

test("the sitemap lists every page of the table at its absolute address, and nothing else", () =>
{
    expect(sitemap().map((entry) => entry.url)).toEqual(pages.map((page) => `${siteUrl}/${page.path}`));
});
