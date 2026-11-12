import type { Day } from "./day.js";

// Loi n° 2022-1158 du 16 août 2022, article 13, completing article 140, III, B of loi n° 2018-1021: in a lease signed
// from this day, no complement may be applied to a flat that shows any of these.
export const noComplementFrom: Day = "2022-08-18";

const bars: readonly string[] = [
    "des sanitaires sur le palier",
    "des signes d'humidité sur certains murs",
    "un diagnostic de performance énergétique de classe F ou G",
    "des fenêtres laissant anormalement passer l'air hors grille de ventilation",
    "un vis-à-vis à moins de dix mètres",
    "des infiltrations ou des inondations provenant de l'extérieur du logement",
    "des problèmes d'évacuation d'eau au cours des trois derniers mois",
    "une installation électrique dégradée",
    "une mauvaise exposition de la pièce principale",
];

export function complementBars(signedOn: Day): readonly string[]
{
    if (signedOn < noComplementFrom)
    {
        return [];
    }

    return bars;
}
