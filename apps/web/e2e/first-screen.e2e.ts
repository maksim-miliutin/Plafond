import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) =>
{
    // The geocoder is a public service; tests answer in its place so they never leave the machine.
    await page.route("https://data.geopf.fr/**", (route) => route.fulfill({ json: { type: "FeatureCollection", features: [] } }));
    await page.goto("/");
});

test("the first screen fits the screen without sideways scrolling", async ({ page }) =>
{
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

    expect(overflow).toBeLessThanOrEqual(0);
});

// Safari on iPhone zooms into any field whose text is smaller than 16px, and the page jumps when it does.
test("typing an address does not make the phone zoom in", async ({ page }) =>
{
    const size = await page.getByLabel("Adresse du logement").evaluate((field) => parseFloat(getComputedStyle(field).fontSize));

    expect(size).toBeGreaterThanOrEqual(16);
});

test("the address field takes what is typed", async ({ page }) =>
{
    const field = page.getByLabel("Adresse du logement");
    await field.fill("4 place du Louvre");

    await expect(field).toHaveValue("4 place du Louvre");
});

test("the button is big enough for a thumb", async ({ page }) =>
{
    const box = await page.getByRole("button", { name: "Trouver le quartier" }).boundingBox();

    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});

test("the page is in french", async ({ page }) =>
{
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
});

test("nothing is fetched from another site, not even fonts", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        if (new URL(request.url()).origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(request.url());
        }
    });

    await page.reload({ waitUntil: "networkidle" });

    expect(elsewhere).toEqual([]);
});

test("an address typed and sent never reaches our server", async ({ page, baseURL }) =>
{
    const ours: string[] = [];
    page.on("request", (request) =>
    {
        if (request.url().startsWith(baseURL ?? "") && request.url().includes("Louvre"))
        {
            ours.push(request.url());
        }
    });

    const field = page.getByLabel("Adresse du logement");
    await field.fill("4 place du Louvre");
    await field.press("Enter");
    await page.waitForLoadState("networkidle");

    expect(ours).toEqual([]);
    expect(page.url()).not.toContain("Louvre");
});

// Next.js adds its own live region for route changes outside the page's landmarks; it is not ours to fix.
test("the first screen passes an accessibility scan, contrast included", async ({ page }) =>
{
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();

    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});
