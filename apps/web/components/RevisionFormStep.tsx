"use client";

import type { FormEvent } from "react";

import { readForm } from "../lib/forms";
import { guideFor } from "../lib/guides";
import { revisionQuestions, type RevisionErrors, type RevisionFields } from "../lib/revision-flow";
import { Brand } from "./Brand";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface RevisionFormProps
{
    fields: RevisionFields;
    errors: RevisionErrors;
    onAnswer?: (fields: RevisionFields) => void;
}

const clauses: [string, string][] = [["yes", "oui"], ["no", "non"], ["unknown", "je ne sais pas"]];
const quarters: [string, string][] = [
    ["1", "1er trimestre"],
    ["2", "2e trimestre"],
    ["3", "3e trimestre"],
    ["4", "4e trimestre"],
    ["none", "le bail n'en indique pas"],
];

export function RevisionFormStep({ fields, errors, onAnswer }: RevisionFormProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(revisionQuestions) as (keyof RevisionFields)[]));
    }

    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Ma hausse de loyer respecte-t-elle l'indice ?</h1>
            <p className="lead">
                Une fois par an, si le bail le prévoit, le loyer peut augmenter, au plus de la variation de l'indice de référence des loyers
                publié par l'Insee.
            </p>
            <a className="rule" href={`../guides/${guideFor("revision/").slug}/`}>Comprendre la règle</a>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le bail</h2>
                <Typed id="address" label="Adresse du logement" type="address" value={fields.address} error={errors.address} />
                <Choice
                    name="clause"
                    legend={"Le bail contient-il une clause de révision du loyer ?"}
                    options={clauses}
                    value={fields.clause}
                    error={errors.clause}
                />
                <Choice
                    name="quarter"
                    legend="Trimestre de référence de l'indice indiqué au bail"
                    options={quarters}
                    value={fields.quarter}
                    error={errors.quarter}
                />
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} />
                <Typed
                    id="revisedOn"
                    label="Date de révision prévue au bail"
                    hint="À défaut, la date anniversaire du bail."
                    type="date"
                    value={fields.revisedOn}
                    error={errors.revisedOn}
                />
                <h2 className="section">La hausse</h2>
                <Typed id="rent" label="Loyer hors charges avant la hausse" value={fields.rent} error={errors.rent} />
                <Typed id="asked" label="Loyer hors charges demandé" value={fields.asked} error={errors.asked} />
                <Typed
                    id="askedOn"
                    label="Date de la demande du propriétaire"
                    hint="Celle de sa lettre ou de son message."
                    type="date"
                    value={fields.askedOn}
                    error={errors.askedOn}
                />
                <button type="submit" className="primary">Vérifier la hausse</button>
            </LocalForm>
            <aside className="note">
                <p>
                    Plafond utilise l'indice de la France hexagonale&nbsp;; la Corse et l'outre-mer ont leurs propres valeurs. Le calcul se
                    fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.
                </p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
