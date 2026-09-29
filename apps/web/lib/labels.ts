import type { Period, Rooms } from "@plafond/domain";

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
};
