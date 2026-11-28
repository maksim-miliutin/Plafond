import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

test.beforeEach(async ({ page }) =>
{
    await answerForGeoplateforme(page, []);
});

test("a tenant of the Grand Paris finds a commune by a name typed without accents and learns what Plafond checks there", async ({ page }) =>
{
    await page.goto("/ile-de-france/");
    await page.getByRole("link", { name: "Le Grand Paris commune par commune" }).click();
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

test("a commune found by name offers the notice check with its zone filled in, Pierrefitte leading to Saint-Denis", async ({ page }) =>
{
    await page.goto("/grand-paris/");
    await page.getByLabel("Votre commune").fill("Pierrefitte");
    await expect(page.locator("#commune-count")).toHaveText("1 commune");
    await expect(page.getByRole("listitem").filter({ hasText: "Saint-Denis" }).getByRole("link", { name: "Vérifier mon préavis" })).toHaveAttribute("href", "../preavis/?commune=93066");

    await page.getByLabel("Votre commune").fill("Vincennes");
    await page.getByRole("listitem").filter({ hasText: "Vincennes" }).getByRole("link", { name: "Vérifier mon préavis" }).click();
    await page.getByLabel("Date de signature ou du dernier renouvellement du bail").fill("2026-01-15");
    await expect(page.locator('input[name="tense"][value="yes"]')).toBeChecked();

    await page.goto("/grand-paris/");
    await page.getByLabel("Votre commune").fill("Pierrefitte");
    await page.getByRole("listitem").filter({ hasText: "Saint-Denis" }).getByRole("link", { name: "Vérifier la hausse du loyer à la relocation" }).click();
    await expect(page.getByLabel("Commune du logement")).toHaveValue("Saint-Denis (93)");
});

test("the Grand Paris page leads to the other communes of Île-de-France", async ({ page }) =>
{
    await page.goto("/grand-paris/");
    await page.getByRole("link", { name: "Autre commune en Île-de-France" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/ile-de-france/");
});
