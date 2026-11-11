import type { Day } from "./day.js";
import { euros, frenchDay, indexPoints, ordinal } from "./format.js";
import { framed, postal, type Demand, type Letter, type NothingToClaim } from "./letter.js";
import type { Revision, RevisionCheck } from "./revision.js";

export interface RevisionLetterInput
{
    lease: Revision;
    check: RevisionCheck;
    address: string;
    on: Day;
}

const law = "article 17-1 de la loi n° 89-462 du 6 juillet 1989";

export function revisionLetter({ lease, check, address, on }: RevisionLetterInput): Letter | NothingToClaim
{
    if (check.kind === "no-index" || check.excess === 0)
    {
        return { kind: "nothing-to-claim" };
    }

    const at = /^\d/.test(address) ? "au " : "";

    return framed({
        address,
        on,
        subject: "contestation de la révision du loyer",
        opening: [
            `Vous me louez le logement situé ${at}${postal(address)}. Le ${frenchDay(lease.askedOn)}, vous m'avez demandé `
                + `de porter le loyer hors charges de ${euros(lease.rent)} à ${euros(lease.asked)} au titre de la révision du `
                + `${frenchDay(lease.revisedOn)}.`,
        ],
        demands: [{ ground: "revision", paragraphs: grounds(lease, check) }],
        reminders: [],
        caution: null,
    });
}

function grounds(lease: Revision, check: Exclude<RevisionCheck, { kind: "no-index" }>): string[]
{
    const keep = `Je vous demande donc de maintenir le loyer à ${euros(check.allowed)} et, si j'ai déjà payé davantage, de me rembourser la `
        + "différence.";

    switch (check.kind)
    {
        case "no-clause":
            return [`Le bail ne contient pas de clause de révision : le loyer ne peut pas être révisé en cours de bail (${law}), et le `
                + `loyer reste de ${euros(check.allowed)}.`, keep];

        case "lapsed":
            return [`La révision devait être demandée au plus tard le ${frenchDay(check.lastDay)}, dans l'année qui suit la date de révision du `
                + `${frenchDay(lease.revisedOn)} (${law}). Votre demande est tardive : la révision de cette année est perdue, et le loyer `
                + `reste de ${euros(check.allowed)}.`, keep];

        case "revised":
            return revised(lease, check);
    }
}

function revised(lease: Revision, check: Extract<RevisionCheck, { kind: "revised" }>): string[]
{
    const named = (row: { quarter: number; year: number }) => `du ${ordinal(row.quarter)} trimestre ${row.year}`;
    const assumed = check.assumed
        ? [`Le bail ne mentionnant pas de trimestre de référence, c'est le dernier indice publié à sa signature qui s'applique, celui du `
            + `${ordinal(check.quarter)} trimestre.`]
        : [];
    const late = check.startsOn > lease.revisedOn
        ? [`La révision ne prend effet qu'à compter de votre demande, le ${frenchDay(check.startsOn)}, et non au ${frenchDay(lease.revisedOn)}.`]
        : [];

    return [
        `La révision annuelle ne peut pas dépasser la variation de l'indice de référence des loyers (${law}). L'indice de référence `
            + `des loyers ${named(check.to)} est de ${indexPoints(check.to.value)}, celui ${named(check.from)} de `
            + `${indexPoints(check.from.value)} : le loyer révisé ne peut donc pas dépasser ${euros(lease.rent)} × `
            + `${indexPoints(check.to.value)} / ${indexPoints(check.from.value)}, soit ${euros(check.allowed)}.`,
        ...assumed,
        ...late,
        `Je vous demande donc de ramener le loyer à ${euros(check.allowed)} et, si j'ai déjà payé davantage, de me rembourser la différence.`,
    ];
}
