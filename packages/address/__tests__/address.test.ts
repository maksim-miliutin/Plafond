import { expect, test } from "vitest";

import { AddressError, geoplateforme, type Fetcher } from "../src/address.js";

interface Match
{
    type: string;
    citycode: string;
    label: string;
    coordinates: [number, number];
}

const louvre: Match = {
    type: "housenumber",
    citycode: "75101",
    label: "4 Place du Louvre 75001 Paris",
    coordinates: [2.341191, 48.860081],
};

// The shape the Géoplateforme answers with: a GeoJSON feature collection whose
// properties are those of the Base Adresse Nationale.
function reply(matches: Match[]): unknown
{
    return {
        type: "FeatureCollection",
        features: matches.map((m) => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: m.coordinates },
            properties: { label: m.label, score: 0.97, type: m.type, citycode: m.citycode, postcode: "75001", city: "Paris" },
        })),
    };
}

function answering(body: unknown, status = 200): Fetcher & { asked: string[] }
{
    const asked: string[] = [];
    const fetcher = async (url: string) =>
    {
        asked.push(url);

        return { ok: status >= 200 && status < 300, status, json: async () => body };
    };

    return Object.assign(fetcher, { asked });
}

test("a house number in paris is located at its point", async () =>
{
    const found = await geoplateforme(answering(reply([louvre]))).locate("4 place du Louvre");

    expect(found).toEqual({ kind: "located", label: louvre.label, point: { lon: 2.341191, lat: 48.860081 } });
});

test("the question goes to the geoplateforme with the text encoded and one answer asked for", async () =>
{
    const fetcher = answering(reply([louvre]));
    await geoplateforme(fetcher).locate("  4 place du Louvre, Paris ");

    expect(fetcher.asked).toEqual(["https://data.geopf.fr/geocodage/search?q=4%20place%20du%20Louvre%2C%20Paris&index=address&limit=1"]);
});

test("an address outside paris is refused with what was found", async () =>
{
    const lyon = { ...louvre, citycode: "69381", label: "4 Place Bellecour 69002 Lyon" };

    expect(await geoplateforme(answering(reply([lyon]))).locate("4 place Bellecour")).toEqual({ kind: "not-paris", label: lyon.label });
});

test("the twenty arrondissements are paris and codes around them are not", async () =>
{
    for (const citycode of ["75101", "75109", "75110", "75120"])
    {
        const found = await geoplateforme(answering(reply([{ ...louvre, citycode }]))).locate("an address");
        expect(found.kind, citycode).toBe("located");
    }

    for (const citycode of ["75100", "75121", "75056", "7510", "751011"])
    {
        const found = await geoplateforme(answering(reply([{ ...louvre, citycode }]))).locate("an address");
        expect(found.kind, citycode).toBe("not-paris");
    }
});

test("a street without a house number is refused, because a street crosses quartiers", async () =>
{
    const street = { ...louvre, type: "street", label: "Rue de Rivoli 75001 Paris" };

    expect(await geoplateforme(answering(reply([street]))).locate("rue de Rivoli")).toEqual({ kind: "street-only", label: street.label });
});

test("no match is not found", async () =>
{
    expect(await geoplateforme(answering(reply([]))).locate("nowhere at all")).toEqual({ kind: "not-found" });
});

test("text too short or too long to be an address is not sent at all", async () =>
{
    const fetcher = answering(reply([louvre]));

    expect(await geoplateforme(fetcher).locate(" ab ")).toEqual({ kind: "not-found" });
    expect(await geoplateforme(fetcher).locate("x".repeat(201))).toEqual({ kind: "not-found" });
    expect(fetcher.asked).toEqual([]);
});

test("a failed request or an error status means the geocoder is unreachable", async () =>
{
    const failing: Fetcher = async () =>
    {
        throw new TypeError("Failed to fetch");
    };

    expect(await geoplateforme(failing).locate("4 place du Louvre")).toEqual({ kind: "unreachable" });
    expect(await geoplateforme(answering({}, 429)).locate("4 place du Louvre")).toEqual({ kind: "unreachable" });
    expect(await geoplateforme(answering({}, 503)).locate("4 place du Louvre")).toEqual({ kind: "unreachable" });
});

test("a reply of an unexpected shape is a breakage whose message never repeats the address", async () =>
{
    const shapes = [{}, { features: [{ properties: {} }] }, { features: [{ geometry: { coordinates: ["2.3", 48.8] }, properties: louvre }] }];

    for (const shape of shapes)
    {
        const lookup = geoplateforme(answering(shape)).locate("4 place du Louvre");

        await expect(lookup).rejects.toThrow(AddressError);
        await expect(lookup).rejects.not.toThrow(/Louvre/);
    }
});
