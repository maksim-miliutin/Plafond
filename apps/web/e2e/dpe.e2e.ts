import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

const pantheon = [
    {
        type: "Feature",
        geometry: { type: "Point", coordinates: [2.3462, 48.8462] },
        properties: { id: "75105_7034_00007", label: "7 Place du Panthéon 75005 Paris", type: "housenumber", citycode: "75105" },
    },
];

const diagnosis = {
    numero_dpe: "2375E0345814N",
    etiquette_dpe: "G",
    date_etablissement_dpe: "2023-02-02",
    date_fin_validite_dpe: "2033-02-01",
    adresse_ban: "7 Place du Panthéon 75005 Paris",
    surface_habitable_logement: 73.2,
    numero_etage_appartement: 4,
    type_energie_principale_chauffage: "Électricité",
};

async function scanned(page: Page, screen: string): Promise<void>
{
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();

    expect(found.violations.map((v) => `${screen} ${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
}

test("the first screen offers both checks and leads to each", async ({ page }) =>
{
    await page.goto("/");
    await scanned(page, "home");

    await page.getByRole("link", { name: /Mon loyer/ }).click();
    await expect(page.getByLabel("Adresse du logement")).toBeVisible();

    await page.goto("/");
    await page.getByRole("link", { name: /passoire thermique/ }).click();
    await expect(page.getByLabel("Numéro du DPE ou adresse du logement")).toBeVisible();
});

// A G flat heated with electricity, raised in March 2024 under a lease signed in March 2023 and renewed in March 2026.
test("a tenant goes from an address to the DPE letter, and only the public services hear of it", async ({ page, baseURL }) =>
{
    const elsewhere = new Set<string>();
    page.on("request", (request) =>
    {
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.add(url.host);
        }
    });

    await answerForGeoplateforme(page, pantheon);
    await page.route("https://data.ademe.fr/**", (route) => route.fulfill({ json: { total: 1, results: [diagnosis] } }));
    await page.clock.setFixedTime(new Date("2026-10-03T10:00:00+02:00"));
    await page.goto("/dpe/");

    await page.getByLabel("Numéro du DPE ou adresse du logement").fill("7 place du Panthéon");
    await page.getByRole("button", { name: "Trouver le DPE" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lequel est votre logement ?");
    await scanned(page, "choice");

    await page.getByRole("button", { name: /2375E0345814N/ }).click();
    await page.getByLabel("Date de signature du bail").fill("2023-03-01");
    await page.getByLabel("vide", { exact: true }).check();
    await page.getByLabel("un particulier").check();
    await page.getByLabel("oui", { exact: true }).check();
    await page.getByLabel("Date de l'augmentation").fill("2024-03-01");
    await scanned(page, "lease");
    await page.getByRole("button", { name: "Vérifier mes droits" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Logement classé G");
    await scanned(page, "result");

    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Votre lettre au propriétaire");
    await expect(page.locator("article")).toContainText("renoncer à l'augmentation de loyer appliquée le 1er mars 2024");
    await scanned(page, "letter");

    expect([...elsewhere].sort()).toEqual(["data.ademe.fr", "data.geopf.fr"]);
});
