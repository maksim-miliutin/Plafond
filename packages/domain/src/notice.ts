import { addMonths, dayBefore, type Day } from "./day.js";
import { rounded } from "./money.js";

export type Reason = "tense" | "first-job" | "transfer" | "job-loss" | "new-job" | "health" | "benefits" | "social-housing" | "protection";

export interface NoticeReason
{
    id: Reason;
    label: string;
    motive: string;
    proof: string | null;
    condition: string | null;
}

// Loi n° 89-462 du 6 juillet 1989, article 15, 1° to 6°, worded and conditioned as service-public's fiche F1168 has them.
// The tense zone leads: it is the one reason sent without a proof.
export const noticeReasons: readonly NoticeReason[] = [
    { id: "tense", label: "Logement en zone tendue", motive: "le logement est situé en zone tendue", proof: null, condition: null },
    {
        id: "first-job",
        label: "Premier emploi",
        motive: "l'obtention d'un premier emploi",
        proof: "la copie du contrat de travail ou un document indiquant la date d'affiliation à la sécurité sociale",
        condition: "Un CDD transformé en CDI ne compte pas comme un premier emploi.",
    },
    {
        id: "transfer",
        label: "Mutation (salarié ou fonctionnaire)",
        motive: "ma mutation professionnelle",
        proof: "l'attestation de mutation établie par l'employeur",
        condition: "La mutation doit être proche de l'envoi du congé. Un travailleur indépendant garde trois mois de préavis.",
    },
    {
        id: "job-loss",
        label: "Perte d'emploi, rupture conventionnelle ou fin de CDD",
        motive: "la perte de mon emploi",
        proof: "le justificatif de la fin du contrat de travail",
        condition: "La perte d'emploi doit précéder l'envoi du congé et en être proche.",
    },
    {
        id: "new-job",
        label: "Nouvel emploi après une perte d'emploi",
        motive: "un nouvel emploi consécutif à une perte d'emploi",
        proof: "le justificatif de la perte d'emploi et la copie du nouveau contrat de travail",
        condition: "La perte d'emploi et le nouvel emploi doivent intervenir au cours de ce bail.",
    },
    {
        id: "health",
        label: "État de santé, constaté par un certificat médical",
        motive: "mon état de santé, qui justifie un changement de domicile",
        proof: "le certificat médical",
        condition: "Le logement ne doit plus être compatible avec votre état de santé.",
    },
    {
        id: "benefits",
        label: "Bénéficiaire du RSA ou de l'AAH",
        motive: "je bénéficie du revenu de solidarité active ou de l'allocation aux adultes handicapés",
        proof: "l'attestation de l'organisme qui verse la prestation",
        condition: "Il faut percevoir la prestation, et non seulement disposer de ressources du même montant.",
    },
    {
        id: "social-housing",
        label: "Attribution d'un logement social",
        motive: "l'attribution d'un logement social",
        proof: "la lettre d'attribution du logement social",
        condition: null,
    },
    {
        id: "protection",
        label: "Violences au sein du couple",
        motive: "les violences exercées par la personne avec qui je vis en couple, sur moi ou sur l'enfant qui vit avec moi",
        proof: "la copie de l'ordonnance de protection délivrée par le juge aux affaires familiales, ou de la condamnation pénale "
            + "pour ces violences datant de moins de six mois",
        condition: "Le congé doit être envoyé par lettre recommandée avec accusé de réception.",
    },
];

export interface Leaving
{
    furnished: boolean;
    reasons: readonly Reason[];
    receivedOn: Day;
    rent: number;  // cents a month, charges included
}

export interface LastMonth
{
    days: number;
    of: number;
    owed: number;
}

export interface NoticeCheck
{
    kind: "notice";
    months: 1 | 3;
    furnished: boolean;
    reason: NoticeReason | null;
    endsOn: Day;
    lastMonth: LastMonth;
}

export function notice(leaving: Leaving): NoticeCheck
{
    const reason = leaving.furnished ? null : noticeReasons.find((known) => leaving.reasons.includes(known.id)) ?? null;
    const months = leaving.furnished || reason !== null ? 1 : 3;
    const endsOn = addMonths(leaving.receivedOn, months);

    return {
        kind: "notice",
        months,
        furnished: leaving.furnished,
        reason,
        endsOn,
        lastMonth: lastMonth(endsOn, leaving.rent),
    };
}

function lastMonth(endsOn: Day, rent: number): LastMonth
{
    const days = Number(endsOn.slice(8));
    const of = Number(dayBefore(addMonths(`${endsOn.slice(0, 8)}01`, 1)).slice(8));

    return { days, of, owed: rounded(rent * days, of) };
}
