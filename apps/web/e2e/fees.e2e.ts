import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Hand-counted on the caps of 1 January 2026: 12,10 € × 42,5 m² = 514,25 € and 3,03 € × 42,5 m² = 128,78 €, so 800 € and
// 150 € charged are 306,97 € over.
test("a tenant checks the agency fees and writes to the agency, and nothing leaves the phone", async ({ page, baseURL }) =>
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

    await page.clock.setFixedTime(new Date("2026-10-11T10:00:00+02:00"));
    await page.goto("/");
    await page.getByRole("link", { name: /^Mes frais d'agence/ }).click();

    await page.getByLabel("Adresse du logement").fill("4 Place du Louvre 75001 Paris");
    await page.getByLabel("Surface habitable").fill("42,5");
    await page.locator('input[name="zone"][value="very-tense"]').check();
    await page.getByLabel("Date de signature du bail").fill("2026-03-01");
    await page.getByLabel("Honoraires de visite, de dossier et de bail").fill("800");
    await page.getByLabel("Honoraires de l'état des lieux d'entrée").fill("150");
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Vérifier les honoraires" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("306,97");
    await page.getByRole("button", { name: "Préparer la lettre à l'agence" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre lettre à l'agence");
    await expect(page.locator("article")).toContainText("[Nom de l'agence]");
    await expect(page.locator("article")).toContainText("je vous mets en demeure de me rembourser la somme de 306,97");

    expect(elsewhere).toEqual([]);
});
