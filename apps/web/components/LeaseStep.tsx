"use client";

import type { FormEvent, ReactNode } from "react";

import { dwellingsApart, frenchDay, periods, periodsOf, rooms } from "@plafond/domain";
import type { City, Gap, Lapsed, Unchecked } from "@plafond/domain";

import { fieldsFrom, type FieldErrors, type LeaseFields } from "../lib/lease";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";
import { Progress } from "./Progress";

export interface LeaseProps
{
    fields: LeaseFields;
    errors: FieldErrors;
    unchecked?: Unchecked | null;
    city?: City;
    onAnswer?: (fields: LeaseFields) => void;
    onBack?: () => void;
}

const kinds: [string, string][] = [
    ["flat", "appartement"],
    ["house", "maison"],
];

// Article 2 of the decrees for Est Ensemble and Plaine Commune: a house is a building with a single dwelling, any other
// dwelling is a flat, and semi-detached buildings or a building divided vertically count as separate buildings.
const houseIs = "Une maison est un bâtiment qui ne compte qu'un seul logement\u00A0; tout autre logement est un appartement. Deux "
    + "maisons mitoyennes comptent comme deux bâtiments.";

const lettings: [string, string][] = [
    ["no", "vide"],
    ["yes", "meublée"],
];

const answers: [string, string][] = [
    ["yes", "oui"],
    ["no", "non"],
];

export function LeaseStep({ fields, errors, unchecked = null, city = "paris", onAnswer, onBack }: LeaseProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(fieldsFrom(new FormData(event.currentTarget)));
    }

    return (
        <main className="screen">
            {onBack !== undefined && <button type="button" className="back" onClick={onBack}>Retour au quartier</button>}
            <Progress at={3} of={4} label="votre bail" />
            <h1 className="title">Ce que dit votre bail</h1>
            <p className="lead">Tout figure dans le contrat de location, le plus souvent sur la première page.</p>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                {dwellingsApart[city] && <Choice name="dwelling" legend="Type de logement" hint={houseIs} options={kinds} value={fields.dwelling} error={errors.dwelling} />}
                <Choice name="rooms" legend="Pièces principales" options={Object.entries(rooms)} value={fields.rooms} error={errors.rooms} />
                <Choice name="period" legend={dwellingsApart[city] ? "Construction du bâtiment" : "Construction de l'immeuble"} options={periodsOf[city].map((period) => [period, periods[period]])} value={fields.period} error={errors.period} />
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
                {unchecked !== null && <p className="error" role="alert">{unchecked.kind === "lapsed" ? lapsedText(unchecked) : noRateText(unchecked)}</p>}
                <button type="submit" className="primary">Vérifier mon loyer</button>
            </LocalForm>
        </main>
    );
}

function lapsedText(lapsed: Lapsed): ReactNode
{
    return (
        <>
            Plafond ne peut pas vérifier un bail signé après le {frenchDay(lapsed.lastDay)}&nbsp;: c'est le dernier jour où s'applique le
            texte qui prévoit l'encadrement des loyers (<a href={lapsed.url}>{lapsed.title}</a>), et Plafond ne connaît pas encore de
            texte publié qui le prolonge.
        </>
    );
}

// Past the latest decree the law still runs: what is missing is the next decree's table, not the control itself.
function noRateText(gap: Gap): ReactNode
{
    const missing = gap.side === "after"
        ? "Données officielles indisponibles pour cette date de bail."
        : "Aucun loyer de référence n'est disponible pour cette date de signature.";

    return <>{missing} {gapText(gap)}</>;
}

function gapText(gap: Gap): ReactNode
{
    switch (gap.side)
    {
        case "before":
            return `L'encadrement des loyers s'applique aux baux signés à partir du ${frenchDay(gap.from)}.`;

        case "after":
            return (
                <>
                    Plafond ne connaît pas encore d'arrêté pour cette date&nbsp;: le plus récent (<a href={gap.url}>{gap.title}</a>)
                    s'applique jusqu'au {frenchDay(gap.until)}.
                </>
            );

        case "between":
            return "Plafond ne dispose pas encore des loyers de référence de cette période.";
    }
}

