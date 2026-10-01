"use client";

import type { FormEvent } from "react";

import { periods, rooms } from "@plafond/domain";

import { fieldsFrom, type FieldErrors, type LeaseFields } from "../lib/lease";
import { LocalForm } from "./LocalForm";

export interface LeaseProps
{
    fields: LeaseFields;
    errors: FieldErrors;
    onAnswer?: (fields: LeaseFields) => void;
}

const lettings: [string, string][] = [
    ["no", "vide"],
    ["yes", "meublée"],
];

const answers: [string, string][] = [
    ["yes", "oui"],
    ["no", "non"],
];

export function LeaseStep({ fields, errors, onAnswer }: LeaseProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(fieldsFrom(new FormData(event.currentTarget)));
    }

    return (
        <main className="screen">
            <p className="step">Votre bail</p>
            <h1 className="title">Ce que dit votre bail</h1>
            <p className="lead">Tout figure dans le contrat de location, le plus souvent sur la première page.</p>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <Choice name="rooms" legend="Pièces principales" options={Object.entries(rooms)} value={fields.rooms} error={errors.rooms} />
                <Choice name="period" legend="Construction de l'immeuble" options={Object.entries(periods)} value={fields.period} error={errors.period} />
                <Choice name="furnished" legend="Location" options={lettings} value={fields.furnished} error={errors.furnished} />
                <Typed id="surface" label="Surface habitable" hint="En m², telle qu'indiquée au bail." value={fields.surface} error={errors.surface} />
                <Typed id="rent" label="Loyer de base" hint="Par mois, hors charges, tel qu'il figure au bail." value={fields.rent} error={errors.rent} />
                <Typed id="complement" label="Complément de loyer" hint="Laissez vide si le bail n'en prévoit pas." value={fields.complement} error={errors.complement} />
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} />
                <Typed id="startsOn" label="Date de prise d'effet" type="date" hint="Souvent la même que la signature." value={fields.startsOn} error={errors.startsOn} />
                <Choice
                    name="stated"
                    legend={"Le bail mentionne-t-il le loyer de référence et le loyer de référence majoré\u00A0?"}
                    options={answers}
                    value={fields.stated}
                    error={errors.stated}
                />
                <button type="submit" className="primary">Vérifier mon loyer</button>
            </LocalForm>
        </main>
    );
}

interface ChoiceProps
{
    name: keyof LeaseFields;
    legend: string;
    options: [string, string][];
    value: string;
    error: string | undefined;
}

function Choice({ name, legend, options, value, error }: ChoiceProps)
{
    return (
        <fieldset className="choice" aria-describedby={error === undefined ? undefined : `${name}-error`}>
            <legend className="label">{legend}</legend>
            <div className="options">
                {options.map(([option, text]) => (
                    <label key={option} className="option">
                        <input type="radio" name={name} value={option} defaultChecked={option === value} />
                        <span>{text}</span>
                    </label>
                ))}
            </div>
            {error !== undefined && <p id={`${name}-error`} className="error">{error}</p>}
        </fieldset>
    );
}

interface TypedProps
{
    id: keyof LeaseFields;
    label: string;
    hint?: string;
    type?: "text" | "date";
    value: string;
    error: string | undefined;
}

function Typed({ id, label, hint, type = "text", value, error }: TypedProps)
{
    const notes = [hint === undefined ? null : `${id}-hint`, error === undefined ? null : `${id}-error`].filter((note) => note !== null);

    return (
        <div className="typed">
            <label htmlFor={id} className="label">{label}</label>
            {hint !== undefined && <p id={`${id}-hint`} className="hint">{hint}</p>}
            <input
                id={id}
                name={id}
                type={type}
                inputMode={type === "text" ? "decimal" : undefined}
                defaultValue={value}
                className="field"
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={notes.length === 0 ? undefined : notes.join(" ")}
            />
            {error !== undefined && <p id={`${id}-error`} className="error">{error}</p>}
        </div>
    );
}
