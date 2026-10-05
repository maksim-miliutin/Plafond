/// <reference types="vite/client" />
import { expect, test } from "vitest";

import og from "../public/og.png?inline";
import * as home from "../app/page";
import * as rent from "../app/loyer/page";
import * as energy from "../app/dpe/page";
import * as deposit from "../app/depot/page";
import * as charges from "../app/charges/page";
import * as notice from "../app/mentions/page";
import { SiteError, pageMetadata, pages, siteFrom, siteUrl } from "../lib/site";

test("every page has a title search engines show whole and a description they do not cut", () =>
{
    for (const page of pages)
    {
        expect(page.title.length, page.path).toBeLessThanOrEqual(60);
        expect(page.description.length, page.path).toBeGreaterThanOrEqual(70);
        expect(page.description.length, page.path).toBeLessThanOrEqual(160);
    }
});

test("a shared link shows the large card, with the page's own words and its canonical address", () =>
{
    const described = pageMetadata("depot/");

    expect(described.alternates?.canonical).toBe(`${siteUrl}/depot/`);
    expect(described.openGraph).toMatchObject({ url: `${siteUrl}/depot/`, locale: "fr_FR", siteName: "Plafond", images: [{ url: `${siteUrl}/og.png`, width: 1200, height: 630 }] });
    expect(described.twitter).toMatchObject({ card: "summary_large_image" });
});

test("each page declares the words the table holds for it", () =>
{
    const declared = { "": home, "loyer/": rent, "dpe/": energy, "depot/": deposit, "charges/": charges, "mentions/": notice };

    for (const [path, page] of Object.entries(declared))
    {
        expect(page.metadata.title, path).toBe(pages.find((known) => known.path === path)!.title);
    }
});

test("a page the table does not know is a breakage", () =>
{
    expect(() => pageMetadata("nowhere/")).toThrow(SiteError);
});

// Link previews want 1200 by 630; a card of another shape is cropped or shown small.
test("the preview card is 1200 by 630", () =>
{
    const bytes = Buffer.from(og.split(",")[1]!, "base64");

    expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
});

// Seen live: the deploy handed over http://maksim-miliutin.com/Plafond, and a sitemap of http addresses tells search
// engines about a second, insecure copy of every page.
test("the site's address is always https once deployed, while a local run keeps its own", () =>
{
    expect(siteFrom("http://maksim-miliutin.com/Plafond")).toBe("https://maksim-miliutin.com/Plafond");
    expect(siteFrom("https://maksim-miliutin.com/Plafond/")).toBe("https://maksim-miliutin.com/Plafond");
    expect(siteFrom("http://localhost:3000")).toBe("http://localhost:3000");
    expect(siteFrom(undefined)).toBe("http://localhost:3000");
});
