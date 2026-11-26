/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { outlineOf } from "@plafond/domain";
import { contoursOf, seedsFrom } from "@plafond/import";

import { feeZoneOn, tenseOn } from "../lib/commune-zone";
import { lyonDrawing } from "../lib/home-map";
import { lyonCommunes, seededLists, seededZones } from "./zone-seeds";

import outlines from "../../../db/seed/lyon-metropole-contours.geojson?raw";

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const { lyon } = seedsFrom((name) => files[`../../../db/seed/${name}`]!);
const zones = new Map(seededZones.map((row) => [row.code, row]));
const names = [...new Set(lyon.outlines.map((area) => area.name))];
const drawing = lyonDrawing({
    areas: names.map((name) =>
    {
        const code = name === "Villeurbanne" ? "69266" : "69123";
        return { name, slug: "", rings: outlineOf(lyon.outlines.filter((area) => area.name === name)), code, zone: zones.get(code)!.zone, tense: zones.get(code)!.tense };
    }),
    communes: contoursOf(JSON.parse(outlines))
        .filter((contour) => contour.code !== "69123" && contour.code !== "69266")
        .map((contour) => ({ ...contour, zone: zones.get(contour.code)!.zone, tense: zones.get(contour.code)!.tense })),
}, 0.7);
const find = (name: string) => drawing.shapes.find((shape) => shape.name === name);

// The Métropole de Lyon has its own zones now: every shape of the plan carries its code and its place on the list.
test("on the Lyon plan, every arrondissement, Villeurbanne and each commune around carry their code and zones", () =>
{
    expect(find("Lyon 3e")).toMatchObject({ code: "69123", zone: "tense", tense: true });
    expect(find("Villeurbanne")).toMatchObject({ code: "69266", zone: "tense", tense: true });
    expect(drawing.shapes.every((shape) => /^69\d{3}$/.test(shape.code ?? "") && shape.tense !== undefined)).toBe(true);
});

test("a link names a commune of the Métropole de Lyon, and its zones follow the lists back to 2013", () =>
{
    const named = (code: string) => lyonCommunes.find((commune) => commune.code === code)!;

    expect(feeZoneOn(named("69123"), "2026-11-25", seededLists)).toBe("tense");
    expect(tenseOn(named("69123"), "2016-01-01", seededLists)).toBe(true);
    expect([feeZoneOn(named("69279"), "2026-11-25", seededLists), tenseOn(named("69279"), "2026-11-25", seededLists)]).toEqual(["other", false]);
});
