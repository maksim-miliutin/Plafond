"use client";

import type { FormEvent } from "react";

import { chargeKinds } from "@plafond/domain";

import { amountKey, chargesKeys, type ChargesErrors, type ChargesFields } from "../lib/charges-flow";
import { readForm } from "../lib/forms";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface ChargesFormProps
{
    fields: ChargesFields;
    errors: ChargesErrors;
    onAnswer?: (fields: ChargesFields) => void;
}

const tasks: [string, string][] = [
    ["both", "l'entretien des parties communes et les ordures"],
    ["one", "l'un des deux seulement"],
    ["employee", "c'est un employé d'immeuble, pas un gardien"],
];

export function ChargesFormStep({ fields, errors, onAnswer }: ChargesFormProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), chargesKeys));
    }

    const value = (key: string) => fields[key] ?? "";

    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <p className="wordmark">Plafond</p>
            <h1 className="title">Ma régularisation de charges est-elle juste ?</h1>
            <p className="lead">
                Le propriétaire ne peut vous facturer que les charges énumérées par le décret du 26 août 1987. Reportez les postes de
                votre décompte annuel : Plafond met à part ceux qu'il n'a pas le droit de vous faire payer.
            </p>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le logement</h2>
                <Typed id="address" label="Adresse du logement" type="address" value={value("address")} error={errors.address} />
                <h2 className="section">La régularisation</h2>
                <Typed id="year" label="Année des charges" value={value("year")} error={errors.year} />
                <Typed id="receivedOn" label="Date de réception du décompte" type="date" value={value("receivedOn")} error={errors.receivedOn} />
                <Typed
                    id="provisions"
                    label="Provisions versées sur l'année"
                    hint="Le total des provisions pour charges payées avec le loyer."
                    value={value("provisions")}
                    error={errors.provisions}
                />
                <h2 className="section">Les postes du décompte</h2>
                <p className="hint">Reportez le montant de chaque poste, et laissez vides ceux qui n'y figurent pas.</p>
                {chargeKinds.map((kind) => (
                    <div key={kind.id} className="stack">
                        <Typed id={amountKey(kind.id)} label={kind.name} value={value(amountKey(kind.id))} error={errors[amountKey(kind.id)]} />
                        {kind.verdict === "caretaker" && (
                            <Choice
                                name="caretaker"
                                legend={"Que fait le gardien\u00A0?"}
                                options={tasks}
                                value={value("caretaker")}
                                error={errors.caretaker}
                            />
                        )}
                    </div>
                ))}
                {errors.lines !== undefined && <p className="error" role="alert">{errors.lines}</p>}
                <button type="submit" className="primary">Vérifier ma régularisation</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
