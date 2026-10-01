"use client";

import type { FormEvent } from "react";

import type { Problem } from "../lib/flow";
import { LocalForm } from "./LocalForm";

export interface AddressProps
{
    typed?: string;
    problem?: Problem | null;
    busy?: boolean;
    onFind?: (typed: string) => void;
}

export const problems: Record<Problem, string> = {
    "not-found": "Cette adresse n'a pas été trouvée. Vérifiez le numéro, la rue et l'arrondissement.",
    "not-paris": "Cette adresse n'est pas à Paris. Plafond ne couvre pour l'instant que Paris.",
    "street-only": "Seule la rue a été trouvée. Ajoutez le numéro de l'immeuble.",
    "unreachable": "Le service public de géocodage ne répond pas. Réessayez dans un instant.",
    "border": "Cette adresse tombe sur la limite entre deux quartiers. Précisez le numéro ou vérifiez sur le plan de la Ville de Paris.",
    "outside": "Cette adresse n'a pas pu être placée dans un quartier de Paris.",
};

export function AddressStep({ typed = "", problem = null, busy = false, onFind }: AddressProps)
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
            <LocalForm className="stack" onSubmit={find}>
                <label htmlFor="address" className="label">Adresse du logement</label>
                <input
                    id="address"
                    type="text"
                    autoComplete="street-address"
                    defaultValue={typed}
                    className="field"
                    aria-invalid={problem === null ? undefined : true}
                    aria-describedby={problem === null ? undefined : "address-error"}
                />
                {problem !== null && <p id="address-error" className="error">{problems[problem]}</p>}
                <button type="submit" className="primary" disabled={busy}>
                    {busy ? "Recherche du quartier…" : "Trouver le quartier"}
                </button>
            </LocalForm>
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
