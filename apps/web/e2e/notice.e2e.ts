import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a tenant finds when the notice ends and writes the letter giving notice, and nothing leaves the phone", async ({ page, baseURL }) =>
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

    await page.clock.setFixedTime(new Date("2027-03-10T10:00:00+01:00"));
    await page.goto("/");
    await page.getByRole("link", { name: /^Combien de temps dure mon préavis/ }).click();

    await page.getByLabel("Adresse du logement").fill("12 Rue des Lilas 69003 Lyon");
    await page.getByLabel("Loyer mensuel charges comprises").fill("1 200");
    await page.locator('input[name="furnished"][value="no"]').check();
    await page.locator('input[name="tense"][value="unknown"]').check();
    await page.locator('input[name="reason"][value="transfer"]').check();
    await page.getByLabel("Date de réception de la lettre par le propriétaire").fill("2027-03-15");
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Calculer mon préavis" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Un mois de préavis");
    await expect(page.getByText("Joignez à votre lettre l'attestation de mutation établie par l'employeur")).toBeVisible();
    await page.getByRole("button", { name: "Préparer la lettre de congé" }).click();
    await expect(page.locator("article")).toContainText("pour le motif suivant : ma mutation professionnelle");
    await expect(page.locator("article")).toContainText("je quitterai donc le logement au plus tard le 15 avril 2027");

    expect(elsewhere).toEqual([]);
});
