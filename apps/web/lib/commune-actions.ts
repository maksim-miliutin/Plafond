// What a tenant can check from a commune of the Grand Paris, the same on the map and in the list. Every commune is in the
// tense zone: the notice and agency fee forms open with its zone filled in, the reletting check with the commune chosen,
// and the rent cap check is offered where a decree caps the rent.
export interface CommuneAction
{
    href: string;
    label: string;
}

export function communeActions(code: string, capped: boolean, base: string): CommuneAction[]
{
    return [
        ...(capped ? [{ href: `${base}loyer/`, label: "Vérifier le plafond du loyer" }] : []),
        { href: `${base}preavis/?commune=${code}`, label: "Vérifier mon préavis" },
        { href: `${base}frais-agence/?commune=${code}`, label: "Vérifier les frais d'agence" },
        { href: `${base}relocation/?commune=${code}`, label: "Vérifier la hausse du loyer à la relocation" },
    ];
}
