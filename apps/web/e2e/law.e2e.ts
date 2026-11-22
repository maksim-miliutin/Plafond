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

async function leaseSignedOn(page: Page, day: string, now = "2026-12-01T10:00:00+01:00"): Promise<void>
{
    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date(now));
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

// The law of 21 November 2026 carries article 140 of loi ELAN through 24 November 2028, read as the Paris decree
// of 12 June 2026 reads the end of the first eight years.
test("a lease signed the day after the last day of the law gets no verdict, and the notice names that day and the law", async ({ page }) =>
{
    await leaseSignedOn(page, "2028-11-25", "2028-12-01T10:00:00+01:00");

    await expect(page.getByText("Plafond ne peut pas vérifier un bail signé après le 24 novembre 2028")).toBeVisible();
    await expect(page.getByRole("link", { name: "Loi n° 2026-1072 du 21 novembre 2026" }))
        .toHaveAttribute("href", "https://www.legifrance.gouv.fr/jorf/jo/2026/11/22/0273");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ce que dit votre bail");

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});

// The bug this guards: once the law was extended, a lease signed after the 2026 decree was still told the law had
// lapsed. The decree of 12 June 2026 stops on 24 November 2026, and no later one is published yet.
test("a lease signed after the last Paris decree, while the law runs on, is told no reference rent is known yet", async ({ page }) =>
{
    await leaseSignedOn(page, "2026-11-25");

    await expect(page.getByText("Aucun loyer de référence n'est disponible pour cette date de signature.")).toBeVisible();
    await expect(page.getByText("Plafond ne peut pas vérifier un bail signé après")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ce que dit votre bail");
});

// 40 m² at 33,00 €, the 2026 majored rent of sector 2 for three furnished rooms built 1946-1970, caps the base rent at 1 320,00 €.
test("a lease signed on the last day of the 2026 decree is checked against it", async ({ page }) =>
{
    await leaseSignedOn(page, "2026-11-24");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("180,00");
});
