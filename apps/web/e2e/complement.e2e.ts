import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

const louvre = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3376, 48.8606] },
        properties: { id: "75101_5925_00004", label: "4 Place du Louvre 75001 Paris", type: "housenumber", citycode: "75101" },
    },
];

async function leaseWithComplement(page: Page, rent: string): Promise<void>
{
    await page.getByLabel("Adresse du logement").fill("4 place du Louvre");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("3 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("meublée", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("40");
    await page.getByLabel("Loyer de base").fill(rent);
    await page.getByLabel("Complément de loyer").fill("200");
    await page.getByLabel("Date de signature du bail").fill("2025-09-01");
    await page.getByLabel("Date de prise d'effet").fill("2025-09-01");
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();
}

// The note on a complement once set its heading and each paragraph side by side, in columns a few words wide.
test("a complement in the lease is set out in one column, its heading above its text", async ({ page }) =>
{
    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date("2026-11-09T10:00:00+01:00"));
    await page.goto("/loyer/");
    await leaseWithComplement(page, "1 280");

    const note = page.locator("section").filter({ has: page.getByRole("heading", { name: "Complément de loyer" }) });
    const box = (await note.boundingBox())!;
    const heading = (await note.getByRole("heading").boundingBox())!;
    const text = (await note.locator("p").first().boundingBox())!;

    expect(text.y).toBeGreaterThanOrEqual(heading.y + heading.height);
    expect(text.width).toBeGreaterThan(box.width / 2);
});

// 40 m² at 32,00 € caps the base rent at 1 280,00 €; a base of 1 200,00 € falls 80,00 € short, and the lease signed on
// 1 September 2025 leaves until 1 December 2025 to bring the complement before the commission.
test("a tenant with a complement on a base rent under the cap sees the rules, contests it in the letter and finds the rulings", async ({ page }) =>
{
    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date("2025-10-15T10:00:00+02:00"));
    await page.goto("/loyer/");
    await leaseWithComplement(page, "1 200");

    const note = page.locator("section").filter({ has: page.getByRole("heading", { name: "Complément de loyer" }) });
    await expect(note).toContainText("Le loyer de base de votre bail est inférieur de 80,00 € au plafond.");
    await expect(note.locator("ul.bars li")).toHaveCount(9);

    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("ne peut pas non plus être appliqué à un loyer de base inférieur au loyer de référence majoré");
    await expect(page.locator("article")).toContainText("au plus tard le 1er décembre 2025");

    await page.getByRole("button", { name: "Retour au résultat" }).click();
    await page.getByRole("link", { name: "Ce que les juges ont admis ou écarté" }).click();
    await expect(page).toHaveURL(/\/guides\/complement-de-loyer\/#juges$/);
    await expect(page.getByRole("heading", { name: "Ce que les juges ont admis" })).toBeVisible();
    await expect(page.getByText("Cour de cassation, 3e chambre civile, 4 décembre 2025, n° 24-17.930")).toBeVisible();
});
