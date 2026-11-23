import type { Dwelling, Period, Rooms } from "@plafond/domain";

import type { Outer } from "./metropole";

export interface Example
{
    address: string;
    town: string;
    commune: string;  // INSEE code, to find the area the address lies in
    sector: number;
    dwelling: Dwelling;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
    surface: number;  // hundredths of a square metre
    signedOn: string;
    page: number;  // of the decree's PDF, where the rent is printed
}

export interface TerritoryCopy
{
    name: string;
    lead: string;
    example: Example;
    split: string;
    help: string;  // Service Public's page on the rent in the territory
}

// The example's address was placed in its sector by the DRIHL's simulator; the home is made up to show the sum.
export const territoryCopy: Record<Extract<Outer, "est-ensemble">, TerritoryCopy> = {
    "est-ensemble": {
        name: "Est Ensemble",
        lead: "Vous louez à Montreuil, à Pantin ou dans une autre commune d'Est Ensemble ? Plafond calcule gratuitement le plafond "
            + "de votre loyer de base selon l'adresse, les caractéristiques du logement et la date de signature du bail.",
        example: {
            address: "29 rue Parmentier",
            town: "Montreuil",
            commune: "93048",
            sector: 307,
            dwelling: "flat",
            rooms: 2,
            period: "1946-1970",
            furnished: false,
            surface: 4800,
            signedOn: "2026-07-15",
            page: 14,
        },
        split: "À Montreuil, deux logements comparables peuvent relever de secteurs différents : saisissez le numéro de rue pour que "
            + "Plafond trouve le bon barème.",
        help: "https://www.service-public.gouv.fr/particuliers/vosdroits/F36219",
    },
};
