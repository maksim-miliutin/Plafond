import type { Day } from "./day.js";
import { frenchDay } from "./format.js";
import { framed, postal, type Letter } from "./letter.js";
import type { NoticeCheck } from "./notice.js";

export interface NoticeLetterInput
{
    check: NoticeCheck;
    address: string;
    on: Day;
}

const law = "loi n° 89-462 du 6 juillet 1989";

export function noticeLetter({ check, address, on }: NoticeLetterInput): Letter
{
    const at = /^\d/.test(address) ? "au " : "";

    return framed({
        address,
        on,
        subject: "congé du logement",
        opening: [`Je suis locataire du logement situé ${at}${postal(address)}. Par la présente, je vous donne congé de ce logement.`],
        demands: [],
        reminders: [
            `${length(check)} Il court à compter de la réception de cette lettre : je quitterai donc le logement au plus tard le `
                + `${frenchDay(check.endsOn)}.`,
            "Je vous propose de convenir ensemble de la date de l'état des lieux de sortie et de la remise des clés.",
            "Ma nouvelle adresse, à laquelle vous pourrez me restituer le dépôt de garantie : [Nouvelle adresse].",
        ],
        caution: null,
        answer: null,
    });
}

function length(check: NoticeCheck): string
{
    if (check.furnished)
    {
        return `Le logement étant loué meublé, le préavis est d'un mois (article 25-8 de la ${law}).`;
    }

    if (check.reason === null)
    {
        return `Le préavis est de trois mois (article 15 de la ${law}).`;
    }

    const proof = check.reason.proof === null ? "" : ` Vous trouverez ci-joint ${check.reason.proof}.`;

    return `Je bénéficie d'un préavis réduit à un mois (article 15 de la ${law}) pour le motif suivant : ${check.reason.motive}.${proof}`;
}
