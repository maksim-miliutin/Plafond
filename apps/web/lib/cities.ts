import { estEnsemble, plaineCommune } from "@plafond/address";
import type { City } from "@plafond/domain";

// The geocoder's commune codes: Paris arrondissements start with 751, Est Ensemble and Plaine Commune name their
// communes, and the rent check takes only Lyon and Villeurbanne besides.
export function cityOf(citycode: string): City
{
    if (citycode.startsWith("751"))
    {
        return "paris";
    }

    if (estEnsemble.includes(citycode))
    {
        return "est-ensemble";
    }

    return plaineCommune.includes(citycode) ? "plaine-commune" : "lyon";
}
