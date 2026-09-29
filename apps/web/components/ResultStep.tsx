import { dayBefore, euros, frenchDay, percent, squareMetres } from "@plafond/domain";
import type { Check, Claim, Complement, Contest, Day, Period, Rooms } from "@plafond/domain";

export interface ResultProps
{
    check: Check;
    claim: Claim;
    quartier: string;
}

const rooms: Record<Rooms, string> = {
    1: "1 pièce",
    2: "2 pièces",
    3: "3 pièces",
    4: "4 pièces et plus",
};

const periods: Record<Period, string> = {
    "before-1946": "construit avant 1946",
    "1946-1970": "construit entre 1946 et 1970",
    "1971-1990": "construit entre 1971 et 1990",
    "after-1990": "construit après 1990",
};

export function ResultStep({ check, claim, quartier }: ResultProps)
{
    const over = check.excess > 0;

    return (
        <main className="screen result">
            <Headline check={check} />
            <dl className="figures">
                <div className="figure">
                    <dt>Votre loyer de base</dt>
                    <dd>{euros(claim.rent)}</dd>
                </div>
                <div className="figure">
                    <dt>Plafond légal</dt>
                    <dd className="cap">{euros(check.cap)}</dd>
                </div>
            </dl>
            {over && <Recovery check={check} claim={claim} />}
            {check.complement !== null && <ComplementNote complement={check.complement} on={claim.on} />}
            {check.rate.decree.contest !== null && <ContestNote contest={check.rate.decree.contest} />}
            <Sources check={check} claim={claim} quartier={quartier} />
            <div className="grow" />
            <div className="stack">
                {over && <button type="button" className="primary">Préparer la lettre au propriétaire</button>}
                <button type="button" className="secondary">Trouver une aide gratuite</button>
            </div>
            <p className="fine">Une estimation, pas un conseil juridique. Seuls l'arrêté préfectoral et votre bail font foi.</p>
        </main>
    );
}

function Headline({ check }: { check: Check })
{
    if (check.excess === 0)
    {
        return <h1 className="title">Votre loyer de base respecte le plafond légal</h1>;
    }

    return (
        <h1 className="headline">
            <span className="amount">{euros(check.excess)}</span>
            <span className="per">de trop chaque mois</span>
        </h1>
    );
}

function Recovery({ check, claim }: { check: Check; claim: Claim })
{
    return (
        <dl className="recovery">
            <div className="line">
                <dt>
                    Trop-perçu depuis le début du bail
                    <span>{check.months} mois complets depuis le {frenchDay(claim.startsOn)}</span>
                </dt>
                <dd>{euros(check.sinceStart)}</dd>
            </div>
            <div className="line">
                <dt>
                    Récupérable
                    <span>Le remboursement se limite aux trois dernières années.</span>
                </dt>
                <dd>{euros(check.recoverable)}</dd>
            </div>
        </dl>
    );
}

function ComplementNote({ complement, on }: { complement: Complement; on: Day })
{
    const deadline = frenchDay(complement.contestUntil);
    const open = on <= complement.contestUntil;

    return (
        <section className="note">
            <h2>Complément de loyer</h2>
            <p>
                Votre bail prévoit un complément de {euros(complement.amount)} par mois, soit {percent(complement.share)} du
                plafond. Il n'est permis que pour un logement aux caractéristiques exceptionnelles par rapport aux
                logements comparables du quartier, et c'est au propriétaire de le justifier.
            </p>
            {open
                ? <p>Vous pouvez le contester devant la commission départementale de conciliation avant le {deadline}.</p>
                : <p>Le délai pour le contester devant la commission départementale de conciliation a expiré le {deadline}.</p>}
        </section>
    );
}

function ContestNote({ contest }: { contest: Contest })
{
    const decision = `${contest.court}, ${frenchDay(contest.decidedOn)}`;

    return (
        <section className="notice" role="note">
            {contest.outcome === "pending"
                ? <p>La validité de l'arrêté de cette période est contestée en justice ({decision}) et l'affaire n'est pas close.</p>
                : <p>L'arrêté de cette période a été annulé en justice ({decision}).</p>}
            {contest.claimsBy !== null && (
                <p>Le tribunal a limité les effets de cette annulation aux recours engagés au plus tard le {frenchDay(contest.claimsBy)}.</p>
            )}
            <p>Renseignez-vous auprès de l'ADIL de Paris avant d'agir.</p>
        </section>
    );
}

function Sources({ check, claim, quartier }: ResultProps)
{
    const { decree, majored, flat } = check.rate;
    const letting = flat.furnished ? "loué meublé" : "loué vide";

    return (
        <section className="sources">
            <h2>D'où viennent ces chiffres</h2>
            <dl>
                <div>
                    <dt>Quartier</dt>
                    <dd>{quartier}</dd>
                </div>
                <div>
                    <dt>Logement</dt>
                    <dd>{rooms[flat.rooms]}, {periods[flat.period]}, {letting}</dd>
                </div>
                <div>
                    <dt>Loyer de référence majoré</dt>
                    <dd>
                        {euros(majored)} par m². {decree.title}, applicable du {frenchDay(decree.from)} au{" "}
                        {frenchDay(dayBefore(decree.until))}. <a href={decree.url}>Voir l'arrêté</a>
                    </dd>
                </div>
                <div>
                    <dt>Calcul du plafond</dt>
                    <dd>{euros(majored)} × {squareMetres(claim.surface)} = {euros(check.cap)} par mois</dd>
                </div>
            </dl>
        </section>
    );
}
