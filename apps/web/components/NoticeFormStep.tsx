"use client";

import type { FormEvent } from "react";

import { noticeQuestions, otherReasons, type NoticeErrors, type NoticeFields } from "../lib/notice-flow";
import { readForm } from "../lib/forms";
import { guideFor } from "../lib/guides";
import { Brand } from "./Brand";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface NoticeFormProps
{
    fields: NoticeFields;
    errors: NoticeErrors;
    onAnswer?: (fields: NoticeFields) => void;
}

const lettings: [string, string][] = [["no", "vide"], ["yes", "meublé"]];
const zones: [string, string][] = [["yes", "oui"], ["no", "non"], ["unknown", "je ne sais pas"]];
const reasons: [string, string][] = [["none", "Aucun de ces motifs"], ...otherReasons.map((reason): [string, string] => [reason.id, reason.label])];

export function NoticeFormStep({ fields, errors, onAnswer }: NoticeFormProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(noticeQuestions) as (keyof NoticeFields)[]));
    }

    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Combien de temps dure mon préavis ?</h1>
            <p className="lead">
                Trois mois pour un logement vide, un mois pour un meublé, en zone tendue ou pour certains motifs. Le préavis court à
                partir du jour où le propriétaire reçoit votre lettre.
            </p>
            <a className="rule" href={`../guides/${guideFor("preavis/").slug}/`}>Comprendre la règle</a>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le logement</h2>
                <Typed id="address" label="Adresse du logement" type="address" value={fields.address} error={errors.address} />
                <Typed id="rent" label="Loyer mensuel charges comprises" value={fields.rent} error={errors.rent} />
                <Choice name="furnished" legend="Location" options={lettings} value={fields.furnished} error={errors.furnished} />
                <h2 className="section">Pour un logement vide</h2>
                <p className="hint">
                    Paris, Lyon, Marseille, Lille, Bordeaux, Toulouse et la plupart des grandes agglomérations sont en zone tendue.
                </p>
                <Choice
                    name="tense"
                    legend={"Le logement est-il en zone tendue ?"}
                    options={zones}
                    value={fields.tense}
                    error={errors.tense}
                />
                <Choice
                    name="reason"
                    legend={"Un autre motif réduit-il votre préavis à un mois ?"}
                    options={reasons}
                    value={fields.reason}
                    error={errors.reason}
                />
                <h2 className="section">La lettre</h2>
                <Typed
                    id="receivedOn"
                    label="Date de réception de la lettre par le propriétaire"
                    hint="Celle de l'accusé de réception ou de la remise en main propre. Si la lettre n'est pas encore partie, indiquez la date prévue."
                    type="date"
                    value={fields.receivedOn}
                    error={errors.receivedOn}
                />
                <button type="submit" className="primary">Calculer mon préavis</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
