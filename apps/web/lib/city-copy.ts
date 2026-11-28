import type { City } from "@plafond/domain";

import { grandParisMapLabel } from "./metropole";

export interface CityCopy
{
    name: string;
    within: string;
    mapLabel: string;
    rentReach: string;
    linksTitle: string;
    otherGuide: string;
    neighbours: string;
}

export const territories = {
    label: "Les territoires où les loyers sont encadrés",
    href: "https://www.anil.org/aj-experimentation-encadrement-niveau-loyers-zones-tendues/",
};

// The neighbours lines follow the prefecture's press release of 3 June 2025 and the Métropole de Lyon's of 3 September 2021.
// The cities with a page and a map of their own; the territories around Paris are reached through the Grand Paris page.
export type MappedCity = Extract<City, "paris" | "lyon">;

export const cityCopy: Record<MappedCity, CityCopy> = {
    paris: {
        name: "Paris",
        within: "dans les 20 arrondissements de Paris.",
        mapLabel: grandParisMapLabel,
        rentReach: "Dans les 20 arrondissements, avec l'encadrement des loyers.",
        linksTitle: "Les loyers de référence par arrondissement",
        otherGuide: "encadrement-des-loyers-lyon",
        neighbours: "Est Ensemble et Plaine Commune, à l'est et au nord de Paris, ont leurs propres loyers de référence, que Plafond vérifie aussi.",
    },
    lyon: {
        name: "Lyon et Villeurbanne",
        within: "dans les 9 arrondissements de Lyon et à Villeurbanne, à l'intérieur des limites tracées sur le plan.",
        mapLabel: "Plan de Lyon et Villeurbanne avec les limites de l'encadrement des loyers",
        rentReach: "À Lyon et Villeurbanne, avec l'encadrement des loyers.",
        linksTitle: "Les loyers de référence par commune",
        otherGuide: "encadrement-des-loyers-paris",
        neighbours: "Dans la Métropole de Lyon, seules Lyon et Villeurbanne ont des loyers de référence.",
    },
};
