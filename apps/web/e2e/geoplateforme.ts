import type { Page } from "@playwright/test";

// A one pixel PNG stands in for every map tile.
const blank = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

export async function answerForGeoplateforme(page: Page, features: unknown[]): Promise<void>
{
    await page.route("https://data.geopf.fr/**", (route) =>
        route.request().url().includes("/wmts")
            ? route.fulfill({ contentType: "image/png", body: blank })
            : route.fulfill({ json: { type: "FeatureCollection", features } }));
}
