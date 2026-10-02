import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

const louvre = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3376, 48.8606] },
        properties: { label: "4 Place du Louvre 75001 Paris", type: "housenumber", citycode: "75101" },
    },
];

async function scanned(page: Page, screen: string): Promise<void>
{
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();

    expect(found.violations.map((v) => `${screen} ${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
}

// The rent of a real flat in quartier 1, checked against the 2025 decree; 40 m² at 32,00 € caps it at 1 280,00 €.
test("a tenant goes from the address to the letter, and only the geocoder hears the address", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    const ours: string[] = [];
    page.on("request", (request) =>
    {
        const url = new URL(request.url());
        if (url.origin === new URL(baseURL ?? "").origin)
        {
            ours.push(request.url());
            return;
        }

        elsewhere.push(url.host);
    });

    await answerForGeoplateforme(page, louvre);
    await page.clock.setFixedTime(new Date("2026-09-29T10:00:00+02:00"));
    await page.goto("/");

    await page.getByLabel("Adresse du logement").fill("4 place du Louvre");
    await page.getByRole("button", { name: "Trouver le quartier" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Saint-Germain-l'Auxerrois");
    await scanned(page, "quartier");

    await page.getByRole("button", { name: "C'est bien ça" }).click();
    await page.getByLabel("3 pièces", { exact: true }).check();
    await page.getByLabel("entre 1946 et 1970").check();
    await page.getByLabel("meublée", { exact: true }).check();
    await page.getByLabel("Surface habitable").fill("40");
    await page.getByLabel("Loyer de base").fill("1 500");
    await page.getByLabel("Date de signature du bail").fill("2025-09-01");
    await page.getByLabel("Date de prise d'effet").fill("2025-09-01");
    await page.getByLabel("oui", { exact: true }).check();
    await scanned(page, "lease");
    await page.getByRole("button", { name: "Vérifier mon loyer" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("220,00");
    await scanned(page, "result");

    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre lettre au propriétaire");
    await expect(page.locator("article")).toContainText("4 Place du Louvre 75001 Paris");
    await expect(page.locator("article")).toContainText("Paris, le 29 septembre 2026");
    await scanned(page, "letter");

    expect([...new Set(elsewhere)]).toEqual(["data.geopf.fr"]);
    expect(ours.filter((url) => /louvre|1500|1%20500/i.test(url))).toEqual([]);
});
