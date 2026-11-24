/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { ContoursError, contoursOf } from "../src/contours.js";
import { metropoleOf } from "../src/metropole.js";

import communes from "../../../db/seed/grand-paris-communes.csv?raw";
import grandParis from "../../../db/seed/grand-paris-contours.geojson?raw";
import lyon from "../../../db/seed/lyon-metropole-contours.geojson?raw";
import departements from "../../../db/seed/ile-de-france-departements.geojson?raw";

const square = [[[2.3, 48.8], [2.4, 48.8], [2.4, 48.9], [2.3, 48.9], [2.3, 48.8]]];

function collection(...features: unknown[]): unknown
{
    return { type: "FeatureCollection", features };
}

function feature(code: string, nom: string, coordinates: unknown = square, type = "Polygon"): unknown
{
    return { type: "Feature", properties: { code, nom }, geometry: { type, coordinates } };
}

// API Géo, codeEpci 200054781, snapshot of 24 November 2026: one outline for each commune of the Métropole du Grand Paris.
test("the Grand Paris outlines are those of the 130 communes the seed lists, Saint-Denis taking in Pierrefitte", () =>
{
    const codes = metropoleOf(communes).map((commune) => commune.code);
    const contours = contoursOf(JSON.parse(grandParis), codes);

    expect(contours).toHaveLength(130);
    expect(contours.find((contour) => contour.code === "75056")?.name).toBe("Paris");
    expect(contours.some((contour) => contour.code === "93059")).toBe(false);
});

// API Géo, codeEpci 200046977: the Métropole de Lyon counts 58 communes, Lyon one of them for its nine arrondissements.
test("the Lyon outlines are those of the 58 communes of the Métropole, Lyon and Villeurbanne among them", () =>
{
    const contours = contoursOf(JSON.parse(lyon));

    expect(contours).toHaveLength(58);
    expect(contours.filter((contour) => ["69123", "69266"].includes(contour.code)).map((contour) => contour.name).sort()).toEqual(["Lyon", "Villeurbanne"]);
    expect(contours.every((contour) => contour.code.startsWith("69"))).toBe(true);
});

test("the outlines of Île-de-France are its eight départements", () =>
{
    const contours = contoursOf(JSON.parse(departements), ["75", "77", "78", "91", "92", "93", "94", "95"]);

    expect(contours.find((contour) => contour.code === "93")?.name).toBe("Seine-Saint-Denis");
});

test("a multipolygon keeps every piece and hole as a ring", () =>
{
    const twoPieces = [square, [[[2.5, 48.8], [2.6, 48.8], [2.6, 48.9], [2.5, 48.8]]]];

    expect(contoursOf(collection(feature("94080", "Vincennes", twoPieces, "MultiPolygon")))[0]?.rings).toHaveLength(2);
});

test("a malformed file is refused, not drawn half", () =>
{
    expect(() => contoursOf({ type: "Feature" })).toThrow(ContoursError);
    expect(() => contoursOf(collection(feature("94080", "Vincennes"), feature("94080", "Vincennes")))).toThrow("94080 is outlined twice");
    expect(() => contoursOf(collection(feature("9408", "Vincennes")))).toThrow("feature 0 has no INSEE code or no name");
    expect(() => contoursOf(collection(feature("94080", "")))).toThrow("feature 0 has no INSEE code or no name");
    expect(() => contoursOf(collection(feature("94080", "Vincennes", [[[2.3, 48.8], [2.4, 48.8], [2.4, 48.9], [2.3, 48.9]]])))).toThrow("94080 has a ring that does not close");
    expect(() => contoursOf(collection(feature("94080", "Vincennes", [[[2.3, 48.8], [2.4, 48.8], [2.3, 48.8]]])))).toThrow("at least four positions");
    expect(() => contoursOf(collection(feature("94080", "Vincennes", [[[248.3, 48.8], [2.4, 48.8], [2.4, 48.9], [248.3, 48.8]]])))).toThrow("at least four positions");
    expect(() => contoursOf(collection(feature("94080", "Vincennes", square, "LineString")))).toThrow("neither a polygon nor a multipolygon");
});

test("given the codes it must hold, the reader names the ones missing and the ones added", () =>
{
    expect(() => contoursOf(collection(feature("94080", "Vincennes")), ["94080", "94081"])).toThrow("the outlines miss 94081 and add none");
    expect(() => contoursOf(collection(feature("94080", "Vincennes"), feature("94081", "Vitry-sur-Seine")), ["94080"])).toThrow("the outlines miss none and add 94081");
});
