import type { FeeZone } from "./agency.js";
import type { Period, Rooms } from "./rates.js";

export const rooms: Record<Rooms, string> = {
    1: "1 pièce",
    2: "2 pièces",
    3: "3 pièces",
    4: "4 pièces et plus",
};

export const periods: Record<Period, string> = {
    "before-1946": "avant 1946",
    "1946-1970": "entre 1946 et 1970",
    "1971-1990": "entre 1971 et 1990",
    "after-1990": "après 1990",
    "1991-2005": "entre 1991 et 2005",
    "after-2005": "après 2005",
};

// Where the flat lies, as a sentence goes on after "situé" or "par m²".
export const feeZones: Record<FeeZone, string> = {
    "very-tense": "en zone très tendue",
    tense: "en zone tendue",
    other: "hors zone tendue",
};

export function letting(furnished: boolean): string
{
    return furnished ? "loué meublé" : "loué vide";
}
