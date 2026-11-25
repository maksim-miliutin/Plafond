import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

// A touch on the plan is a click on one of its paths; the path is found by the name its title gives it.
async function touch(page: Page, name: string): Promise<void>
{
    const shapes = page.getByRole("tabpanel").locator("path.shape");
    const index = await shapes.evaluateAll((paths, wanted) => paths.findIndex((path) => path.querySelector("title")?.textContent === wanted), name);
    expect(index, name).toBeGreaterThanOrEqual(0);
    await shapes.nth(index).dispatchEvent("click");
}

test("the first screen draws the Grand Paris and tells what Plafond checks in the commune touched", async ({ page }) =>
{
    await page.goto("/");
    const panel = page.getByRole("tabpanel");

    await expect(panel.locator("path.shape")).toHaveCount(149);
    await touch(page, "Vincennes");
    await expect(panel.locator(".map-card")).toContainText("Zone très tendue");
    await expect(panel.getByRole("link", { name: "Les six vérifications" })).toHaveAttribute("href", "ailleurs/");

    await touch(page, "Montreuil");
    await panel.getByRole("link", { name: "Vérifier mon loyer" }).click();
    await expect.poll(() => new URL(page.url()).pathname).toBe("/loyer/");
});

test("the Lyon tab draws Lyon by arrondissement and leads to the page of the one touched", async ({ page }) =>
{
    await page.goto("/");
    const tab = page.getByRole("tab", { name: "Lyon et Villeurbanne" });
    await tab.click();

    await expect(tab).toHaveAttribute("aria-selected", "true");
    await touch(page, "Lyon 3e");
    await expect(page.getByRole("tabpanel").getByRole("link", { name: "Les loyers de référence de Lyon 3e" })).toHaveAttribute("href", "lyon/lyon-3e-arrondissement/");
});

test("the plan fits a 320 px phone and a wide screen, and passes the accessibility checks", async ({ page }) =>
{
    for (const size of [{ width: 320, height: 640 }, { width: 1280, height: 900 }])
    {
        await page.setViewportSize(size);
        await page.goto("/");
        await expect(page.getByRole("tabpanel").locator("svg")).toBeVisible();

        expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${size.width}`).toBeLessThanOrEqual(0);
    }

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});
