import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) =>
{
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
