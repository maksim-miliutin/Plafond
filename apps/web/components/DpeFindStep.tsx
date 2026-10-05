"use client";

import type { FormEvent } from "react";

import type { DpeProblem } from "../lib/dpe-search";
import { LocalForm } from "./LocalForm";
import { Brand } from "./Brand";

export interface DpeFindProps
{
    typed?: string;
    problem?: DpeProblem | null;
    busy?: boolean;
    onSearch?: (typed: string) => void;
}

export const dpeProblems: Record<DpeProblem, string> = {
    "not-found": "Cette adresse n'a pas été trouvée. Vérifiez le numéro, la rue et la commune.",
    "not-paris": "Cette adresse n'a pas pu être cherchée.",
    "street-only": "Seule la rue a été trouvée. Ajoutez le numéro de l'immeuble.",
    "overseas": "Cette adresse est outre-mer, où ces règles s'appliquent à d'autres dates. Plafond ne les couvre pas encore.",
    "unreachable": "Le service public ne répond pas. Réessayez dans un instant.",
    "malformed": "Ce numéro de DPE n'a pas le bon format\u00A0: 13 caractères, chiffres et lettres.",
    "no-diagnosis": "Aucun DPE n'est enregistré ici depuis juillet 2021. Cherchez son numéro sur le DPE annexé à votre bail\u00A0: "
        + "un DPE sans numéro ADEME n'est pas valable.",
};

export function DpeFindStep({ typed = "", problem = null, busy = false, onSearch }: DpeFindProps)
{
    function find(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem("dpe-search");
        onSearch?.(field instanceof HTMLInputElement ? field.value.trim() : "");
    }

    const notes = ["dpe-search-hint", ...(problem === null ? [] : ["dpe-search-error"])].join(" ");

    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Mon logement est-il une passoire thermique ?</h1>
            <p className="lead">
                Le diagnostic de performance énergétique classe chaque logement de A à G. Le loyer d'un logement classé F ou G
                ne peut plus augmenter, et un logement classé G n'est plus décent dans un bail signé ou renouvelé depuis 2025.
            </p>
            <LocalForm className="stack" onSubmit={find}>
                <label htmlFor="dpe-search" className="label">Numéro du DPE ou adresse du logement</label>
                <p id="dpe-search-hint" className="hint">
                    Le numéro figure sur le DPE annexé à votre bail, 13 caractères, par exemple 2375E1929024F.
                </p>
                <input
                    id="dpe-search"
                    type="text"
                    autoComplete="street-address"
                    defaultValue={typed}
                    className="field"
                    aria-invalid={problem === null ? undefined : true}
                    aria-describedby={notes}
                />
                {problem !== null && <p id="dpe-search-error" className="error">{dpeProblems[problem]}</p>}
                <button type="submit" className="primary" disabled={busy}>
                    {busy ? "Recherche du DPE\u2026" : "Trouver le DPE"}
                </button>
            </LocalForm>
            <div className="grow" />
            <aside className="note">
                <p>
                    Le calcul se fait sur votre appareil. L'adresse part au service public de géocodage, puis son identifiant à
                    l'ADEME, qui publie les DPE. Rien n'est enregistré.
                </p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
