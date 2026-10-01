import { Fragment } from "react";

import type { Letter } from "@plafond/domain";

import { ContestNote } from "./ContestNote";
import { LetterActions } from "./LetterActions";

export interface LetterProps
{
    letter: Letter;
    onBack?: () => void;
}

export function LetterStep({ letter, onBack }: LetterProps)
{
    return (
        <main className="screen">
            <button type="button" className="back" onClick={onBack}>Retour au résultat</button>
            <h1 className="title">Votre lettre au propriétaire</h1>
            <p className="lead">
                Complétez les noms entre crochets, relisez, puis envoyez-la en recommandé avec accusé de réception.
            </p>
            {letter.caution !== null && <ContestNote contest={letter.caution} />}
            <article className="letter" aria-label="Lettre au propriétaire">
                <Lines className="from" lines={letter.sender} />
                <Lines className="to" lines={letter.recipient} />
                <p className="to">{letter.dated}</p>
                <p className="subject">{letter.subject}</p>
                <p>{letter.delivery}</p>
                <p>{letter.greeting}</p>
                {letter.opening.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <ol className="demands">
                    {letter.demands.map((demand) => (
                        <li key={demand.ground}>
                            {demand.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                        </li>
                    ))}
                </ol>
                {letter.closing.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                <p className="signature">{letter.signature}</p>
            </article>
            <LetterActions letter={letter} />
            <p className="fine">Ce modèle n'est pas un conseil juridique. L'ADIL de Paris vous conseille gratuitement avant l'envoi.</p>
        </main>
    );
}

function Lines({ className, lines }: { className: string; lines: string[] })
{
    return (
        <p className={className}>
            {lines.map((line, index) => (
                <Fragment key={line}>
                    {index > 0 && <br />}
                    {line}
                </Fragment>
            ))}
        </p>
    );
}
