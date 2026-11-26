"use client";

import { useState, type FormEvent } from "react";

import { isDay, type Day } from "@plafond/domain";

import { feeZoneNote, feeZoneOn, type KnownCommune } from "../lib/commune-zone";
import { feesQuestions, type FeesErrors, type FeesFields } from "../lib/fees-flow";
import { readForm } from "../lib/forms";
import { guideFor } from "../lib/guides";
import { Brand } from "./Brand";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";

export interface FeesFormProps
{
    fields: FeesFields;
    errors: FeesErrors;
    onAnswer?: (fields: FeesFields) => void;
    commune?: KnownCommune;  // named by the link that opened the form
    today?: Day;  // the day the zone is read for until the lease's date is typed
}

const zones: [string, string][] = [["very-tense", "zone très tendue"], ["tense", "zone tendue"], ["other", "ailleurs"], ["unknown", "je ne sais pas"]];

export function FeesFormStep({ fields, errors, onAnswer, commune, today = "" }: FeesFormProps)
{
    const [signedOn, setSignedOn] = useState(fields.signedOn);
    // Once the tenant picks an answer the choice stays theirs: the key that would redraw it with the filled-in one is frozen.
    const [kept, setKept] = useState<string | null>(fields.zone !== "" ? "answered" : null);
    const chosen = kept !== null;
    const day = isDay(signedOn) ? signedOn : today;
    const filled = commune === undefined ? null : feeZoneOn(commune.commune, day, commune.lists);
    const zone = commune === undefined || chosen ? fields.zone : filled ?? "";

    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(feesQuestions) as (keyof FeesFields)[]));
    }

    return (
        <main className="screen">
            <a className="back" href="../">Accueil</a>
            <Brand />
            <h1 className="title">Mes frais d'agence dépassent-ils le plafond ?</h1>
            <p className="lead">
                Pour la visite, le dossier et le bail, une agence ne peut facturer au locataire qu'un montant par m² fixé selon la zone.
                L'état des lieux d'entrée a son propre plafond.
            </p>
            <a className="rule" href={`../guides/${guideFor("frais-agence/").slug}/`}>Comprendre la règle</a>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le logement</h2>
                <Typed id="address" label="Adresse du logement" type="address" value={fields.address} error={errors.address} />
                <Typed id="surface" label="Surface habitable" hint="En m², comme au bail." value={fields.surface} error={errors.surface} />
                <p className="hint">
                    Paris et une partie de sa proche banlieue sont en zone très tendue. Lyon, Marseille, Lille, Bordeaux, Toulouse et la
                    plupart des grandes agglomérations sont en zone tendue.
                </p>
                {commune !== undefined && <p className="hint" aria-live="polite">{feeZoneNote(commune.commune, filled, commune.lists, day)}</p>}
                <div className="stack" onChange={(event) => (event.target as HTMLInputElement).name === "zone" && kept === null && setKept(`filled-${zone}`)}>
                    <Choice
                        key={kept ?? `filled-${zone}`}
                        name="zone"
                        legend={"Dans quelle zone se trouve le logement ?"}
                        options={zones}
                        value={zone}
                        error={errors.zone}
                    />
                </div>
                <h2 className="section">Le bail et les honoraires</h2>
                <Typed id="signedOn" label="Date de signature du bail" type="date" value={fields.signedOn} error={errors.signedOn} onValue={setSignedOn} />
                <Typed
                    id="letting"
                    label="Honoraires de visite, de dossier et de bail"
                    hint="Ils figurent sur la facture de l'agence et, en principe, dans le bail."
                    value={fields.letting}
                    error={errors.letting}
                />
                <Typed
                    id="inspection"
                    label="Honoraires de l'état des lieux d'entrée"
                    hint="Laissez vide si l'agence ne l'a pas facturé."
                    value={fields.inspection}
                    error={errors.inspection}
                />
                <button type="submit" className="primary">Vérifier les honoraires</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
