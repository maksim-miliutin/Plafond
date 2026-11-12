import type { City } from "@plafond/domain";

export interface CityCopy
{
    name: string;
    within: string;
    mapLabel: string;
    rentReach: string;
    linksTitle: string;
    otherGuide: string;
    neighbours: string;
    door: string;
}

export const territories = {
    label: "Les territoires où les loyers sont encadrés",
    href: "https://www.anil.org/aj-experimentation-encadrement-niveau-loyers-zones-tendues/",
};

// The neighbours lines follow the prefecture's press release of 3 June 2025 and the Métropole de Lyon's of 3 September 2021.
export const cityCopy: Record<City, CityCopy> = {
    paris: {
        name: "Paris",
        within: "dans les 20 arrondissements, à l'intérieur de la limite tracée sur le plan.",
        mapLabel: "Plan de Paris avec la limite de l'encadrement des loyers",
        rentReach: "Dans les 20 arrondissements, avec l'encadrement des loyers.",
        linksTitle: "Les loyers de référence par arrondissement",
        otherGuide: "encadrement-des-loyers-lyon",
        neighbours: "Plaine Commune et Est Ensemble, au nord et à l'est de Paris, ont leurs propres loyers de référence, que Plafond ne vérifie pas.",
        door: "Les 20 arrondissements. Le plan de la zone et les sept vérifications.",
    },
    lyon: {
        name: "Lyon et Villeurbanne",
        within: "dans les 9 arrondissements de Lyon et à Villeurbanne, à l'intérieur des limites tracées sur le plan.",
        mapLabel: "Plan de Lyon et Villeurbanne avec les limites de l'encadrement des loyers",
        rentReach: "À Lyon et Villeurbanne, avec l'encadrement des loyers.",
        linksTitle: "Les loyers de référence par commune",
        otherGuide: "encadrement-des-loyers-paris",
        neighbours: "Dans la Métropole de Lyon, seules Lyon et Villeurbanne ont des loyers de référence.",
        door: "Les 9 arrondissements de Lyon et Villeurbanne. Le plan de la zone et les sept vérifications.",
    },
};
