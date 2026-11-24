"use client";

import type { FormEvent } from "react";

import type { Problem } from "../lib/flow";
import { LocalForm } from "./LocalForm";
import { Brand } from "./Brand";
import { Progress } from "./Progress";
import { guideFor, guides } from "../lib/guides";

export interface AddressProps
{
    typed?: string;
    problem?: Problem | null;
    simulator?: string;  // the official check of the territory where the address could not be placed, if it has one
    busy?: boolean;
    onFind?: (typed: string) => void;
}

export const problems: Record<Problem, string> = {
    "not-found": "Cette adresse n'a pas été trouvée. Vérifiez le numéro, la rue et l'arrondissement.",
    "not-paris": "Cette adresse n'est ni à Paris, ni à Lyon ou Villeurbanne, ni à Est Ensemble ou Plaine Commune, les territoires que Plafond couvre pour l'instant.",
    "overseas": "Cette adresse est outre-mer, où ces règles s'appliquent à d'autres dates. Plafond ne les couvre pas encore.",
    "street-only": "Seule la rue a été trouvée. Ajoutez le numéro de l'immeuble.",
    "unreachable": "Le service public de géocodage ne répond pas. Réessayez dans un instant.",
    "border": "Cette adresse tombe sur la limite entre deux secteurs. Précisez le numéro de la rue.",
    "outside": "Cette adresse n'a pas pu être placée dans un secteur couvert par l'encadrement.",
};

// The commune is covered, only its sector is unknown: the address fell between the outlines that split the commune.
const unplaced = "Plafond n'a pas pu placer cette adresse dans l'un des secteurs de sa commune.";

export function AddressStep({ typed = "", problem = null, simulator, busy = false, onFind }: AddressProps)
{
    function find(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        const field = event.currentTarget.elements.namedItem("address");
        onFind?.(field instanceof HTMLInputElement ? field.value.trim() : "");
    }

    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <Progress at={1} of={4} label="votre adresse" />
            <h1 className="title">Votre loyer dépasse-t-il le plafond légal ?</h1>
            <p className="lead">
                Le loyer au mètre carré est plafonné à Paris depuis le 1er juillet 2019, dans les communes de Plaine Commune
                depuis le 1er juin 2021, à Lyon et Villeurbanne depuis le 1er novembre 2021, dans les communes d'Est Ensemble
                depuis le 1er décembre 2021. Le plafond dépend du secteur&nbsp;: commencez par l'adresse du logement.
            </p>
            <a className="rule" href={`../guides/${guideFor("loyer/").slug}/`}>Comprendre la règle</a>
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
                {problem !== null && (
                    <p id="address-error" className="error">
                        {simulator !== undefined && problem === "outside" ? unplaced : problems[problem]}
                        {simulator !== undefined && (problem === "border" || problem === "outside") && (
                            <> Le <a href={simulator}>simulateur officiel</a> place chaque adresse dans son secteur.</>
                        )}
                    </p>
                )}
                <button type="submit" className="primary" disabled={busy}>
                    {busy ? "Recherche du quartier…" : "Trouver le quartier"}
                </button>
            </LocalForm>
            <section className="findings" aria-labelledby="rent-check">
                <h2 id="rent-check">Ce que vérifie Plafond</h2>
                <p>
                    Chaque année, un arrêté du préfet fixe un loyer de référence au mètre carré selon le secteur, le nombre de
                    pièces, l'époque de construction et le type de location. Le loyer de base ne peut pas dépasser le loyer de
                    référence majoré de l'arrêté en vigueur le jour de la signature du bail. Un complément de loyer peut s'y
                    ajouter quand le logement présente des caractéristiques de localisation ou de confort qui le justifient,
                    par comparaison avec les logements de la même catégorie du secteur.
                </p>
                <p>
                    Gardez votre bail sous la main&nbsp;: il vous faudra la date de signature, la surface habitable, le nombre de
                    pièces, l'époque de construction de l'immeuble, si le logement est meublé, le loyer hors charges et
                    l'éventuel complément de loyer.
                </p>
                <ul className="references">
                    {guides.filter((guide) => guide.check.href === "loyer/").map((guide) => (
                        <li key={guide.slug}><a href={`../guides/${guide.slug}/`}>{guide.label}</a></li>
                    ))}
                </ul>
            </section>
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
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
