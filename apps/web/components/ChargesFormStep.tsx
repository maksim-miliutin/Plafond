"use client";

import type { FormEvent } from "react";

import { chargeKinds, type ChargeKind } from "@plafond/domain";

import { amountKey, chargesKeys, type ChargesErrors, type ChargesFields } from "../lib/charges-flow";
import { readForm } from "../lib/forms";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";
import { Brand } from "./Brand";
import { guideFor } from "../lib/guides";

export interface ChargesFormProps
{
    fields: ChargesFields;
    errors: ChargesErrors;
    onAnswer?: (fields: ChargesFields) => void;
}

// The lines most yearly statements carry stay in sight; these six are rarer and fold away until one is needed.
const rare: ReadonlySet<string> = new Set(["outdoors", "hygiene", "equipment", "works", "replacement", "legal-fees"]);

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
    const opened = [...rare].some((id) => value(amountKey(id)).trim() !== "" || errors[amountKey(id)] !== undefined);

    function line(kind: ChargeKind)
    {
        const id = amountKey(kind.id);
        const error = errors[id];

        return (
            <div key={kind.id} className="amount-row">
                <label htmlFor={id}>{kind.name}</label>
                <span className="amount-input">
                    <input
                        id={id}
                        name={id}
                        type="text"
                        inputMode="decimal"
                        defaultValue={value(id)}
                        className="field"
                        aria-invalid={error === undefined ? undefined : true}
                        aria-describedby={error === undefined ? undefined : `${id}-error`}
                    />
                    <span aria-hidden="true">€</span>
                </span>
                {error !== undefined && <p id={`${id}-error`} className="error">{error}</p>}
            </div>
        );
    }

    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Ma régularisation de charges est-elle juste ?</h1>
            <p className="lead">
                Le propriétaire ne peut vous facturer que les charges énumérées par le décret du 26 août 1987. Reportez les postes de
                votre décompte annuel : Plafond met à part ceux qu'il n'a pas le droit de vous faire payer.
            </p>
            <a className="rule" href={`../guides/${guideFor("charges/").slug}/`}>Comprendre la règle</a>
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
                <section className="lines">
                    <h2 className="section">Les postes du décompte</h2>
                    <p className="hint">Reportez le montant de chaque poste, et laissez vides ceux qui n'y figurent pas.</p>
                    {chargeKinds.filter((kind) => !rare.has(kind.id)).map(line)}
                    <details className="more" open={opened || undefined}>
                        <summary>Autres postes&nbsp;: espaces verts, interphone, travaux, avocat</summary>
                        {chargeKinds.filter((kind) => rare.has(kind.id)).map(line)}
                    </details>
                </section>
                <div className="question">
                    <Choice
                        name="caretaker"
                        legend={"Que fait le gardien, s'il y en a un\u00A0?"}
                        options={tasks}
                        value={value("caretaker")}
                        error={errors.caretaker}
                    />
                </div>
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
