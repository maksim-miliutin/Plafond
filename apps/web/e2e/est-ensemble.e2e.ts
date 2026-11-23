import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

// An address in Pantin, which annex 1 of the Est Ensemble decree puts whole in sector 308.
const pantin = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.404, 48.894] },
        properties: { id: "93055_1234_00012", label: "12 Rue Hoche 93500 Pantin", type: "housenumber", citycode: "93055" },
    },
];

async function scanned(page: Page, screen: string): Promise<void>
{
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();

    expect(found.violations.map((v) => `${screen} ${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
}

// The decree of 28 April 2026 caps an empty flat of two rooms built 1946-1970 in sector 308 at 22,80 € a square metre:
// 38 m² make 866,40 €, so a rent of 900 € is 33,60 € over.
test("a tenant in Pantin goes from the address to the letter, against the Est Ensemble decree", async ({ page }) =>
{
    await answerForGeoplateforme(page, pantin);
    await page.clock.setFixedTime(new Date("2026-10-07T10:00:00+02:00"));
    await page.goto("/loyer/");

    await page.getByLabel("Adresse du logement").fill("12 rue Hoche Pantin");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Secteur 308");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pantin");
    await scanned(page, "sector");

    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("appartement", { exact: true }).check();
    await page.getByLabel("2 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("vide", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("38");
    await page.getByLabel("Loyer de base").fill("900");
    await page.getByLabel("Date de signature du bail").fill("2026-07-15");
    await page.getByLabel("Date de prise d'effet").fill("2026-07-15");
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("33,60");
    await expect(page.getByText("Arrêté préfectoral n° IDF-2026-04-28-00032", { exact: false })).toBeVisible();
    await scanned(page, "result");

    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("Pantin, le 7 octobre 2026");
    await expect(page.locator("article")).toContainText("dans le secteur géographique 308 de l'arrêté");
    await expect(page.locator("article")).toContainText("préfet de la région d'Île-de-France");
});
