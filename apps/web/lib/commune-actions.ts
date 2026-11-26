// What a tenant can check from a commune, the same on the map and in both searches: the notice and agency fee forms open
// with its zone filled in, the reletting check with the commune chosen, and the rent cap check where a decree caps the rent.
export interface CommuneAction
{
    href: string;
    label: string;
}

export interface CommuneReach
{
    capped: boolean;  // a decree caps the rent with reference rents
    tense: boolean;  // in part 1 of the list, where the decree on reletting rents applies
}

// The notice and agency fee forms take any commune of the region: outside the tense zone the tenant still gives the
// other reasons for a shorter notice, and the fees have a zone everywhere.
export function communeActions(code: string, { capped, tense }: CommuneReach, base: string): CommuneAction[]
{
    return [
        ...(capped ? [{ href: `${base}loyer/`, label: "Vérifier le plafond du loyer" }] : []),
        { href: `${base}preavis/?commune=${code}`, label: "Vérifier mon préavis" },
        { href: `${base}frais-agence/?commune=${code}`, label: "Vérifier les frais d'agence" },
        ...(tense ? [{ href: `${base}relocation/?commune=${code}`, label: "Vérifier la hausse du loyer à la relocation" }] : []),
    ];
}
