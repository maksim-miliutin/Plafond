import { expect, test } from "@playwright/test";

// A search engine names a site from the WebSite data of its home page, and shows the icon the host serves.
test("the home page names the site Plafond for search engines, and the host serves its icon and robots.txt", async ({ page, baseURL }) =>
{
    await page.goto("/");

    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}") as Record<string, unknown>;
    expect(data).toMatchObject({ "@context": "https://schema.org", "@type": "WebSite", name: "Plafond" });
    expect(String(data["url"])).toMatch(/\/$/);

    expect((await page.request.get(`${baseURL}/favicon.ico`)).ok()).toBe(true);
    expect(await page.locator('link[rel="icon"]').count()).toBeGreaterThan(0);
    expect(await (await page.request.get(`${baseURL}/robots.txt`)).text()).toContain("sitemap.xml");
});
