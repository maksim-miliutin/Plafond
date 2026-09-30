import { frenchDay } from "@plafond/domain";
import type { Letter } from "@plafond/domain";

import { ContestNote } from "./ContestNote";

export interface LetterProps
{
    letter: Letter;
    address: string;
}

export function LetterStep({ letter, address }: LetterProps)
{
    return (
        <main className="screen">
            <button type="button" className="back">Retour au résultat</button>
            <h1 className="title">Votre lettre au propriétaire</h1>
            <p className="lead">
                Complétez les noms entre crochets, relisez, puis envoyez-la en recommandé avec accusé de réception.
            </p>
            {letter.caution !== null && <ContestNote contest={letter.caution} />}
            <article className="letter" aria-label="Lettre au propriétaire">
                <p className="from">
                    [Votre prénom et nom]
                    <br />
                    {address}
                </p>
                <p className="to">
                    [Nom du propriétaire]
                    <br />
                    [Adresse du propriétaire]
                </p>
                <p className="to">Paris, le {frenchDay(letter.writtenOn)}</p>
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
                <p className="signature">[Signature]</p>
            </article>
            <div className="stack">
                <button type="button" className="primary">Imprimer ou enregistrer en PDF</button>
                <button type="button" className="secondary">Copier le texte</button>
            </div>
            <p className="fine">Ce modèle n'est pas un conseil juridique. L'ADIL de Paris vous conseille gratuitement avant l'envoi.</p>
        </main>
    );
}
