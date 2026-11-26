import type { Claim, LawPeriod, Rate } from "@plafond/domain";

import type { MapName } from "../components/HomeMap";
import type { Drawing } from "../lib/home-map";

// The 2025 rate for St-Germain-l'Auxerrois, three rooms, 1946-1970, furnished, as the City's table publishes it.
export const rate: Rate = {
    flat: { city: "paris", quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
    reference: 2670,
    majored: 3200,
    minored: 1870,
    decree: {
        title: "Arrêté préfectoral n° 2025-06-16-00003",
        url: "https://example.org/decree",
        from: "2025-07-01",
        until: "2026-07-01",
        contest: null,
    },
};

export const claim: Claim = {
    flat: rate.flat,
    surface: 4000,
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    rent: 150000,
    complement: 0,
    on: "2026-09-29",
};

export const law: LawPeriod[] = [
    { from: "2018-11-24", until: "2026-11-25", title: "Article 140 de la loi n° 2018-1021 du 23 novembre 2018", url: "https://example.org/law" },
];

// Two small maps for the first screen: one arrondissement, one commune of a territory and one without reference rents.
export const homeMaps: Record<MapName, Drawing> = {
    "grand-paris": {
        width: 600,
        height: 640,
        shapes: [
            { name: "Paris 11e", d: "M10,10L20,10L20,20Z", kind: "capped", group: "paris", page: "arrondissements/paris-11e/", code: "75056", zone: "very-tense", tense: true },
            { name: "Montreuil", d: "M30,10L40,10L40,20Z", kind: "capped", group: "est-ensemble", page: "grand-paris/est-ensemble/", code: "93048", zone: "very-tense", tense: true },
            { name: "Vincennes", d: "M50,10L60,10L60,20Z", kind: "plain", group: "plain", page: "grand-paris/", code: "94080", zone: "very-tense", tense: true },
        ],
        borders: "M0,0L5,5",
        outline: "M0,0L600,0L600,640Z",
        city: "M10,10L20,10L20,20Z",
        labels: [{ text: "Paris", x: 15, y: 15, kind: "territory" }],
        inset: { width: 120, height: 100, regions: "M0,0L120,0L120,100Z", frame: "M50,50L60,50L60,60Z" },
    },
    lyon: {
        width: 600,
        height: 640,
        shapes: [
            { name: "Lyon 3e", d: "M10,10L20,10L20,20Z", kind: "capped", group: "lyon", page: "lyon/lyon-3e-arrondissement/" },
            { name: "Quincieux", d: "M50,10L60,10L60,20Z", kind: "plain", group: "plain", page: "ailleurs/", zone: "other" },
        ],
        borders: "",
        outline: "",
        city: "M10,10L20,10L20,20Z",
        labels: [{ text: "3e", x: 15, y: 15, kind: "area" }],
    },
};
