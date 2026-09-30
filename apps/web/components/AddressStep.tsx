"use client";

import type { FormEvent } from "react";

export interface AddressProps
{
    onFind?: (typed: string) => void;
}

export function AddressStep({ onFind }: AddressProps)
{
    function find(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem("address");
        onFind?.(field instanceof HTMLInputElement ? field.value.trim() : "");
    }

    return (
        <main className="screen">
            <p className="wordmark">Plafond</p>
            <h1 className="title">Votre loyer dépasse-t-il le plafond légal ?</h1>
            <p className="lead">
                À Paris, le loyer au mètre carré est plafonné depuis le 1er juillet 2019. Le plafond dépend du quartier :
                commencez par l'adresse du logement.
            </p>
            <form className="stack" onSubmit={find}>
                <label htmlFor="address" className="label">Adresse du logement</label>
                <input id="address" type="text" autoComplete="street-address" className="field" />
                <button type="submit" className="primary">Trouver le quartier</button>
            </form>
            <div className="grow" />
            <aside className="note">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                <p>
                    Le calcul se fait sur votre appareil. Votre adresse part seulement au service public de géocodage et
                    n'est jamais enregistrée. Pas de compte, pas de publicité.
                </p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique.</p>
        </main>
    );
}
