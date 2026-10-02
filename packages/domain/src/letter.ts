import type { Check, Claim } from "./cap.js";
import { addMonths, type Day } from "./day.js";
import { euros, frenchDay, squareMetres } from "./format.js";
import { letting, periods, rooms } from "./labels.js";
import type { Contest } from "./rates.js";

export type Ground = "excess" | "unstated" | "complement";

export interface Demand
{
    ground: Ground;
    paragraphs: string[];
}

export interface Letter
{
    kind: "letter";
    sender: string[];
    recipient: string[];
    dated: string;
    delivery: string;
    subject: string;
    greeting: string;
    opening: string[];
    demands: Demand[];
    closing: string[];
    signature: string;
    writtenOn: Day;
    caution: Contest | null;
}

export interface NothingToClaim
{
    kind: "nothing-to-claim";
}

export interface LetterInput
{
    check: Check;
    claim: Claim;
    address: string;
    quartier: string;
    stated: boolean;  // the lease itself states the reference rent and the majored reference rent
}

const law = "l'article 140 de la loi n° 2018-1021 du 23 novembre 2018";

export function letter(input: LetterInput): Letter | NothingToClaim
{
    const demands = [excess(input), unstated(input), complement(input)].filter((demand) => demand !== null);
    if (demands.length === 0)
    {
        return { kind: "nothing-to-claim" };
    }

    return {
        kind: "letter",
        sender: ["[Votre prénom et nom]", input.address],
        recipient: ["[Nom du propriétaire]", "[Adresse du propriétaire]"],
        dated: `Paris, le ${frenchDay(input.claim.on)}`,
        delivery: "Lettre recommandée avec accusé de réception",
        subject: "Objet\u00A0: mise en demeure au sujet du loyer de mon logement",
        greeting: "Madame, Monsieur,",
        opening: opening(input),
        demands,
        closing: [
            "Je vous remercie de me répondre dans un délai d'un mois à compter de la réception de cette lettre. À défaut "
                + "de réponse ou d'accord, je me réserve la possibilité de saisir la commission départementale de "
                + "conciliation ou le juge compétent.",
            "Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.",
        ],
        signature: "[Signature]",
        writtenOn: input.claim.on,
        caution: input.check.rate.decree.contest,
    };
}

export function letterText(letter: Letter): string
{
    const demands = letter.demands.map((demand, index) => `${index + 1}. ${demand.paragraphs.join("\n\n")}`);
    const blocks = [
        letter.sender.join("\n"),
        letter.recipient.join("\n"),
        letter.dated,
        `${letter.subject}\n${letter.delivery}`,
        letter.greeting,
        ...letter.opening,
        ...demands,
        ...letter.closing,
        letter.signature,
    ];

    return blocks.join("\n\n") + "\n";
}

function opening({ check, claim, address, quartier }: LetterInput): string[]
{
    const { flat, reference, majored, decree } = check.rate;
    const at = /^\d/.test(address) ? "au " : "";
    const effect = claim.startsOn === claim.signedOn ? "le même jour" : `le ${frenchDay(claim.startsOn)}`;

    return [
        `Vous me louez le logement situé ${at}${postal(address)}, dans le quartier ${quartier}. Il s'agit d'un logement de `
            + `${rooms[flat.rooms]}, ${letting(flat.furnished)}, dans un immeuble construit ${periods[flat.period]}, `
            + `d'une surface habitable de ${squareMetres(claim.surface)}. Le bail a été signé le ${frenchDay(claim.signedOn)} `
            + `et a pris effet ${effect}.`,
        `Ce logement est soumis à l'encadrement des loyers prévu par ${law}. Pour cette catégorie de logement, le loyer `
            + `de référence est de ${euros(reference)} par m² et le loyer de référence majoré de ${euros(majored)} par m² `
            + `(${decree.title}, applicable à la date de signature du bail). Le loyer de base ne peut donc pas dépasser `
            + `${euros(majored)} × ${squareMetres(claim.surface)}, soit ${euros(check.cap)} par mois.`,
    ];
}

// The geocoder writes 4 Place du Louvre 75001 Paris; a French letter sets the postcode apart with a comma.
function postal(address: string): string
{
    return address.replace(/ (\d{5}) /, ", $1 ");
}

function excess({ check, claim }: LetterInput): Demand | null
{
    if (check.excess === 0)
    {
        return null;
    }

    const lower = `En application de l'article 140, III, A de la même loi, je vous demande de ramener le loyer de base à `
        + `${euros(check.cap)} par mois à compter de la prochaine échéance.`;
    const paragraphs = [`Le loyer de base prévu au bail, ${euros(claim.rent)} par mois, dépasse ce plafond de ${euros(check.excess)}.`];
    if (check.recoverable === 0)
    {
        return { ground: "excess", paragraphs: [...paragraphs, lower] };
    }

    const span = check.recoverable < check.sinceStart
        ? "pour les trois dernières années, le remboursement ne pouvant remonter plus loin"
        : `pour les ${check.months} mois complets écoulés depuis le ${frenchDay(claim.startsOn)}`;
    const refund = `Je vous demande également de me rembourser le loyer perçu au-delà du plafond, soit ${euros(check.recoverable)} ${span}.`;

    return { ground: "excess", paragraphs: [...paragraphs, `${lower} ${refund}`] };
}

// Article 140, V: a lease that leaves out the reference rents can be put right within a month of taking effect.
function unstated({ check, claim, stated }: LetterInput): Demand | null
{
    if (stated || claim.on > addMonths(claim.startsOn, 1))
    {
        return null;
    }

    return {
        ground: "unstated",
        paragraphs: [
            "Le bail ne mentionne pas le loyer de référence et le loyer de référence majoré applicables à ce logement. "
                + "En application de l'article 140, V de la même loi, je vous demande de porter ces montants au bail, "
                + `soit ${euros(check.rate.reference)} par m² pour le loyer de référence et ${euros(check.rate.majored)} `
                + "par m² pour le loyer de référence majoré.",
        ],
    };
}

function complement({ check, claim }: LetterInput): Demand | null
{
    if (check.complement === null || claim.on > check.complement.contestUntil)
    {
        return null;
    }

    return {
        ground: "complement",
        paragraphs: [
            `Le bail prévoit en outre un complément de loyer de ${euros(check.complement.amount)} par mois. Selon `
                + "l'article 140, III, B de la même loi, un complément de loyer ne peut s'appliquer qu'à un logement "
                + "présentant des caractéristiques de localisation ou de confort exceptionnelles par comparaison avec les "
                + "logements de la même catégorie situés dans le même secteur géographique.",
            "Je conteste ce complément de loyer et vous demande de me communiquer les éléments qui le justifient. À défaut "
                + "d'accord, je saisirai la commission départementale de conciliation au plus tard le "
                + `${frenchDay(check.complement.contestUntil)}, comme la loi le prévoit.`,
        ],
    };
}
