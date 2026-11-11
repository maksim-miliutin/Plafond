import type { AgencyFees, FeesCheck, FeeZone, NoCaps } from "./agency.js";
import type { Day } from "./day.js";
import { euros, frenchDay, squareMetres } from "./format.js";
import { framed, postal, type Letter, type NothingToClaim } from "./letter.js";

export interface AgencyLetterInput
{
    paid: AgencyFees;
    check: FeesCheck | NoCaps;
    address: string;
    on: Day;
}

const places: Record<FeeZone, string> = { "very-tense": "en zone très tendue", tense: "en zone tendue", other: "hors zone tendue" };

export function agencyLetter({ paid, check, address, on }: AgencyLetterInput): Letter | NothingToClaim
{
    if (check.kind === "no-caps" || check.excess === 0)
    {
        return { kind: "nothing-to-claim" };
    }

    const at = /^\d/.test(address) ? "au " : "";

    return framed({
        address,
        on,
        to: ["[Nom de l'agence]", "[Adresse de l'agence]"],
        subject: "remboursement d'honoraires de location",
        opening: [
            `Par un bail signé le ${frenchDay(paid.signedOn)}, votre agence m'a loué, pour le compte du propriétaire, le logement situé `
                + `${at}${postal(address)}, d'une surface habitable de ${squareMetres(paid.surface)}.`,
        ],
        demands: [{ ground: "fees", paragraphs: [...parts(paid, check), claim(check)] }],
        reminders: ["La part des honoraires facturée au locataire ne peut pas non plus dépasser celle facturée au propriétaire."],
        answer: "Je vous remercie de procéder à ce remboursement dans un délai d'un mois à compter de la réception de cette lettre. "
            + "À défaut, je me réserve la possibilité de signaler ce manquement à la DGCCRF et de saisir le juge compétent.",
        caution: null,
    });
}

function parts(paid: AgencyFees, check: FeesCheck): string[]
{
    const where = check.assumed ? "Même en zone très tendue, où le plafond est le plus élevé," : `Pour un logement situé ${places[check.zone]},`;
    const letting = `Pour la visite, la constitution de mon dossier et la rédaction du bail, vous m'avez facturé ${euros(paid.letting)}. `
        + `${where} ces honoraires ne peuvent pas dépasser ${euros(check.caps.letting[check.zone])} par m² de surface habitable, `
        + `soit ${euros(check.lettingCap)} pour ce logement.`;
    const inspection = `Pour l'état des lieux d'entrée, vous m'avez facturé ${euros(paid.inspection)}, alors que ces honoraires ne `
        + `peuvent pas dépasser ${euros(check.caps.inspection)} par m², soit ${euros(check.inspectionCap)}.`;

    return [...(check.lettingExcess > 0 ? [letting] : []), ...(check.inspectionExcess > 0 ? [inspection] : [])];
}

function claim(check: FeesCheck): string
{
    return `Ces plafonds sont fixés en application de l'article 5 de la loi n° 89-462 du 6 juillet 1989 (${check.caps.title}). `
        + `Par la présente, je vous mets en demeure de me rembourser la somme de ${euros(check.excess)}, perçue au-delà de ces plafonds.`;
}
