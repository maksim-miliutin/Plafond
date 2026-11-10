import { euros, frenchDay } from "@plafond/domain";
import type { Day, NoticeCheck } from "@plafond/domain";

export interface NoticeResultProps
{
    check: NoticeCheck;
    receivedOn: Day;
    ifTense: NoticeCheck | null;
    onWrite?: () => void;
    onHelp?: () => void;
    onBack?: () => void;
}

export function NoticeResultStep({ check, receivedOn, ifTense, onWrite, onHelp, onBack }: NoticeResultProps)
{
    const { days, of, owed } = check.lastMonth;

    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            <h1 className="headline"><span className="amount">{check.months === 1 ? "Un mois" : "Trois mois"}</span> de préavis</h1>
            <p className="lead">
                Votre préavis prend fin le {frenchDay(check.endsOn)} à minuit, si le propriétaire reçoit votre lettre le {frenchDay(receivedOn)}.
            </p>
            <dl className="figures">
                <div>
                    <dt>Fin du préavis</dt>
                    <dd>{frenchDay(check.endsOn)}</dd>
                </div>
                <div>
                    <dt>Loyer et charges du dernier mois</dt>
                    <dd>{euros(owed)}</dd>
                </div>
            </dl>
            <section className="findings">
                <p>Du {frenchDay(`${check.endsOn.slice(0, 8)}01`)} au {frenchDay(check.endsOn)}, soit {days} jours sur {of}.</p>
                <Why check={check} />
                {ifTense !== null && (
                    <p>
                        Si le logement est en zone tendue, le préavis n'est que d'un mois et prendrait fin le {frenchDay(ifTense.endsOn)}.
                        L'ADIL de votre département peut vous le confirmer.
                    </p>
                )}
                <p>
                    Le loyer et les charges restent dus jusqu'à la fin du préavis, même si vous partez avant, sauf si un nouveau locataire
                    entre plus tôt avec l'accord du propriétaire. Si la lettre arrive plus tard, le préavis se termine d'autant plus tard.
                </p>
                <p>
                    Après la remise des clés, le dépôt de garantie doit vous être rendu dans un délai d'un ou deux mois.{" "}
                    <a href="../depot/">Vérifier mon dépôt de garantie</a>
                </p>
            </section>
            <div className="grow" />
            <div className="stack">
                <button type="button" className="primary" onClick={onWrite}>Préparer la lettre de congé</button>
                {onHelp !== undefined && <button type="button" className="secondary" onClick={onHelp}>Trouver une aide gratuite</button>}
            </div>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}

function Why({ check }: { check: NoticeCheck })
{
    if (check.furnished)
    {
        return <p>Un logement meublé se quitte avec un mois de préavis.</p>;
    }

    if (check.reason === null)
    {
        return <p>Pour un logement vide, le préavis est de trois mois, sauf en zone tendue ou pour un motif prévu par la loi.</p>;
    }

    if (check.reason.proof === null)
    {
        return <p>Le logement est en zone tendue&nbsp;: la lettre l'indique, sans justificatif à joindre.</p>;
    }

    return (
        <p>
            Motif retenu&nbsp;: {check.reason.label}. Joignez à votre lettre {check.reason.proof}&nbsp;: sans justificatif envoyé
            avec la lettre, le préavis reste de trois mois.
        </p>
    );
}
