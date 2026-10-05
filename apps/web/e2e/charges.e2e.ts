import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("a tenant goes from the first screen to the charges letter, and nothing leaves the phone", async ({ page, baseURL }) =>
{
    const elsewhere: string[] = [];
    page.on("request", (request) =>
    {
        const url = new URL(request.url());
        if (url.origin !== new URL(baseURL ?? "").origin)
        {
            elsewhere.push(url.host);
        }
    });

    await page.clock.setFixedTime(new Date("2026-03-01T10:00:00+01:00"));
    await page.goto("/");
    await page.getByRole("link", { name: /^Ma régularisation de charges/ }).click();

    await page.locator("#address").fill("12 Rue des Lilas 69003 Lyon");
    await page.locator("#year").fill("2024");
    await page.locator("#receivedOn").fill("2026-02-10");
    await page.locator("#provisions").fill("900");
    await page.locator("#amount-water").fill("300");
    await page.locator("#amount-insurance").fill("150");
    await page.locator("#amount-manager-fees").fill("200");
    await page.locator("#amount-caretaker").fill("400");
    await page.locator('input[name="caretaker"][value="one"]').check();
    await page.locator("#amount-waste-tax").fill("180");
    const scan = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(scan.violations.map((v) => v.id)).toEqual([]);
    await page.getByRole("button", { name: "Vérifier ma régularisation" }).click();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("facturés à tort");
    await page.getByRole("button", { name: "Préparer la lettre au propriétaire" }).click();
    await expect(page.locator("article")).toContainText("je vous mets en demeure de retirer ces sommes");

    expect(elsewhere).toEqual([]);
});
