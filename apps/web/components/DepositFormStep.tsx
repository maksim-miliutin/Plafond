"use client";

import type { FormEvent } from "react";

import { depositQuestions, type DepositErrors, type DepositFields } from "../lib/deposit-flow";
import { readForm } from "../lib/forms";
import { Choice, Typed } from "./Fields";
import { LocalForm } from "./LocalForm";
import { Brand } from "./Brand";
import { guideFor } from "../lib/guides";

export interface DepositFormProps
{
    fields: DepositFields;
    errors: DepositErrors;
    onAnswer?: (fields: DepositFields) => void;
}

const lettings: [string, string][] = [["no", "vide"], ["yes", "meublé"]];
const answers: [string, string][] = [["yes", "oui"], ["no", "non"]];

export function DepositFormStep({ fields, errors, onAnswer }: DepositFormProps)
{
    function answer(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        onAnswer?.(readForm(new FormData(event.currentTarget), Object.keys(depositQuestions) as (keyof DepositFields)[]));
    }

    return (
        <main className="screen">
            <a className="back" href="../">Toutes les vérifications</a>
            <Brand />
            <h1 className="title">Mon dépôt de garantie m'a-t-il été rendu à temps ?</h1>
            <p className="lead">
                Le propriétaire doit rendre le dépôt un mois après la remise des clés, deux mois si l'état des lieux de sortie
                diffère de celui d'entrée. Chaque mois de retard commencé lui coûte 10&nbsp;% du loyer hors charges.
            </p>
            <a className="rule" href={`../guides/${guideFor("depot/").slug}/`}>Comprendre la règle</a>
            <LocalForm className="stack form" noValidate onSubmit={answer}>
                <h2 className="section">Le logement</h2>
                <Typed id="address" label="Adresse du logement quitté" type="address" value={fields.address} error={errors.address} />
                <Typed id="rent" label="Loyer mensuel hors charges" value={fields.rent} error={errors.rent} />
                <Typed id="paid" label="Dépôt de garantie versé" value={fields.paid} error={errors.paid} />
                <Choice name="furnished" legend="Location" options={lettings} value={fields.furnished} error={errors.furnished} />
                <h2 className="section">Le départ</h2>
                <Typed id="keysOn" label="Date de remise des clés" type="date" value={fields.keysOn} error={errors.keysOn} />
                <Choice
                    name="conforming"
                    legend={"L'état des lieux de sortie est-il conforme à celui d'entrée\u00A0?"}
                    options={answers}
                    value={fields.conforming}
                    error={errors.conforming}
                />
                <Choice
                    name="addressGiven"
                    legend={"Avez-vous donné votre nouvelle adresse au propriétaire\u00A0?"}
                    options={answers}
                    value={fields.addressGiven}
                    error={errors.addressGiven}
                />
                <h2 className="section">La restitution</h2>
                <Typed
                    id="returned"
                    label="Montant déjà restitué"
                    hint="Laissez vide si vous n'avez rien reçu."
                    value={fields.returned}
                    error={errors.returned}
                />
                <Typed id="returnedOn" label="Date de cette restitution" type="date" value={fields.returnedOn} error={errors.returnedOn} />
                <button type="submit" className="primary">Vérifier mon dépôt</button>
            </LocalForm>
            <aside className="note">
                <p>Le calcul se fait sur votre appareil. Rien ne quitte votre appareil et rien n'est enregistré.</p>
            </aside>
            <p className="fine">Une estimation, pas un conseil juridique. <a href="../mentions/">Mentions légales</a></p>
        </main>
    );
}
