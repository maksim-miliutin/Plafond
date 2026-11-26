"use client";

import { useState, type FormEvent } from "react";

import { readForm } from "../lib/forms";
import { labelOf, type RegionCommune } from "../lib/region";
import { asked, relocationStart, type RelocationErrors, type RelocationFields } from "../lib/relocation-flow";
import { Brand } from "./Brand";
import { Choice, Listed, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface RelocationFormProps
{
    fields: RelocationFields;
    errors: RelocationErrors;
    communes: readonly RegionCommune[];
    onAnswer?: (fields: RelocationFields) => void;
}

const firsts: [string, string][] = [["no", "non, il a déjà été loué"], ["yes", "oui, c'est sa première location"], ["unknown", "je ne sais pas"]];
const labels: [string, string][] = [..."ABCDEFG"].map((label): [string, string] => [label, label]).concat([["unknown", "je ne sais pas"]]);
const vacancies: [string, string][] = [["within", "non, 18 mois au plus"], ["beyond", "oui, plus de 18 mois"], ["unknown", "je ne sais pas"]];
const revisions: [string, string][] = [["yes", "oui"], ["no", "non"], ["unknown", "je ne sais pas"]];
const bases: [string, string][] = [
    ["none", "non"],
    ["works", "oui, par des travaux d'amélioration"],
    ["undervalued", "oui, par un ancien loyer trop bas"],
    ["unknown", "je ne sais pas"],
];

export function RelocationFormStep({ fields, errors, communes, onAnswer }: RelocationFormProps)
{
    // The answers that decide which other questions the case needs, followed as the tenant ticks them.
    const [deciding, setDeciding] = useState({ first: fields.first, dpe: fields.dpe });
    const needed = asked({ ...fields, ...deciding });
    const named = [...communes].sort((a, b) => a.name.localeCompare(b.name, "fr")).map(labelOf);

    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(relocationStart.fields) as (keyof RelocationFields)[]));
    }

    function follow({ name, value }: HTMLInputElement)
    {
        if (name === "first" || name === "dpe")
        {
            setDeciding((current) => ({ ...current, [name]: value }));
        }
    }

    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">La hausse de loyer à la relocation est-elle permise&nbsp;?</h1>
            <p className="lead">
                En zone tendue, le loyer d'un nouveau bail ne peut en principe pas dépasser celui du locataire précédent, révisé selon l'indice
                de référence des loyers.
            </p>
            <a className="rule" href="https://www.service-public.gouv.fr/particuliers/vosdroits/F1314" rel="noopener">Comprendre la règle</a>
            <LocalForm className="stack form" noValidate onSubmit={answer} onChange={(event: { target: EventTarget | null }) => follow(event.target as HTMLInputElement)}>
                <h2 className="section">Votre bail</h2>
                <Listed
                    key={fields.commune}
                    id="commune"
                    label="Commune du logement"
                    hint="Une commune d'Île-de-France ou de la Métropole de Lyon, avec son département."
                    listed={named}
                    value={fields.commune}
                    error={errors.commune}
                />
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} />
                <Typed id="proposed" label="Loyer hors charges de votre bail" value={fields.proposed} error={errors.proposed} />
                <h2 className="section">Le logement</h2>
                <Choice name="first" legend={"Est-ce la première location du logement\u00A0?"} options={firsts} value={fields.first} error={errors.first} />
                {needed.includes("dpe") && (
                    <Choice
                        name="dpe"
                        legend="Classe énergie du logement (DPE)"
                        hint="Elle figure sur le diagnostic de performance énergétique joint au bail."
                        options={labels}
                        value={fields.dpe}
                        error={errors.dpe}
                    />
                )}
                {needed.includes("vacancy") && (
                    <Choice
                        name="vacancy"
                        legend={"Avant votre bail, le logement est-il resté vide plus de 18 mois\u00A0?"}
                        hint="Du départ du locataire précédent à la signature de votre bail. 18 mois tout juste, c'est non."
                        options={vacancies}
                        value={fields.vacancy}
                        error={errors.vacancy}
                    />
                )}
                {needed.includes("lastRent") && (
                    <>
                        <h2 className="section">Le loyer précédent</h2>
                        <Typed
                            id="lastRent"
                            label="Dernier loyer hors charges du locataire précédent"
                            hint="Le bail doit l'indiquer si ce locataire est parti moins de 18 mois avant la signature. Laissez vide si vous ne le connaissez pas."
                            value={fields.lastRent}
                            error={errors.lastRent}
                        />
                    </>
                )}
                {needed.includes("revised") && (
                    <Choice name="revised" legend={"Ce loyer a-t-il été révisé dans les 12 mois avant votre bail\u00A0?"} options={revisions} value={fields.revised} error={errors.revised} />
                )}
                {needed.includes("basis") && (
                    <Choice
                        name="basis"
                        legend={"Le bail justifie-t-il un loyer plus élevé\u00A0?"}
                        hint="Par des travaux faits depuis le départ du locataire précédent, ou par un ancien loyer très inférieur à ceux du quartier."
                        options={bases}
                        value={fields.basis}
                        error={errors.basis}
                    />
                )}
                <button type="submit" className="primary">Vérifier la hausse</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
