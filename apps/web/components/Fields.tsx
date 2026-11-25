"use client";

import { useState } from "react";

import { frenchDay, isDay } from "@plafond/domain";

export interface ChoiceProps
{
    name: string;
    legend: string;
    hint?: string;
    options: [string, string][];
    value: string;
    error: string | undefined;
}

export function Choice({ name, legend, hint, options, value, error }: ChoiceProps)
{
    const described = [hint === undefined ? null : `${name}-hint`, error === undefined ? null : `${name}-error`].filter((id) => id !== null).join(" ");

    return (
        <fieldset className="choice" aria-describedby={described === "" ? undefined : described}>
            <legend className="label">{legend}</legend>
            {hint !== undefined && <p id={`${name}-hint`} className="hint">{hint}</p>}
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

export interface TypedProps
{
    id: string;
    label: string;
    hint?: string;
    type?: "text" | "date" | "address";
    value: string;
    error: string | undefined;
    onValue?: (value: string) => void;  // for a form that fills in another answer from this one
}

export function Typed({ id, label, hint, type = "text", value, error, onValue }: TypedProps)
{
    const [typed, setTyped] = useState(value);
    const spelled = type === "date" && isDay(typed);
    const notes = [
        hint === undefined ? null : `${id}-hint`,
        spelled ? `${id}-read` : null,
        error === undefined ? null : `${id}-error`,
    ].filter((note) => note !== null);

    return (
        <div className="typed">
            <label htmlFor={id} className="label">{label}</label>
            {hint !== undefined && <p id={`${id}-hint`} className="hint">{hint}</p>}
            <input
                id={id}
                name={id}
                type={type === "address" ? "text" : type}
                inputMode={type === "text" ? "decimal" : undefined}
                autoComplete={type === "address" ? "street-address" : undefined}
                defaultValue={value}
                onChange={(event) =>
                {
                    setTyped(event.currentTarget.value);
                    onValue?.(event.currentTarget.value);
                }}
                className="field"
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={notes.length === 0 ? undefined : notes.join(" ")}
            />
            {spelled && <p id={`${id}-read`} className="hint">Soit le {frenchDay(typed)}.</p>}
            {error !== undefined && <p id={`${id}-error`} className="error">{error}</p>}
        </div>
    );
}

export interface PickedProps
{
    id: string;
    label: string;
    hint?: string;
    prompt: string;  // the first line, before anything is picked
    options: [string, string][];
    value: string;
    error: string | undefined;
}

export function Picked({ id, label, hint, prompt, options, value, error }: PickedProps)
{
    const notes = [hint === undefined ? null : `${id}-hint`, error === undefined ? null : `${id}-error`].filter((note) => note !== null);

    return (
        <div className="typed">
            <label htmlFor={id} className="label">{label}</label>
            {hint !== undefined && <p id={`${id}-hint`} className="hint">{hint}</p>}
            <select
                id={id}
                name={id}
                defaultValue={value}
                className="field"
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={notes.length === 0 ? undefined : notes.join(" ")}
            >
                <option value="">{prompt}</option>
                {options.map(([option, text]) => <option key={option} value={option}>{text}</option>)}
            </select>
            {error !== undefined && <p id={`${id}-error`} className="error">{error}</p>}
        </div>
    );
}
