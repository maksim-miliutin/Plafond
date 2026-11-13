import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { answerForGeoplateforme } from "./geoplateforme";

function zoomOf(url: string): number
{
    return Number(new URL(url).searchParams.get("TILEMATRIX"));
}

async function plan(page: Page): Promise<string[]>
{
    const tiles: string[] = [];
    page.on("request", (request) =>
    {
        if (request.url().includes("TILEMATRIX="))
        {
            tiles.push(request.url());
        }
    });
    await answerForGeoplateforme(page, []);

    return tiles;
}

test("the Paris page draws the zone on the IGN plan and zooms in toward the street", async ({ page }) =>
{
    const tiles = await plan(page);
    await page.goto("/paris/");

    await expect(page.locator(".leaflet-overlay-pane path.zone")).toHaveCount(1);
    await expect.poll(() => tiles.length).toBeGreaterThan(0);
    expect(tiles.every((url) => url.includes("LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"))).toBe(true);

    const first = Math.max(...tiles.map(zoomOf));
    for (const step of [1, 2])
    {
        await page.getByRole("button", { name: "Zoom avant" }).click();
        await expect.poll(() => Math.max(...tiles.map(zoomOf))).toBeGreaterThanOrEqual(first + step);
        await expect(page.locator(".city-map .leaflet-map-pane")).not.toHaveClass(/leaflet-zoom-anim/);
    }
});

test("the whole of Paris is in view when the page opens, even on a 320 px phone", async ({ page }) =>
{
    await plan(page);

    for (const size of [{ width: 390, height: 844 }, { width: 320, height: 640 }])
    {
        await page.setViewportSize(size);
        await page.goto("/paris/");
        await expect(page.locator("path.zone")).toHaveCount(1);

        const zone = (await page.locator("path.zone").boundingBox())!;
        const map = (await page.locator(".city-map").boundingBox())!;
        expect(zone.x, `${size.width}`).toBeGreaterThanOrEqual(map.x - 2);
        expect(zone.y, `${size.width}`).toBeGreaterThanOrEqual(map.y - 2);
        expect(zone.x + zone.width, `${size.width}`).toBeLessThanOrEqual(map.x + map.width + 2);
        expect(zone.y + zone.height, `${size.width}`).toBeLessThanOrEqual(map.y + map.height + 2);
    }
});

test("without the IGN plan the zone is still drawn", async ({ page }) =>
{
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.route("https://data.geopf.fr/**", (route) => route.abort());
    await page.goto("/paris/");

    await expect(page.locator("path.zone")).toHaveCount(1);
    await expect(page.getByText("Fond de carte")).toBeVisible();
    expect(errors).toEqual([]);
});

test("a wheel over the map scrolls the page until the map has focus", async ({ page, isMobile }) =>
{
    test.skip(isMobile, "a wheel is a desktop gesture");
    const tiles = await plan(page);
    await page.goto("/paris/");
    await expect(page.locator("path.zone")).toHaveCount(1);
    await expect.poll(() => tiles.length).toBeGreaterThan(0);
    const first = Math.max(...tiles.map(zoomOf));

    const map = (await page.locator(".city-map").boundingBox())!;
    await page.mouse.move(map.x + map.width / 2, map.y + map.height / 2);
    await page.mouse.wheel(0, 400);

    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    expect(Math.max(...tiles.map(zoomOf))).toBe(first);
});

test("the map leaves room to scroll the page on a phone, held upright or sideways", async ({ page }) =>
{
    await plan(page);

    for (const size of [{ width: 390, height: 844 }, { width: 844, height: 390 }])
    {
        await page.setViewportSize(size);
        await page.goto("/paris/");

        const map = (await page.locator(".city-map").boundingBox())!;
        expect(map.height, `${size.width}×${size.height}`).toBeLessThanOrEqual(size.height * 0.6 + 1);
    }
});

test("the Paris page fits a 320 px phone and its zoom buttons fit a thumb", async ({ page }) =>
{
    await plan(page);
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto("/paris/");
    await expect(page.locator("path.zone")).toHaveCount(1);

    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    const zoom = (await page.getByRole("button", { name: "Zoom avant" }).boundingBox())!;
    expect(zoom.width).toBeGreaterThanOrEqual(44);
    expect(zoom.height).toBeGreaterThanOrEqual(44);
});

test("the Paris page passes axe", async ({ page }) =>
{
    await plan(page);
    await page.goto("/paris/");
    await expect(page.locator("path.zone")).toHaveCount(1);

    const found = await new AxeBuilder({ page }).exclude("next-route-announcer").analyze();
    expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
});

test("the Lyon page draws Lyon and Villeurbanne apart and leads to each commune", async ({ page }) =>
{
    await plan(page);
    await page.goto("/lyon/");

    await expect(page.locator("path.zone")).toHaveCount(2);
    await expect(page.locator(".references.districts a")).toHaveCount(10);
    await page.getByRole("link", { name: "Villeurbanne", exact: true }).click();
    await expect(page).toHaveURL(/\/lyon\/villeurbanne\/$/);
});

