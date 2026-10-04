export type Verdict = "recoverable" | "not-recoverable" | "caretaker";

export interface ChargeKind
{
    id: string;
    name: string;
    verdict: Verdict;
}

export type CaretakerCase = "both" | "one" | "employee";

// Décret n° 87-713 du 26 août 1987: its list of what a tenant may be charged is closed; anything it does not name stays the landlord's.
export const chargeKinds: readonly ChargeKind[] = [
    { id: "water", name: "Eau froide, eau chaude et assainissement", verdict: "recoverable" },
    { id: "heating", name: "Chauffage collectif\u00A0: combustible et entretien courant", verdict: "recoverable" },
    { id: "lift", name: "Ascenseur\u00A0: électricité, entretien courant et menues réparations", verdict: "recoverable" },
    { id: "common-power", name: "Électricité des parties communes", verdict: "recoverable" },
    { id: "cleaning", name: "Ménage et produits d'entretien des parties communes", verdict: "recoverable" },
    { id: "outdoors", name: "Espaces verts et espaces extérieurs", verdict: "recoverable" },
    { id: "hygiene", name: "Sacs poubelle, vide-ordures, désinsectisation", verdict: "recoverable" },
    { id: "equipment", name: "Entretien de l'interphone, de la porte automatique, de la ventilation", verdict: "recoverable" },
    { id: "waste-tax", name: "Taxe d'enlèvement des ordures ménagères, taxe de balayage", verdict: "recoverable" },
    { id: "caretaker", name: "Gardien ou employé d'immeuble", verdict: "caretaker" },
    { id: "manager-fees", name: "Honoraires du syndic, frais de gestion", verdict: "not-recoverable" },
    { id: "insurance", name: "Assurance de l'immeuble", verdict: "not-recoverable" },
    { id: "property-tax", name: "Taxe foncière", verdict: "not-recoverable" },
    { id: "works", name: "Gros travaux, ravalement, mise aux normes", verdict: "not-recoverable" },
    { id: "replacement", name: "Remplacement d'équipements\u00A0: chaudière, ascenseur, robinetterie", verdict: "not-recoverable" },
    { id: "legal-fees", name: "Frais d'avocat et de contentieux", verdict: "not-recoverable" },
];

export const caretakerShares: Record<CaretakerCase, number> = { both: 75, one: 40, employee: 100 };
