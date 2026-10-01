import { expect, test } from "vitest";

import { quartierAt } from "@plafond/domain";

import seed from "../../../db/seed/paris-quartiers.json" with { type: "json" };
import { QuartiersError, quartiersOf } from "../src/quartiers.js";

const square: [number, number][] = [[2.34, 48.86], [2.345, 48.86], [2.345, 48.863], [2.34, 48.863], [2.34, 48.86]];

function feature(number: number | string, geometry: unknown, arrondissement = Math.ceil(Number(number) / 4)): unknown
{
    return { type: "Feature", properties: { c_qu: String(number), l_qu: `Q${number}`, c_ar: arrondissement }, geometry };
}

function collection(features: unknown[]): unknown
{
    return { type: "FeatureCollection", features };
}

function all(make: (number: number) => unknown = (n) => feature(n, { type: "Polygon", coordinates: [square] })): unknown[]
{
    return Array.from({ length: 80 }, (_, i) => make(i + 1));
}

test("the published outlines give eighty quartiers, numbered 1 to 80 and named", () =>
{
    const quartiers = quartiersOf(seed);

    expect(quartiers.map((q) => q.number)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    expect(quartiers[0]!.name).toBe("Saint-Germain-l'Auxerrois");
    expect(quartiers[3]!.name).toBe("Place-Vendôme");
});

// Places whose quartier is known without our code: the check of the outlines does not lean on itself.
test("landmarks fall in the quartier everyone knows them by", () =>
{
    const quartiers = quartiersOf(seed);
    const landmarks: [string, number, number, number][] = [
        ["Louvre", 2.3376, 48.8606, 1],
        ["Place Vendôme", 2.3294, 48.8675, 4],
        ["Notre-Dame", 2.3499, 48.853, 16],
        ["Tour Eiffel", 2.2945, 48.8584, 28],
        ["Sacré-Cœur", 2.3431, 48.8867, 70],
    ];

    for (const [name, lon, lat, number] of landmarks)
    {
        expect(quartierAt({ lon, lat }, quartiers), name).toEqual({ kind: "found", quartier: number });
    }
});

test("coordinates keep six decimals, a tenth of a metre in Paris", () =>
{
    const fine = [[2.3369886672065507, 48.852901959413856], [2.4, 48.85], [2.4, 48.9], [2.3369886672065507, 48.852901959413856]];
    const quartiers = quartiersOf(collection(all((n) => feature(n, { type: "Polygon", coordinates: [n === 1 ? fine : square] }))));

    expect(quartiers[0]!.rings[0]![0]).toEqual([2.336989, 48.852902]);
});

test("a quartier in several pieces keeps the rings of every piece", () =>
{
    const twice = { type: "MultiPolygon", coordinates: [[square], [square.map(([x, y]) => [x + 0.01, y])]] };
    const quartiers = quartiersOf(collection(all((n) => feature(n, n === 7 ? twice : { type: "Polygon", coordinates: [square] }))));

    expect(quartiers[6]!.rings).toHaveLength(2);
});

test("a table that is not the eighty quartiers is a breakage", () =>
{
    const polygon = { type: "Polygon", coordinates: [square] };

    expect(() => quartiersOf(null)).toThrow(QuartiersError);
    expect(() => quartiersOf(collection(all().slice(1)))).toThrow(QuartiersError);
    expect(() => quartiersOf(collection([...all().slice(1), feature(2, polygon)]))).toThrow(/2/);
    expect(() => quartiersOf(collection([...all().slice(1), feature(81, polygon)]))).toThrow(QuartiersError);
    expect(() => quartiersOf(collection([...all().slice(1), feature(1, { type: "Point", coordinates: [2.3, 48.8] })]))).toThrow(QuartiersError);
    expect(() => quartiersOf(collection([...all().slice(1), feature(1, { type: "Polygon", coordinates: [[["a", 48]]] })]))).toThrow(QuartiersError);
});

// arrondissementOf counts four quartiers to an arrondissement; the outlines carry their own arrondissement to hold it to.
test("a quartier filed under another arrondissement than four to each would give is a breakage", () =>
{
    const polygon = { type: "Polygon", coordinates: [square] };

    expect(() => quartiersOf(collection([...all().slice(1), feature(1, polygon, 2)]))).toThrow(/arrondissement/);
});
