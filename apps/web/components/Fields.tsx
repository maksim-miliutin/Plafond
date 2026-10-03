"use client";

import { useState } from "react";

import { frenchDay, isDay } from "@plafond/domain";

export interface ChoiceProps
{
    name: string;
    legend: string;
    options: [string, string][];
    value: string;
    error: string | undefined;
}

export function Choice({ name, legend, options, value, error }: ChoiceProps)
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

export interface TypedProps
{
    id: string;
    label: string;
    hint?: string;
    type?: "text" | "date";
    value: string;
    error: string | undefined;
}

export function Typed({ id, label, hint, type = "text", value, error }: TypedProps)
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
                type={type}
                inputMode={type === "text" ? "decimal" : undefined}
                defaultValue={value}
                onChange={(event) => setTyped(event.currentTarget.value)}
                className="field"
                aria-invalid={error === undefined ? undefined : true}
                aria-describedby={notes.length === 0 ? undefined : notes.join(" ")}
            />
            {spelled && <p id={`${id}-read`} className="hint">Soit le {frenchDay(typed)}.</p>}
            {error !== undefined && <p id={`${id}-error`} className="error">{error}</p>}
        </div>
    );
}
