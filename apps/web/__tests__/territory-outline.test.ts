/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { quartierAt } from "@plafond/domain";
import { contoursOf, metropoleOf } from "@plafond/import";

import { territoryOutline } from "../lib/metropole";

import list from "../../../db/seed/grand-paris-communes.csv?raw";
import outlines from "../../../db/seed/grand-paris-contours.geojson?raw";

const communes = metropoleOf(list);
const contours = contoursOf(JSON.parse(outlines), communes.map((commune) => commune.code));
const drawn = (territory: "est-ensemble" | "plaine-commune") => [{ number: 1, name: territory, rings: territoryOutline(territory, communes, contours) }];

// Points from real addresses the geocoder placed: 29 rue Parmentier in Montreuil, the basilica of Saint-Denis, Vincennes.
const montreuil = { lon: 2.434058, lat: 48.859669 };
const saintDenis = { lon: 2.3597, lat: 48.9356 };
const vincennes = { lon: 2.4393, lat: 48.8474 };

test("each territory around Paris is drawn as one outline, the union of its communes", () =>
{
    expect(territoryOutline("est-ensemble", communes, contours)).toHaveLength(1);
    expect(territoryOutline("plaine-commune", communes, contours)).toHaveLength(1);
});

test("the outline of Est Ensemble holds Montreuil and that of Plaine Commune Saint-Denis, and neither holds Vincennes", () =>
{
    expect(quartierAt(montreuil, drawn("est-ensemble")).kind).toBe("found");
    expect(quartierAt(saintDenis, drawn("plaine-commune")).kind).toBe("found");
    expect(quartierAt(montreuil, drawn("plaine-commune")).kind).toBe("outside");
    expect(quartierAt(vincennes, drawn("est-ensemble")).kind).toBe("outside");
});
