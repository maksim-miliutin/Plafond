import { caretakerShares, euros, frenchDay } from "@plafond/domain";
import type { ChargesCheck, CheckedLine, Regularisation } from "@plafond/domain";

export interface ChargesResultProps
{
    regularised: Regularisation;
    check: ChargesCheck;
    writable: boolean;
    onWrite?: () => void;
    onHelp?: () => void;
    onBack?: () => void;
}

export function ChargesResultStep({ regularised, check, writable, onWrite, onHelp, onBack }: ChargesResultProps)
{
    const balance = check.balance < 0 ? ["À vous rembourser", -check.balance] : ["Reste à payer", check.balance];

    return (
        <main className="screen result">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Modifier les réponses</button>}
            {check.wrong > 0
                ? <h1 className="headline"><span className="amount">{euros(check.wrong)}</span> facturés à tort</h1>
                : <h1 className="title">Ces charges sont récupérables</h1>}
            <dl className="figures">
                <div>
                    <dt>Total du décompte {regularised.year}</dt>
                    <dd>{euros(check.billed)}</dd>
                </div>
                <div>
                    <dt>Récupérable</dt>
                    <dd>{euros(check.allowed)}</dd>
                </div>
                <div>
                    <dt>Provisions versées</dt>
                    <dd>{euros(check.provisions)}</dd>
                </div>
                <div>
                    <dt>{balance[0]}</dt>
                    <dd>{euros(balance[1] as number)}</dd>
                </div>
            </dl>
            <ul className="verdicts">
                {check.lines.map((line, index) => (
                    <li key={line.kind.id}>
                        <span>{line.kind.name}</span>
                        <span>{euros(line.billed)}, {verdict(line, regularised.lines[index]?.caretaker)}</span>
                    </li>
                ))}
            </ul>
            <section className="findings">
                {check.twelfths && check.balance > 0 && (
                    <p>
                        Le décompte vous est parvenu après la fin de l'année {regularised.year + 1}&nbsp;: vous pouvez payer le solde en
                        douze mensualités.
                    </p>
                )}
                <p>Vous pouvez consulter les justificatifs de ces charges jusqu'au {frenchDay(check.proofsUntil)}.</p>
                <p>
                    Un poste de votre décompte manque ici&nbsp;? La <a href="https://www.economie.gouv.fr/node/37790">liste des charges
                    récupérables</a> le dit. Chaque décompte porte sur une année&nbsp;: refaites le calcul pour les précédentes, dans la
                    limite de trois ans.
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

function verdict(line: CheckedLine, caretaker: keyof typeof caretakerShares | undefined): string
{
    switch (line.kind.verdict)
    {
        case "recoverable":
            return "récupérable";

        case "not-recoverable":
            return "non récupérable";

        case "caretaker":
            return `récupérable à ${caretakerShares[caretaker ?? "employee"]}\u00A0%`;
    }
}
