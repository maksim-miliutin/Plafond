import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Service-public's own example, on the index the build ships: a lease of 600 € signed on 20 July 2025 that names no quarter,
// revised on 20 July 2026, allows 600 × 148,37 / 146,68 = 606,91 €; 620 € asked is 13,09 € too much each month.
test("a tenant checks the yearly rise against the index and writes to the landlord, and nothing leaves the phone", async ({ page, baseURL }) =>
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

    await page.clock.setFixedTime(new Date("2026-10-12T10:00:00+02:00"));
    await page.goto("/");
    await page.getByRole("link", { name: /^Ma hausse de loyer/ }).click();

    await page.getByLabel("Adresse du logement").fill("12 Rue des Lilas 69003 Lyon");
    await page.locator('input[name="clause"][value="yes"]').check();
    await page.locator('input[name="quarter"][value="none"]').check();
    await page.getByLabel("Date de signature du bail").fill("2025-07-20");
    await page.getByLabel("Date de révision prévue au bail").fill("2026-07-20");
    await page.getByLabel("Loyer hors charges avant la hausse").fill("600");
    await page.getByLabel("Loyer hors charges demandé").fill("620");
    await page.getByLabel("Date de la demande du propriétaire").fill("2026-08-03");
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Vérifier la hausse" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("13,09");
    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("ne peut donc pas dépasser 600,00 € × 148,37 / 146,68, soit 606,91 €");

    expect(elsewhere).toEqual([]);
});
