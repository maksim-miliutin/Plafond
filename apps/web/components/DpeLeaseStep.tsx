"use client";

import type { FormEvent } from "react";

import { dpeQuestions, type DpeErrors, type DpeFields } from "../lib/dpe-flow";
import { readForm } from "../lib/forms";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface DpeLeaseProps
{
    fields: DpeFields;
    errors: DpeErrors;
    onAnswer?: (fields: DpeFields) => void;
    onBack?: () => void;
}

const lettings: [string, string][] = [["no", "vide"], ["yes", "meublée"]];
const answers: [string, string][] = [["yes", "oui"], ["no", "non"]];

export function DpeLeaseStep({ fields, errors, onAnswer, onBack }: DpeLeaseProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(dpeQuestions) as (keyof DpeFields)[]));
    }

    return (
        <main className="screen">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Changer de logement</button>}
            <p className="step">Votre bail</p>
            <h1 className="title">Ce que dit votre bail</h1>
            <p className="lead">
                Les règles dépendent de la date du bail et de ses renouvellements. Le calcul suppose un propriétaire
                particulier. Si c'est une société, un bail vide dure 6 ans et non 3.
            </p>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} />
                <Choice name="furnished" legend="Location" options={lettings} value={fields.furnished} error={errors.furnished} />
                <Choice
                    name="raised"
                    legend={"Votre loyer a-t-il augmenté depuis la signature\u00A0?"}
                    options={answers}
                    value={fields.raised}
                    error={errors.raised}
                />
                <Typed
                    id="raisedOn"
                    label="Date de l'augmentation"
                    type="date"
                    hint="Seulement si le loyer a augmenté."
                    value={fields.raisedOn}
                    error={errors.raisedOn}
                />
                <button type="submit" className="primary">Vérifier mes droits</button>
            </LocalForm>
        </main>
    );
}
