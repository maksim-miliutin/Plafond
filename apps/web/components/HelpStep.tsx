import type { Helper } from "../lib/help";

export interface HelpProps
{
    helpers: Helper[];
    onBack?: () => void;
}

export function HelpStep({ helpers, onBack }: HelpProps)
{
    return (
        <main className="screen">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Retour au résultat</button>}
            <h1 className="title">Trouver une aide gratuite</h1>
            <p className="lead">Avant d'écrire au propriétaire ou après sa réponse, ces services vous aident sans frais.</p>
            <ul className="helpers">
                {helpers.map((helper) => (
                    <li key={helper.name}>
                        <h2>{helper.name}</h2>
                        <p>{helper.does}</p>
                        {helper.reach.length > 0 && (
                            <p className="ways">
                                {helper.reach.map((way) => (
                                    <a key={way.href} href={way.href} rel="noopener">{way.text}</a>
                                ))}
                            </p>
                        )}
                    </li>
                ))}
            </ul>
        </main>
    );
}
