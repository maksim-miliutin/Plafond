import type { Deposit, DepositCheck } from "./deposit.js";
import { euros, frenchDay } from "./format.js";
import { framed, postal, type Demand, type Letter, type NothingToClaim } from "./letter.js";

export interface DepositLetterInput
{
    held: Deposit;
    check: DepositCheck;
    address: string;
}

const law = "article 22 de la loi n° 89-462 du 6 juillet 1989";

export function depositLetter({ held, check, address }: DepositLetterInput): Letter | NothingToClaim
{
    if (check.late === 0 || (check.owed === 0 && check.penalty === 0))
    {
        return { kind: "nothing-to-claim" };
    }

    const at = /^\d/.test(address) ? "au " : "";
    const left = check.conforming ? ", et l'état des lieux de sortie est conforme à celui d'entrée" : "";

    return framed({
        address,
        on: held.on,
        subject: "mise en demeure de restituer mon dépôt de garantie",
        opening: [
            `Vous m'avez loué le logement situé ${at}${postal(address)}. Je vous en ai remis les clés le ${frenchDay(held.keysOn)}${left}. `
                + `Le dépôt de garantie versé à la signature du bail s'élevait à ${euros(held.paid)}.`,
        ],
        demands: [claim(held, check)],
        reminders: [],
        caution: null,
    });
}

function claim(held: Deposit, check: DepositCheck): Demand
{
    const due = `La loi vous imposait de me le restituer au plus tard le ${frenchDay(check.deadline)} (${law}).`;
    const penalty = `${euros(check.penalty)}, soit 10\u00A0% du loyer mensuel hors charges pour chacune des ${check.late} périodes `
        + "mensuelles commencées en retard";
    const proof = "Si vous entendez conserver une partie de ce dépôt, je vous demande de me communiquer les justificatifs des sommes retenues.";

    if (check.owed === 0)
    {
        return {
            ground: "deposit",
            paragraphs: [
                `${due} Vous me l'avez restitué le ${frenchDay(held.returnedOn ?? held.on)}, après ce délai.`,
                `Par la présente, je vous mets en demeure de me verser la majoration de ${penalty}.`,
            ],
        };
    }

    const received = held.returned > 0 && held.returnedOn !== null
        ? `Vous ne m'en avez restitué que ${euros(held.returned)}, le ${frenchDay(held.returnedOn)}.`
        : "Je n'en ai rien reçu à ce jour.";
    const added = check.penaltyDue && check.penalty > 0 ? `, majorée de ${penalty}` : "";

    return {
        ground: "deposit",
        paragraphs: [
            `${due} ${received}`,
            `Par la présente, je vous mets en demeure de me restituer la somme de ${euros(check.owed)} restant due${added}.`,
            proof,
        ],
    };
}
