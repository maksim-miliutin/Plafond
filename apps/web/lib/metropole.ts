import type { MetropoleCommune, Territory } from "@plafond/import";

// The territories around Paris whose rents a decree caps.
export type Outer = Exclude<Territory, "paris">;

// Those whose leases Plafond checks, as Paris; tenants in the others are sent to the prefecture's own simulator.
export const checkedTerritories: readonly Outer[] = [];

export const territoryNames: Record<Outer, string> = {
    "est-ensemble": "Est Ensemble",
    "plaine-commune": "Plaine Commune",
};

// Service Public's pages for the simulator of the DRIHL, which prices a lease in each territory from its address.
export const simulators: Record<Outer, string> = {
    "est-ensemble": "https://www.service-public.gouv.fr/particuliers/vosdroits/R61539",
    "plaine-commune": "https://www.service-public.gouv.fr/particuliers/vosdroits/R59027",
};

// Service Public's simulator tells, commune by commune, whether the rents are capped and whether their rise is limited.
export const applicability = "https://www.service-public.gouv.fr/simulateur/calcul/encadrementDesLoyers";

export type Reach = { kind: "checked" } | { kind: "capped"; territory: Outer } | { kind: "uncapped" };

export function reachOf(commune: MetropoleCommune, checked: readonly Outer[] = checkedTerritories): Reach
{
    const territory = commune.territory;
    if (territory === null)
    {
        return { kind: "uncapped" };
    }

    if (territory === "paris" || checked.includes(territory))
    {
        return { kind: "checked" };
    }

    return { kind: "capped", territory };
}

// Names are compared without accents, case, spaces, hyphens or apostrophes, so "lile saint denis" and "l'ile-saint-denis"
// both find L'Île-Saint-Denis, and a former commune finds the one it joined.
export function searchKey(text: string): string
{
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "");
}

// Tenants know their postal code, not the INSEE code the list holds, so digits find nothing and are asked for a name.
export function isNumber(typed: string): boolean
{
    return /^\s*\d[\d\s]*$/.test(typed);
}

export function matching(communes: readonly MetropoleCommune[], typed: string): MetropoleCommune[]
{
    const key = searchKey(typed);
    if (key === "")
    {
        return [...communes];
    }

    if (isNumber(typed))
    {
        return [];
    }

    return communes.filter((commune) => [commune.name, ...commune.former].some((name) => searchKey(name).includes(key)));
}
