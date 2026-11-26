import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

test("a tenant finds when the notice ends and writes the letter giving notice, and nothing typed leaves the phone", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(url.href);
        }
    });

    await page.clock.setFixedTime(new Date("2027-03-10T10:00:00+01:00"));
    await answerForGeoplateforme(page, []);
    await page.goto("/");
    await page.getByRole("link", { name: /^Lyon et Villeurbanne/ }).click();
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

    expect(elsewhere.filter((href) => !href.startsWith("https://data.geopf.fr/wmts?"))).toEqual([]);
});

// The notice reads the list on the day the lease was signed or last renewed, as the official simulator does.
test("opened from a commune, the notice form asks for the lease's date, then answers the zone for it", async ({ page }) =>
{
    const answer = () => page.locator('input[name="tense"]:checked');

    await page.goto("/preavis/?commune=91027");
    await expect(answer()).toHaveCount(0);
    await page.getByLabel("Date de signature ou du dernier renouvellement du bail").fill("2026-01-15");
    await expect(answer()).toHaveValue("yes");
    await expect(page.getByText("Athis-Mons : en zone tendue")).toBeVisible();

    await page.getByLabel("Date de signature ou du dernier renouvellement du bail").fill("2020-06-01");
    await expect(answer()).toHaveValue("yes");
    await page.getByLabel("Date de signature ou du dernier renouvellement du bail").fill("2013-01-01");
    await expect(answer()).toHaveCount(0);

    for (const code of ["77022", "78043", "77186"])
    {
        await page.goto(`/preavis/?commune=${code}`);
        await page.getByLabel("Date de signature ou du dernier renouvellement du bail").fill("2026-11-25");
        await expect(answer()).toHaveValue("no");
    }

    await expect(page.locator('input[name="reason"]').first()).toBeVisible();
});
