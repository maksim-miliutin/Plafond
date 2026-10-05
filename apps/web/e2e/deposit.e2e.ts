import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a tenant goes from the first screen to the deposit letter, and nothing leaves the phone", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(url.host);
        }
    });

    await page.clock.setFixedTime(new Date("2026-10-03T10:00:00+02:00"));
    await page.goto("/");
    await page.getByRole("link", { name: /^Mon dépôt de garantie/ }).click();

    await page.getByLabel("Adresse du logement quitté").fill("12 Rue des Lilas 69003 Lyon");
    await page.getByLabel("Loyer mensuel hors charges").fill("1 200");
    await page.getByLabel("Dépôt de garantie versé").fill("1 200");
    await page.getByLabel("vide", { exact: true }).check();
    await page.getByLabel("Date de remise des clés").fill("2026-07-01");
    await page.locator('input[name="conforming"][value="yes"]').check();
    await page.locator('input[name="addressGiven"][value="yes"]').check();
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Vérifier mon dépôt" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("vous sont dus");
    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("je vous mets en demeure de me restituer la somme");

    expect(elsewhere).toEqual([]);
});
