import { estEnsemble } from "@plafond/address";
import type { City } from "@plafond/domain";

// The geocoder's commune codes: Paris arrondissements start with 751, Est Ensemble names nine communes, and the rent
// check takes only Lyon and Villeurbanne besides.
export function cityOf(citycode: string): City
{
    if (citycode.startsWith("751"))
    {
        return "paris";
    }

    return estEnsemble.includes(citycode) ? "est-ensemble" : "lyon";
}
