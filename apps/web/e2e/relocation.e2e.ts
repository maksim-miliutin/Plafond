import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The acceptance case: a D dwelling in Vincennes relet after two months, its last rent of 1 000 € revised in the year before;
// 1 080 € asked is 80 € too much each month.
test("a tenant opened from Vincennes finds 80 € too much each month, and nothing typed leaves the phone", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        if (new URL(request.url()).origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(request.url());
        }
    });

    await page.goto("/relocation/?commune=94080");
    await expect(page.getByLabel("Commune du logement")).toHaveValue("Vincennes (94)");
    await page.getByLabel("Date de signature du bail").fill("2026-09-01");
    await page.getByLabel("Loyer hors charges de votre bail").fill("1080");
    await page.locator('input[name="first"][value="no"]').check();
    await page.locator('input[name="dpe"][value="D"]').check();
    await page.locator('input[name="vacancy"][value="within"]').check();
    await page.getByLabel("Dernier loyer hors charges du locataire précédent").fill("1000");
    await page.locator('input[name="revised"][value="yes"]').check();
    await page.locator('input[name="basis"][value="none"]').check();
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Vérifier la hausse" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("80,00");
    await expect(page.locator(".figures")).toContainText("1 000,00");
    expect(elsewhere).toEqual([]);
});

test("opened bare, the form asks for the commune; a first letting in Montreuil leads to the rent cap", async ({ page }) =>
{
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/relocation/?commune=nowhere");
    await expect(page.getByLabel("Commune du logement")).toHaveValue("");

    await page.getByLabel("Commune du logement").fill("Montreuil (93)");
    await page.getByLabel("Date de signature du bail").fill("2026-09-01");
    await page.getByLabel("Loyer hors charges de votre bail").fill("900");
    await page.locator('input[name="first"][value="yes"]').check();
    await expect(page.locator('input[name="dpe"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.getByRole("button", { name: "Vérifier la hausse" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Première location");
    await page.getByRole("link", { name: "Vérifier le plafond du loyer" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/loyer/");
});

test("a lease signed on 1 August 2027 is past the rules Plafond holds", async ({ page }) =>
{
    await page.goto("/relocation/?commune=94080");
    await expect(page.getByLabel("Commune du logement")).toHaveValue("Vincennes (94)");
    await page.getByLabel("Date de signature du bail").fill("2027-08-01");
    await page.getByLabel("Loyer hors charges de votre bail").fill("1080");
    await page.locator('input[name="first"][value="no"]').check();
    await page.locator('input[name="dpe"][value="D"]').check();
    await page.locator('input[name="vacancy"][value="within"]').check();
    await page.getByLabel("Dernier loyer hors charges du locataire précédent").fill("1000");
    await page.locator('input[name="revised"][value="yes"]').check();
    await page.locator('input[name="basis"][value="none"]').check();
    await page.getByRole("button", { name: "Vérifier la hausse" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Règles non disponibles pour cette date de bail");
});

test("Barbizon is outside the zone the decree reads, and the result leads to the DPE check", async ({ page }) =>
{
    await page.goto("/relocation/?commune=77022");
    await expect(page.getByLabel("Commune du logement")).toHaveValue("Barbizon (77)");
    await page.getByLabel("Date de signature du bail").fill("2026-11-25");
    await page.getByLabel("Loyer hors charges de votre bail").fill("900");
    await page.locator('input[name="first"][value="no"]').check();
    await page.locator('input[name="dpe"][value="D"]').check();
    await page.locator('input[name="vacancy"][value="within"]').check();
    await page.getByLabel("Dernier loyer hors charges du locataire précédent").fill("850");
    await page.locator('input[name="revised"][value="yes"]').check();
    await page.locator('input[name="basis"][value="none"]').check();
    await page.getByRole("button", { name: "Vérifier la hausse" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hors champ de cette vérification");
    await expect(page.getByRole("link", { name: "Vérifier le DPE du logement" })).toHaveAttribute("href", "../dpe/");
});
