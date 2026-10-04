import { addMonths, type Day } from "./day.js";
import { rounded } from "./money.js";

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

export interface ChargeLine
{
    kind: string;
    billed: number;
    caretaker?: CaretakerCase;
}

export interface Regularisation
{
    year: number;
    lines: ChargeLine[];
    provisions: number;
    receivedOn: Day;
}

export interface CheckedLine
{
    kind: ChargeKind;
    billed: number;
    allowed: number;
}

export interface ChargesCheck
{
    kind: "charges";
    lines: CheckedLine[];
    billed: number;
    allowed: number;
    wrong: number;
    provisions: number;
    balance: number;  // what may be charged less the advances: below zero, the landlord owes the tenant
    twelfths: boolean;
    proofsUntil: Day;
}

export class ChargesError extends Error
{
    constructor(problem: string)
    {
        super(`charges: ${problem}`);
        this.name = "ChargesError";
    }
}

export function charges(regularised: Regularisation): ChargesCheck
{
    const lines = regularised.lines.map(checked);
    const billed = lines.reduce((sum, line) => sum + line.billed, 0);
    const allowed = lines.reduce((sum, line) => sum + line.allowed, 0);

    return {
        kind: "charges",
        lines,
        billed,
        allowed,
        wrong: billed - allowed,
        provisions: regularised.provisions,
        balance: allowed - regularised.provisions,
        twelfths: regularised.receivedOn > `${regularised.year + 1}-12-31`,
        proofsUntil: addMonths(regularised.receivedOn, 6),
    };
}

function checked(line: ChargeLine): CheckedLine
{
    const kind = chargeKinds.find((known) => known.id === line.kind);
    if (kind === undefined)
    {
        throw new ChargesError(`no kind of charge is called ${line.kind}`);
    }

    if (kind.verdict === "caretaker" && line.caretaker === undefined)
    {
        throw new ChargesError("a caretaker's line needs to say which tasks the caretaker does");
    }

    const allowed = kind.verdict === "recoverable"
        ? line.billed
        : kind.verdict === "caretaker" ? rounded(line.billed * caretakerShares[line.caretaker!], 100) : 0;

    return { kind, billed: line.billed, allowed };
}
