"use client";

import type { FormEvent } from "react";

import { feesQuestions, type FeesErrors, type FeesFields } from "../lib/fees-flow";
import { readForm } from "../lib/forms";
import { Brand } from "./Brand";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface FeesFormProps
{
    fields: FeesFields;
    errors: FeesErrors;
    onAnswer?: (fields: FeesFields) => void;
}

const zones: [string, string][] = [["very-tense", "zone très tendue"], ["tense", "zone tendue"], ["other", "ailleurs"], ["unknown", "je ne sais pas"]];

export function FeesFormStep({ fields, errors, onAnswer }: FeesFormProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(feesQuestions) as (keyof FeesFields)[]));
    }

    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Mes frais d'agence dépassent-ils le plafond ?</h1>
            <p className="lead">
                Pour la visite, le dossier et le bail, une agence ne peut facturer au locataire qu'un montant par m² fixé selon la zone.
                L'état des lieux d'entrée a son propre plafond.
            </p>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le logement</h2>
                <Typed id="address" label="Adresse du logement" type="address" value={fields.address} error={errors.address} />
                <Typed id="surface" label="Surface habitable" hint="En m², comme au bail." value={fields.surface} error={errors.surface} />
                <p className="hint">
                    Paris et une partie de sa proche banlieue sont en zone très tendue. Lyon, Marseille, Lille, Bordeaux, Toulouse et la
                    plupart des grandes agglomérations sont en zone tendue.
                </p>
                <Choice
                    name="zone"
                    legend={"Dans quelle zone se trouve le logement ?"}
                    options={zones}
                    value={fields.zone}
                    error={errors.zone}
                />
                <h2 className="section">Le bail et les honoraires</h2>
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} />
                <Typed
                    id="letting"
                    label="Honoraires de visite, de dossier et de bail"
                    hint="Ils figurent sur la facture de l'agence et, en principe, dans le bail."
                    value={fields.letting}
                    error={errors.letting}
                />
                <Typed
                    id="inspection"
                    label="Honoraires de l'état des lieux d'entrée"
                    hint="Laissez vide si l'agence ne l'a pas facturé."
                    value={fields.inspection}
                    error={errors.inspection}
                />
                <button type="submit" className="primary">Vérifier les honoraires</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
