import { expect, test } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

const louvre = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3376, 48.8606] },
        properties: { id: "75101_5925_00004", label: "4 Place du Louvre 75001 Paris", type: "housenumber", citycode: "75101" },
    },
];

// The note on a complement once set its heading and each paragraph side by side, in columns a few words wide.
test("a complement in the lease is set out in one column, its heading above its text", async ({ page }) =>
{
    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date("2026-11-09T10:00:00+01:00"));
    await page.goto("/loyer/");

    await page.getByLabel("Adresse du logement").fill("4 place du Louvre");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("3 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("meublée", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("40");
    await page.getByLabel("Loyer de base").fill("1 280");
    await page.getByLabel("Complément de loyer").fill("200");
    await page.getByLabel("Date de signature du bail").fill("2025-09-01");
    await page.getByLabel("Date de prise d'effet").fill("2025-09-01");
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();

    const note = page.locator("section").filter({ has: page.getByRole("heading", { name: "Complément de loyer" }) });
    const box = (await note.boundingBox())!;
    const heading = (await note.getByRole("heading").boundingBox())!;
    const text = (await note.locator("p").first().boundingBox())!;

    expect(text.y).toBeGreaterThanOrEqual(heading.y + heading.height);
    expect(text.width).toBeGreaterThan(box.width / 2);
});
