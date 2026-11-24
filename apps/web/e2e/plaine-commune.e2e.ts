import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

// 128 rue Gabriel Péri, on the sector 312 side of the line that splits Saint-Denis in annex 5 of the decree.
const saintDenis = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.356979, 48.941902] },
        properties: { id: "93066_3670_00128", label: "128 Rue Gabriel Péri 93200 Saint-Denis", type: "housenumber", citycode: "93066" },
    },
];

// The decree of 28 April 2026 caps an empty flat of two rooms built 1946-1970 in sector 312 at 20,50 € a square metre:
// 50 m² make 1 025,00 €, so a rent of 1 100 € is 75,00 € over.
test("a tenant in Saint-Denis is placed in sector 312 by the address and checked against the Plaine Commune decree", async ({ page }) =>
{
    await answerForGeoplateforme(page, saintDenis);
    await page.clock.setFixedTime(new Date("2026-10-07T10:00:00+02:00"));
    await page.goto("/loyer/");

    await page.getByLabel("Adresse du logement").fill("128 rue Gabriel Péri Saint-Denis");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Secteur 312");

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);

    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("appartement", { exact: true }).check();
    await page.getByLabel("2 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("vide", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("50");
    await page.getByLabel("Loyer de base").fill("1 100");
    await page.getByLabel("Date de signature du bail").fill("2026-07-15");
    await page.getByLabel("Date de prise d'effet").fill("2026-07-15");
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("75,00");
    await expect(page.getByText("Arrêté préfectoral n° IDF-2026-04-28-00033", { exact: false })).toBeVisible();
});
