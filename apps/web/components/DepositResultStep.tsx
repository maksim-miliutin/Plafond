import { euros, frenchDay } from "@plafond/domain";
import type { Deposit, DepositCheck } from "@plafond/domain";

export interface DepositResultProps
{
    held: Deposit;
    check: DepositCheck;
    writable: boolean;
    onWrite?: () => void;
    onHelp?: () => void;
    onBack?: () => void;
}

export function DepositResultStep({ held, check, writable, onWrite, onHelp, onBack }: DepositResultProps)
{
    const due = check.owed + check.penalty;

    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            {check.late > 0 && due > 0 && (
                <>
                    <h1 className="headline"><span className="amount">{euros(due)}</span> vous sont dus</h1>
                    <dl className="figures">
                        <div>
                            <dt>Dépôt restant dû</dt>
                            <dd>{euros(check.owed)}</dd>
                        </div>
                        <div>
                            <dt>Majoration de retard</dt>
                            <dd>{euros(check.penalty)}</dd>
                        </div>
                        <div>
                            <dt>Date limite de restitution</dt>
                            <dd>{frenchDay(check.deadline)}</dd>
                        </div>
                    </dl>
                    {check.penaltyDue && (
                        <p className="lead">
                            {check.late} périodes mensuelles commencées en retard, à 10&nbsp;% du loyer hors charges chacune.
                        </p>
                    )}
                </>
            )}
            {check.late === 0 && check.owed > 0 && (
                <>
                    <h1 className="title">Le délai court encore</h1>
                    <p className="lead">
                        Le propriétaire a jusqu'au {frenchDay(check.deadline)} pour vous rendre {euros(check.owed)}. Ensuite, chaque mois
                        de retard commencé lui coûtera 10&nbsp;% du loyer hors charges.
                    </p>
                </>
            )}
            {check.owed === 0 && check.penalty === 0 && (
                <h1 className="title">{check.late === 0 ? "Votre dépôt a été rendu à temps" : "Votre dépôt a été rendu après le délai"}</h1>
            )}
            <section className="findings">
                {!check.penaltyDue && check.late > 0 && (
                    <p>Vous n'avez pas donné votre nouvelle adresse au propriétaire&nbsp;: la majoration n'est pas due, mais le dépôt reste dû.</p>
                )}
                {check.excess > 0 && (
                    <p>
                        Le dépôt versé dépassait le maximum légal de {euros(check.allowed)}, soit {held.furnished ? "deux mois" : "un mois"} de
                        loyer hors charges.
                    </p>
                )}
                {check.owed > 0 && (
                    <p>
                        Dans un immeuble collectif, le propriétaire peut garder jusqu'à 20&nbsp;% du dépôt, s'il le justifie, jusqu'à
                        l'arrêté annuel des comptes de l'immeuble.
                    </p>
                )}
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
