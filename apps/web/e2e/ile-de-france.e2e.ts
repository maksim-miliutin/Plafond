import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("from the home, a tenant of Versailles finds the commune with its department and opens the notice form for it", async ({ page }) =>
{
    await page.goto("/");
    await page.getByRole("link", { name: "Autre commune en Île-de-France" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/ile-de-france/");

    await page.getByLabel("Votre commune").fill("versailles");
    const card = page.locator(".region-results > li").filter({ hasText: "Versailles" });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText("Yvelines (78)");
    await expect(card).toContainText("Zone tendue, frais d'agence de zone très tendue.");
    await card.getByRole("link", { name: "Vérifier mon préavis" }).click();
    await expect.poll(() => new URL(page.url()).search).toBe("?commune=78646");
});

test("Pierrefitte leads to Saint-Denis, Barbizon offers no reletting check, and a code finds Massy", async ({ page }) =>
{
    await page.goto("/ile-de-france/");
    const field = page.getByLabel("Votre commune");

    await field.fill("Pierrefitte");
    await expect(page.locator(".region-results > li")).toHaveCount(1);
    await expect(page.locator(".region-results > li")).toContainText("Saint-Denis");

    await field.fill("Barbizon");
    await expect(page.getByRole("link", { name: "Vérifier la hausse du loyer à la relocation" })).toHaveCount(0);

    await field.fill("91377");
    await expect(page.locator(".region-results > li")).toContainText("Massy");
});

test("at 320 pixels the page fits, reads well for a screen reader and works from the keyboard", async ({ page }) =>
{
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/ile-de-france/");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.getByLabel("Votre commune").focus();
    await page.keyboard.type("Argenteuil");
    await expect(page.locator(".region-results > li")).toHaveCount(1);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((violation) => violation.id)).toEqual([]);
});
