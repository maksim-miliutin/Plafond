import type { City } from "@plafond/domain";

// The geocoder's commune codes: Paris arrondissements start with 751; the rent check takes only Lyon and Villeurbanne besides.
export function cityOf(citycode: string): City
{
    return citycode.startsWith("751") ? "paris" : "lyon";
}
