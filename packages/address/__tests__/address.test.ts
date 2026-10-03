import { expect, test } from "vitest";

import { AddressError, geoplateforme, type Fetcher } from "../src/address.js";

interface Match
{
    id: string;
    type: string;
    citycode: string;
    label: string;
    coordinates: [number, number];
}

const louvre: Match = {
    id: "75101_5925_00004",
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
            properties: { id: m.id, label: m.label, score: 0.97, type: m.type, citycode: m.citycode, postcode: "75001", city: "Paris" },
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

    expect(found).toEqual({ kind: "located", id: louvre.id, label: louvre.label, point: { lon: 2.341191, lat: 48.860081 } });
});

// The BAN identifier is the key the ADEME files its energy diagnoses under; a text address would match the neighbours.
test("a located address keeps its BAN identifier", async () =>
{
    const found = await geoplateforme(answering(reply([louvre]))).locate("4 place du Louvre");
    const nameless = { ...louvre, id: undefined as unknown as string };

    expect(found).toMatchObject({ id: "75101_5925_00004" });
    await expect(geoplateforme(answering(reply([nameless]))).locate("4 place du Louvre")).rejects.toThrow(AddressError);
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

test("asked for mainland France, an address outside Paris is located too", async () =>
{
    const lyon: Match = { id: "69381_1234_00010", type: "housenumber", citycode: "69381", label: "10 Rue de la République 69001 Lyon", coordinates: [4.8357, 45.7640] };

    expect(await geoplateforme(answering(reply([lyon])), "mainland").locate("10 rue de la République Lyon")).toMatchObject({ kind: "located", id: lyon.id });
    expect(await geoplateforme(answering(reply([lyon]))).locate("10 rue de la République Lyon")).toMatchObject({ kind: "not-paris" });
});

// The overseas departments, 971 to 976, apply the same laws from other dates, which mainland rules would get wrong.
test("an overseas address is turned away from mainland rules, and says why", async () =>
{
    const reunion: Match = { id: "97411_0001_00001", type: "housenumber", citycode: "97411", label: "1 Rue de Paris 97400 Saint-Denis", coordinates: [55.45, -20.88] };

    expect(await geoplateforme(answering(reply([reunion])), "mainland").locate("1 rue de Paris Saint-Denis")).toEqual({ kind: "overseas", label: reunion.label });
});
