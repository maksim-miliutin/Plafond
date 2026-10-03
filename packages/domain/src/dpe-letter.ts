import type { Day } from "./day.js";
import { undecentFrom, type DecencyFinding, type Dpe, type IncreaseFinding, type Tenancy } from "./dpe.js";
import { frenchDay } from "./format.js";
import { framed, postal, type Demand, type Letter, type NothingToClaim } from "./letter.js";

export interface DpeLetterInput
{
    dpe: Dpe;
    tenancy: Tenancy;
    address: string;
    raisedOn: Day | null;
    increase: IncreaseFinding | null;
    decency: DecencyFinding;
}

const climate = "la loi n° 2021-1104 du 22 août 2021 dite Climat et résilience";

export function dpeLetter(input: DpeLetterInput): Letter | NothingToClaim
{
    const demands = [freeze(input), decent(input)].filter((demand) => demand !== null);
    if (demands.length === 0)
    {
        return { kind: "nothing-to-claim" };
    }

    const { dpe, tenancy, address } = input;
    const at = /^\d/.test(address) ? "au " : "";

    return framed({
        address,
        on: tenancy.on,
        subject: "mise en demeure au sujet de la performance énergétique de mon logement",
        opening: [
            `Vous me louez le logement situé ${at}${postal(address)}. Le bail a été signé le ${frenchDay(tenancy.signedOn)}. `
                + `Le diagnostic de performance énergétique n° ${dpe.number}, établi le ${frenchDay(dpe.establishedOn)}, `
                + `classe ce logement en ${dpe.label}.`,
        ],
        demands,
        reminders: [],
        caution: null,
    });
}

function freeze({ increase, raisedOn }: DpeLetterInput): Demand | null
{
    if (increase === null || increase.kind !== "forbidden" || raisedOn === null)
    {
        return null;
    }

    return {
        ground: "freeze",
        paragraphs: [
            "Depuis le 24 août 2022, le loyer d'un logement classé F ou G ne peut plus être augmenté, ni en cours de bail ni "
                + `lors de son renouvellement, dès lors que le bail a été signé ou renouvelé après cette date (${climate}). `
                + `Le bail en cours a commencé le ${frenchDay(increase.since)}.`,
            "Par la présente, je vous mets en demeure de renoncer à l'augmentation de loyer appliquée le "
                + `${frenchDay(raisedOn)} et de me rembourser les sommes perçues à ce titre.`,
        ],
    };
}

function decent({ dpe, decency }: DpeLetterInput): Demand | null
{
    const from = undecentFrom(dpe.label);
    if (decency.kind !== "not-decent" || from === null)
    {
        return null;
    }

    return {
        ground: "decency",
        paragraphs: [
            `Depuis le ${frenchDay(from)}, un logement classé ${dpe.label} ne répond plus aux critères de décence énergétique `
                + "pour un bail signé ou renouvelé à compter de cette date (article 6 de la loi n° 89-462 du 6 juillet 1989, "
                + `modifié par ${climate}). Le bail en cours a commencé le ${frenchDay(decency.since)}.`,
            "Par la présente, je vous mets en demeure de réaliser les travaux nécessaires pour que le logement réponde à ces critères.",
        ],
    };
}
