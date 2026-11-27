/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { contoursOf } from "@plafond/import";

import { zoneSentenceOf } from "../components/HomeMap";
import { regionDrawing } from "../lib/home-map";
import { metropole, regionCommunes } from "./zone-seeds";

import outlines from "../../../db/seed/ile-de-france-communes.geojson?raw";

const contours = contoursOf(JSON.parse(outlines), regionCommunes.map((commune) => commune.code));
const drawing = regionDrawing(contours, regionCommunes, metropole, 0.8);
const find = (code: string) => drawing.shapes.find((shape) => shape.code === code);

test("the plan of the region draws each of its 1 266 communes once, from the outlines delivered with the zones", () =>
{
    expect(contours).toHaveLength(1266);
    expect(drawing.shapes).toHaveLength(1266);
    expect(new Set(drawing.shapes.map((shape) => shape.code)).size).toBe(1266);
    expect(drawing.borders).not.toBe("");
});

// Part 1 of the list tints a commune without reference rents; the territories keep the colours of the Grand Paris plan.
test("each commune leads where its rules are: the rent cap in the three territories, the other checks elsewhere", () =>
{
    expect(find("75056")).toMatchObject({ name: "Paris", group: "paris", page: "paris/", department: "75" });
    expect(find("93048")).toMatchObject({ name: "Montreuil", group: "est-ensemble", page: "grand-paris/est-ensemble/" });
    expect(find("91377")).toMatchObject({ name: "Massy", group: "plain", page: "ailleurs/", zone: "tense", tense: true, tinted: true, department: "91" });
    expect(find("77022")).toMatchObject({ name: "Barbizon", zone: "tense", tense: false });
    expect(find("77022")?.tinted).toBeUndefined();
    expect(find("78043")).toMatchObject({ name: "Bailly", zone: "very-tense", tense: false });
});

test("the card says the notice keeps three months outside part 1, whatever zone the fees follow", () =>
{
    expect(zoneSentenceOf("tense", false)).toBe("Hors zone tendue pour le préavis : trois mois pour un logement vide, sauf autre motif. Les frais d'agence suivent le plafond de la zone tendue.");
    expect(zoneSentenceOf("very-tense", false)).toContain("plafond de la zone très tendue");
    expect(zoneSentenceOf("tense", true)).toMatch(/^Zone tendue : le préavis d'un logement vide est d'un mois/);
});
