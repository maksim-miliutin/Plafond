import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

test.beforeEach(async ({ page }) =>
{
    await answerForGeoplateforme(page, []);
});

test("a tenant of the Grand Paris finds a commune by a name typed without accents and learns what Plafond checks there", async ({ page }) =>
{
    await page.goto("/");
    await page.getByRole("link", { name: "Autre commune du Grand Paris" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/grand-paris/");
    await expect(page.locator("#commune-count")).toHaveText("130 communes");

    await page.getByLabel("Votre commune").fill("pre saint gervais");

    await expect(page.locator("#commune-count")).toHaveText("1 commune");
    await expect(page.getByRole("listitem").filter({ hasText: "Le Pré-Saint-Gervais" })).toContainText("Loyer encadré");

    await page.getByLabel("Votre commune").fill("Vincennes");

    await expect(page.getByRole("link", { name: "les six autres vérifications" })).toHaveAttribute("href", "../ailleurs/");
});

test("the Grand Paris page fits a 320 px phone and passes axe, list and search included", async ({ page }) =>
{
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/grand-paris/");
    await expect(page.locator("path.zone")).toHaveCount(3);
    await page.getByLabel("Votre commune").fill("Montreuil");

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});

test("the Est Ensemble page opens from the Grand Paris page, passes axe and leads to the rent check", async ({ page }) =>
{
    await page.goto("/grand-paris/");
    await page.getByRole("link", { name: "Est Ensemble", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/grand-paris/est-ensemble/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Encadrement des loyers à Est Ensemble");

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);

    await page.getByRole("link", { name: "Vérifier mon loyer à Est Ensemble" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/loyer/");
});

test("the Plaine Commune page opens from the Grand Paris page and passes axe", async ({ page }) =>
{
    await page.goto("/grand-paris/");
    await page.getByRole("link", { name: "Plaine Commune", exact: true }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/grand-paris/plaine-commune/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Encadrement des loyers à Plaine Commune");

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});
