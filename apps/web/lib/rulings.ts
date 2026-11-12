import type { Day } from "@plafond/domain";

export interface Ruling
{
    held: "accepted" | "rejected";
    what: string;
    court: string;
    on: Day;
    number: string;
}

export const rulings: readonly Ruling[] = [
    {
        held: "accepted",
        what: "La clarté et le calme d'un studio en étage élevé, parce qu'ils tenaient à l'étage et non au quartier.",
        court: "Cour de cassation, 3e chambre civile",
        on: "2025-12-04",
        number: "n°\u00A024-17.930",
    },
    {
        held: "accepted",
        what: "Une vue dégagée, depuis le quatrième étage, sur une église toute proche classée monument historique.",
        court: "Cour de cassation, 3e chambre civile",
        on: "2025-12-04",
        number: "n°\u00A024-15.589",
    },
    {
        held: "rejected",
        what: "La proximité du métro et des commerces, courante à Paris et déjà prise en compte par le loyer de référence.",
        court: "Tribunal judiciaire de Paris",
        on: "2026-02-26",
        number: "RG n°\u00A025/05963",
    },
    {
        held: "rejected",
        what: "Le calme d'une rue à sens unique, des poutres apparentes, une cuisine équipée et le double vitrage, qui n'ont rien de rare.",
        court: "Tribunal judiciaire de Paris",
        on: "2026-02-26",
        number: "RG n°\u00A025/05963",
    },
    {
        held: "rejected",
        what: "Des annonces de logements comparables, qui ne montrent que des prix demandés.",
        court: "Tribunal judiciaire de Paris",
        on: "2026-02-26",
        number: "RG n°\u00A025/05963",
    },
];
