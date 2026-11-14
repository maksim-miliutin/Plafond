import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const everywhere = [
    { question: "Ma hausse de loyer respecte-t-elle l'indice ?", path: "/revision/" },
    { question: "Mon logement est-il une passoire thermique ?", path: "/dpe/" },
    { question: "Mon dépôt de garantie m'a-t-il été rendu à temps ?", path: "/depot/" },
    { question: "Ma régularisation de charges est-elle juste ?", path: "/charges/" },
    { question: "Combien de temps dure mon préavis ?", path: "/preavis/" },
    { question: "Mes frais d'agence dépassent-ils le plafond ?", path: "/frais-agence/" },
];

test("a tenant from another town reaches each check that holds everywhere in two steps, and comes back home", async ({ page }) =>
{
    for (const check of everywhere)
    {
        await page.goto("/");
        await page.getByRole("link", { name: "Autre ville en France" }).click();
        await expect(page.getByRole("link", { name: /Mon loyer dépasse/ })).toHaveCount(0);
        await page.getByRole("link", { name: check.question }).click();
        await expect.poll(() => new URL(page.url()).pathname, check.path).toBe(check.path);

        await page.getByRole("link", { name: "Accueil" }).click();
        await expect.poll(() => new URL(page.url()).pathname, check.path).toBe("/");
    }
});

test("the page for other towns fits a 320 px phone, passes axe and fetches nothing from another site", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        if (new URL(request.url()).origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(request.url());
        }
    });
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/ailleurs/");

    await expect(page.getByRole("navigation", { name: "Vérifications" }).getByRole("link")).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
    await page.waitForLoadState("networkidle");
    expect(elsewhere).toEqual([]);
});
