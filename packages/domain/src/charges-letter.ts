import type { ChargesCheck, Regularisation } from "./charges.js";
import type { Day } from "./day.js";
import { euros, frenchDay } from "./format.js";
import { framed, postal, type Demand, type Letter, type NothingToClaim } from "./letter.js";

export interface ChargesLetterInput
{
    regularised: Regularisation;
    check: ChargesCheck;
    address: string;
    on: Day;
}

const law = "la loi n° 89-462 du 6 juillet 1989";

export function chargesLetter({ regularised, check, address, on }: ChargesLetterInput): Letter | NothingToClaim
{
    const spread = check.twelfths && check.balance > 0;
    if (check.wrong === 0 && !spread)
    {
        return { kind: "nothing-to-claim" };
    }

    const at = /^\d/.test(address) ? "au " : "";
    const demands: Demand[] = [
        ...(check.wrong > 0 ? [wrongly(regularised, check)] : []),
        ...(spread ? [twelfths(regularised, check)] : []),
        {
            ground: "proofs",
            paragraphs: [
                "Je vous demande également de tenir à ma disposition les pièces justificatives de ces charges, que l'article 23 de "
                    + `${law} me permet de consulter jusqu'au ${frenchDay(check.proofsUntil)}.`,
            ],
        },
    ];

    return framed({
        address,
        on,
        subject: `contestation de la régularisation des charges de ${regularised.year}`,
        opening: [
            `Vous me louez le logement situé ${at}${postal(address)}. J'ai reçu le ${frenchDay(regularised.receivedOn)} la régularisation `
                + `des charges de l'année ${regularised.year}, qui s'élève à ${euros(check.billed)} pour ${euros(check.provisions)} de `
                + "provisions versées.",
        ],
        demands,
        reminders: [],
        caution: null,
    });
}

function wrongly(regularised: Regularisation, check: ChargesCheck): Demand
{
    const lines = check.lines
        .filter((line) => line.allowed < line.billed)
        .map((line) => `${line.kind.name}\u00A0: ${euros(line.billed - line.allowed)}`)
        .join("\u202F; ");
    const refund = check.balance < 0 ? ` et de me rembourser ${euros(-check.balance)}, versés en trop au titre des provisions` : "";

    return {
        ground: "charges",
        paragraphs: [
            `Les sommes suivantes, soit ${euros(check.wrong)} au total, ne font pas partie des charges que le décret n° 87-713 du `
                + `26 août 1987 permet de récupérer auprès du locataire, en tout ou en partie\u00A0: ${lines}.`,
            `Par la présente, je vous mets en demeure de retirer ces sommes de la régularisation${refund}.`,
        ],
    };
}

function twelfths(regularised: Regularisation, check: ChargesCheck): Demand
{
    return {
        ground: "twelfths",
        paragraphs: [
            `Cette régularisation m'étant parvenue après la fin de l'année ${regularised.year + 1}, je réglerai le solde de `
                + `${euros(check.balance)} en douze mensualités, comme le permet l'article 23 de ${law}.`,
        ],
    };
}
