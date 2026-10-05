import { dayBefore, euros, frenchDay, letting, noComplementFrom, percent, periods, rooms, squareMetres } from "@plafond/domain";
import type { Check, Claim, Complement, Day } from "@plafond/domain";

import { ContestNote } from "./ContestNote";
import { Progress } from "./Progress";

export interface ResultProps
{
    check: Check;
    claim: Claim;
    quartier: string;
    writable: boolean;
    onWrite?: () => void;
    onBack?: () => void;
    onHelp?: () => void;
}

export function ResultStep({ check, claim, quartier, writable, onWrite, onBack, onHelp }: ResultProps)
{
    const over = check.excess > 0;

    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier le bail</button>}
            <Progress at={4} of={4} label="le résultat" />
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
            {check.complement !== null && <ComplementNote complement={check.complement} on={claim.on} signedOn={claim.signedOn} />}
            {check.rate.decree.contest !== null && <ContestNote contest={check.rate.decree.contest} />}
            <Sources check={check} claim={claim} quartier={quartier} />
            <div className="grow" />
            <div className="stack">
                {writable && <button type="button" className="primary" onClick={onWrite}>Préparer la lettre au propriétaire</button>}
                {onHelp !== undefined && <button type="button" className="secondary" onClick={onHelp}>Trouver une aide gratuite</button>}
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

function ComplementNote({ complement, on, signedOn }: { complement: Complement; on: Day; signedOn: Day })
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
            {signedOn >= noComplementFrom && (
                <p>
                    Depuis le {frenchDay(noComplementFrom)}, aucun complément de loyer ne peut être appliqué à un logement classé F
                    ou G au diagnostic de performance énergétique. <a href="../dpe/">Vérifier le DPE du logement</a>
                </p>
            )}
        </section>
    );
}

function Sources({ check, claim, quartier }: Pick<ResultProps, "check" | "claim" | "quartier">)
{
    const { decree, majored, flat } = check.rate;

    return (
        <section className="sources">
            <h2>D'où viennent ces chiffres</h2>
            <dl>
                <div>
                    <dt>Quartier</dt>
                    <dd>{quartier}</dd>
                </div>
                <div>
                    <dt>Bail</dt>
                    <dd>signé le {frenchDay(claim.signedOn)}, pris effet le {frenchDay(claim.startsOn)}</dd>
                </div>
                <div>
                    <dt>Logement</dt>
                    <dd>{rooms[flat.rooms]}, construit {periods[flat.period]}, {letting(flat.furnished)}</dd>
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
