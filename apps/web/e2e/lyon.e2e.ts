import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

// A point near the Part-Dieu, in an IRIS of Lyon's 3rd arrondissement.
const partDieu = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [4.8579, 45.7606] },
        properties: { id: "69383_0001_00010", label: "10 Rue de la Part-Dieu 69003 Lyon", type: "housenumber", citycode: "69383" },
    },
];

async function scanned(page: Page, screen: string): Promise<void>
{
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();

    expect(found.violations.map((v) => `${screen} ${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
}

// The decree of 23 October 2025 caps this sector's two rooms built before 1946, let empty, at 16.90 € a square metre:
// 50 m² make 845,00 €, so a rent of 1 500 € is 655,00 € over, counted by hand from the Métropole's published table.
test("a tenant in Lyon goes from the address to the letter, against Lyon's own table", async ({ page }) =>
{
    await answerForGeoplateforme(page, partDieu);
    await page.clock.setFixedTime(new Date("2026-10-07T10:00:00+02:00"));
    await page.goto("/loyer/");

    await page.getByLabel("Adresse du logement").fill("10 rue de la Part-Dieu Lyon");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lyon 3e Arrondissement");
    await scanned(page, "sector");

    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("2 pièces", { exact: true }).check();
    await page.getByLabel("avant 1946").check();
    await page.getByLabel("vide", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("50");
    await page.getByLabel("Loyer de base").fill("1 500");
    await page.getByLabel("Date de signature du bail").fill("2026-01-15");
    await page.getByLabel("Date de prise d'effet").fill("2026-01-15");
    await page.getByLabel("oui", { exact: true }).check();
    await expect(page.getByLabel("après 2005")).toBeVisible();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("655,00");
    await scanned(page, "result");

    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("Lyon, le 7 octobre 2026");
    await expect(page.locator("article")).toContainText("préfet du Rhône");
});
