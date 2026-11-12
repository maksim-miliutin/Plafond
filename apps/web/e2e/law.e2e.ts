import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

const louvre = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3376, 48.8606] },
        properties: { id: "75101_5925_00004", label: "4 Place du Louvre 75001 Paris", type: "housenumber", citycode: "75101" },
    },
];

async function leaseSignedOn(page: Page, day: string): Promise<void>
{
    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date("2026-12-01T10:00:00+01:00"));
    await page.goto("/loyer/");

    await page.getByLabel("Adresse du logement").fill("4 place du Louvre");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("3 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("meublée", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("40");
    await page.getByLabel("Loyer de base").fill("1 500");
    await page.getByLabel("Date de signature du bail").fill(day);
    await page.getByLabel("Date de prise d'effet").fill(day);
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();
}

// Article 140 of loi ELAN covers leases signed through 24 November 2026, as the Paris decree of 12 June 2026 reads its end.
test("a lease signed the day after the last day of the law gets no verdict, and the notice names that day and the law", async ({ page }) =>
{
    await leaseSignedOn(page, "2026-11-25");

    await expect(page.getByText("Plafond ne peut pas vérifier un bail signé après le 24 novembre 2026")).toBeVisible();
    await expect(page.getByRole("link", { name: "Article 140 de la loi n° 2018-1021 du 23 novembre 2018" }))
        .toHaveAttribute("href", "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000037639478/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ce que dit votre bail");

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});

// 40 m² at 33,00 €, the 2026 majored rent of sector 2 for three furnished rooms built 1946-1970, caps the base rent at 1 320,00 €.
test("a lease signed on the last day of the law is checked against the 2026 decree", async ({ page }) =>
{
    await leaseSignedOn(page, "2026-11-24");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("180,00");
});
