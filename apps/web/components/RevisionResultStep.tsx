import { euros, frenchDay, indexPoints, ordinal } from "@plafond/domain";
import type { IndexRow, Revision, RevisionCheck } from "@plafond/domain";

export interface RevisionResultProps
{
    lease: Revision;
    clauseAssumed: boolean;
    check: RevisionCheck;
    writable: boolean;
    onWrite?: () => void;
    onHelp?: () => void;
    onBack?: () => void;
}

export function RevisionResultStep({ lease, clauseAssumed, check, writable, onWrite, onHelp, onBack }: RevisionResultProps)
{
    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            <Finding lease={lease} check={check} />
            <section className="findings">
                {clauseAssumed && <p>Si le bail ne contient pas de clause de révision, aucune hausse n'est permise en cours de bail.</p>}
                <p>
                    Si le logement est classé F ou G au DPE, une hausse peut être interdite. <a href="../dpe/">Vérifier le DPE du logement</a>
                </p>
            </section>
            <div className="grow" />
            <div className="stack">
                {writable && <button type="button" className="primary" onClick={onWrite}>Préparer la lettre au propriétaire</button>}
                {onHelp !== undefined && <button type="button" className="secondary" onClick={onHelp}>Trouver une aide gratuite</button>}
            </div>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}

function Finding({ lease, check }: { lease: Revision; check: RevisionCheck })
{
    switch (check.kind)
    {
        case "no-clause":
            return (
                <>
                    <h1 className="title">Sans clause de révision, pas de hausse</h1>
                    <p className="lead">Le loyer reste de {euros(lease.rent)} hors charges jusqu'au renouvellement du bail.</p>
                </>
            );

        case "lapsed":
            return (
                <>
                    <h1 className="title">La révision de cette année est perdue</h1>
                    <p className="lead">
                        Le propriétaire devait la demander au plus tard le {frenchDay(check.lastDay)}, dans l'année qui suit la date de révision.
                        Le loyer reste de {euros(lease.rent)} hors charges.
                    </p>
                </>
            );

        case "no-index":
            return (
                <>
                    <h1 className="title">Indice non disponible</h1>
                    <p className="lead">Plafond ne connaît pas l'indice nécessaire pour ces dates&nbsp;: il connaît ceux publiés depuis 2017.</p>
                </>
            );

        case "revised":
            return <Revised lease={lease} check={check} />;
    }
}

function Revised({ lease, check }: { lease: Revision; check: Extract<RevisionCheck, { kind: "revised" }> })
{
    const named = (row: IndexRow) => `Indice du ${ordinal(row.quarter)} trimestre ${row.year} : ${indexPoints(row.value)}.`;

    return (
        <>
            {check.excess > 0
                ? <h1 className="headline"><span className="amount">{euros(check.excess)}</span> de trop chaque mois</h1>
                : <h1 className="title">La hausse respecte l'indice</h1>}
            <dl className="figures">
                <div className="figure">
                    <dt>Loyer demandé</dt>
                    <dd>{euros(lease.asked)}</dd>
                </div>
                <div className="figure">
                    <dt>Loyer révisé maximum</dt>
                    <dd className="cap">{euros(check.allowed)}</dd>
                </div>
            </dl>
            <section className="findings">
                <p>{named(check.to)} {named(check.from)}</p>
                <p>
                    {euros(lease.rent)} × {indexPoints(check.to.value)} / {indexPoints(check.from.value)} = {euros(check.allowed)}
                    {check.assumed && ", avec le trimestre du dernier indice publié à la signature, faute de trimestre indiqué au bail"}.
                </p>
                {check.startsOn > lease.revisedOn && (
                    <p>
                        La hausse ne compte qu'à partir de la demande du propriétaire, le {frenchDay(check.startsOn)}&nbsp;: les mois d'avant restent
                        au loyer précédent.
                    </p>
                )}
                <p>Pour contester devant le juge, vous avez jusqu'au {frenchDay(check.contestBy)}.</p>
            </section>
        </>
    );
}
