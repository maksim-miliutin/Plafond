/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { arrondissementOf, outlineOf } from "@plafond/domain";
import { contoursOf, metropoleOf, quartiersOf } from "@plafond/import";

import { grandParisDrawing, pathOf, projectionOf, sharedSides, simplified } from "../lib/home-map";

import list from "../../../db/seed/grand-paris-communes.csv?raw";
import outlines from "../../../db/seed/grand-paris-contours.geojson?raw";
import regions from "../../../db/seed/ile-de-france-departements.geojson?raw";
import parisQuartiers from "../../../db/seed/paris-quartiers.json?raw";
import { seededZones } from "./zone-seeds";

const communes = metropoleOf(list);
const contours = contoursOf(JSON.parse(outlines), communes.map((commune) => commune.code));
const zones = new Map(seededZones.map((row) => [row.code, row.zone]));
const quartiers = quartiersOf(JSON.parse(parisQuartiers));
const territoryOf = new Map(communes.map((commune) => [commune.code, commune.territory]));

const drawing = grandParisDrawing({
    arrondissements: Array.from({ length: 20 }, (_, index) => index + 1).map((number) => ({
        number,
        slug: `paris-${number === 1 ? "1er" : `${number}e`}`,
        rings: outlineOf(quartiers.filter((quartier) => arrondissementOf(quartier.number) === number)),
    })),
    communes: contours.filter((contour) => contour.code !== "75056").map((contour) =>
    {
        const territory = territoryOf.get(contour.code);
        return { ...contour, territory: territory === "est-ensemble" || territory === "plaine-commune" ? territory : null, zone: zones.get(contour.code)! };
    }),
    paris: outlineOf(quartiers),
    parisZone: zones.get("75056")!,
    parisContour: contours.find((contour) => contour.code === "75056")!.rings,
    departments: contoursOf(JSON.parse(regions)),
}, 0.7);

test("the Grand Paris is drawn as 20 arrondissements, 17 communes of the two territories and 112 communes in grey", () =>
{
    const count = (group: string) => drawing.shapes.filter((shape) => shape.group === group).length;

    expect([count("paris"), count("est-ensemble"), count("plaine-commune"), count("plain")]).toEqual([20, 9, 8, 112]);
    expect(drawing.shapes.every((shape) => /^M[\d.,LMZ]+$/.test(shape.d))).toBe(true);
});

test("each shape leads to the page that says more, and each grey commune carries its zone", () =>
{
    const find = (name: string) => drawing.shapes.find((shape) => shape.name === name);

    expect(find("Paris 11e")).toMatchObject({ page: "arrondissements/paris-11e/", code: "75056", zone: "very-tense" });
    expect(find("Montreuil")).toMatchObject({ page: "grand-paris/est-ensemble/", code: "93048" });
    expect(find("Saint-Denis")?.page).toBe("grand-paris/plaine-commune/");
    expect(find("Vincennes")).toMatchObject({ page: "grand-paris/", zone: "very-tense" });
    expect(find("Argenteuil")).toMatchObject({ kind: "plain", zone: "tense" });
    expect(drawing.shapes.every((shape) => shape.zone !== undefined && /^\d[\dAB]\d{3}$/.test(shape.code ?? ""))).toBe(true);
});

test("the drawing fits its frame, with the territories named on it and the small map of the region", () =>
{
    const numbers = drawing.shapes.flatMap((shape) => [...shape.d.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(([, x, y]) => [Number(x), Number(y)] as const));

    expect(numbers.every(([x, y]) => x >= 0 && x <= drawing.width && y >= 0 && y <= drawing.height)).toBe(true);
    expect(drawing.labels.filter((label) => label.kind === "territory").map((label) => label.text)).toEqual(["Paris", "Plaine Commune", "Est Ensemble"]);
    expect(drawing.borders).not.toBe("");
    expect(drawing.inset?.frame).toMatch(/^M.*Z$/);
});

test("simplifying keeps the ends of a line and drops the points that add nothing", () =>
{
    expect(simplified([[0, 0], [1, 0.01], [2, 0], [3, 5]], 0.5)).toEqual([[0, 0], [2, 0], [3, 5]]);
    expect(pathOf([[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]], ([x, y]) => [x! * 10, y! * 10], 0.5)).toBe("M0,0L10,0L10,10L0,10L0,0Z");
});

test("a kilometre is as long east-west as north-south, whatever the latitude", () =>
{
    const project = projectionOf([[[2, 48], [3, 48], [3, 49], [2, 49], [2, 48]]], 1000, 1000, 0);
    const [[x0, y0], [x1], [, y2]] = [project([2, 48]), project([3, 48]), project([2, 49])];

    expect((x1 - x0) / (y0 - y2)).toBeCloseTo(Math.cos(48.5 * Math.PI / 180), 5);
});

test("only the sides two groups share are drawn as a border", () =>
{
    const square = (x: number): [number, number][][] => [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]];
    const areas = [{ group: "92", rings: square(0) }, { group: "75", rings: square(1) }, { group: "75", rings: square(2) }];

    expect(sharedSides(areas, (area) => area.group, ([x, y]) => [x!, y!])).toBe("M1,1L1,0");
});
