"use client";

import type { FormEvent } from "react";

import { frenchDay, periods, rooms } from "@plafond/domain";

import type { Gap } from "../lib/flow";
import { fieldsFrom, type FieldErrors, type LeaseFields } from "../lib/lease";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface LeaseProps
{
    fields: LeaseFields;
    errors: FieldErrors;
    noRate?: Gap | null;
    onAnswer?: (fields: LeaseFields) => void;
    onBack?: () => void;
}

const lettings: [string, string][] = [
    ["no", "vide"],
    ["yes", "meublée"],
];

const answers: [string, string][] = [
    ["yes", "oui"],
    ["no", "non"],
];

export function LeaseStep({ fields, errors, noRate = null, onAnswer, onBack }: LeaseProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(fieldsFrom(new FormData(event.currentTarget)));
    }

    return (
        <main className="screen">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Retour au quartier</button>}
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
                {noRate !== null && (
                    <p className="error" role="alert">
                        Aucun loyer de référence n'est disponible pour cette date de signature. {gapText(noRate)}
                    </p>
                )}
                <button type="submit" className="primary">Vérifier mon loyer</button>
            </LocalForm>
        </main>
    );
}

function gapText(gap: Gap): string
{
    switch (gap.side)
    {
        case "before":
            return `L'encadrement des loyers s'applique aux baux signés à partir du ${frenchDay(gap.from)}.`;

        case "after":
            return `Plafond ne connaît pas encore d'arrêté pour cette date\u00A0: le plus récent s'applique jusqu'au ${frenchDay(gap.until)}.`;

        case "between":
            return "Aucun arrêté ne couvre ce quartier à cette date.";
    }
}

