import { centsFrom, isDay, relocation } from "@plafond/domain";
import type { Basis, IndexRow, Label, Relocation, RelocationCheck, RelocationPeriod, Vacancy } from "@plafond/domain";
import type { CommuneZone, ZoneLists } from "@plafond/import";

import { tenseOn } from "./commune-zone";

export interface RelocationFields
{
    commune: string;
    signedOn: string;
    proposed: string;
    first: string;
    dpe: string;
    vacancy: string;
    lastRent: string;
    revised: string;
    basis: string;
}

export type RelocationErrors = Partial<Record<keyof RelocationFields, string>>;

interface Reckoned
{
    fields: RelocationFields;
    commune: CommuneZone;
    capped: boolean;
    lease: Relocation;
    firstAssumed: boolean;
    basisAssumed: boolean;
    check: RelocationCheck;
}

export type RelocationStep =
    | { at: "form"; fields: RelocationFields; errors: RelocationErrors }
    | ({ at: "result" } & Reckoned)
    | { at: "help"; from: Extract<RelocationStep, { at: "result" }> };

export type RelocationEvent =
    | { type: "answered"; fields: RelocationFields }
    | { type: "helped" }
    | { type: "back" };

export interface RelocationWorld
{
    communes: readonly CommuneZone[];
    lists: ZoneLists;
    capped: readonly string[];  // the codes of the communes whose rents a decree caps
    periods: readonly RelocationPeriod[];
    index: readonly IndexRow[];
}

export const relocationQuestions: Record<keyof RelocationFields, string> = {
    commune: "Choisissez la commune du logement.",
    signedOn: "Indiquez la date de signature du bail.",
    proposed: "Indiquez le loyer hors charges de votre bail.",
    first: "Indiquez si c'est la première location du logement.",
    dpe: "Indiquez la classe énergie du logement, ou que vous ne la connaissez pas.",
    vacancy: "Indiquez combien de temps le logement est resté vide, ou que vous ne le savez pas.",
    lastRent: "Indiquez le dernier loyer hors charges en euros, ou laissez la case vide.",
    revised: "Indiquez si ce loyer a été révisé dans l'année, ou que vous ne le savez pas.",
    basis: "Indiquez ce qui justifie la hausse selon le bail, ou que vous ne le savez pas.",
};

const answers: Record<"first" | "dpe" | "vacancy" | "revised" | "basis", readonly string[]> = {
    first: ["no", "yes", "unknown"],
    dpe: ["A", "B", "C", "D", "E", "F", "G", "unknown"],
    vacancy: ["within", "beyond", "unknown"],
    revised: ["yes", "no", "unknown"],
    basis: ["none", "works", "undervalued", "unknown"],
};

export const relocationStart: Extract<RelocationStep, { at: "form" }> = {
    at: "form",
    fields: { commune: "", signedOn: "", proposed: "", first: "", dpe: "", vacancy: "", lastRent: "", revised: "", basis: "" },
    errors: {},
};

// The questions a case needs, in the order the form asks them: a first letting has no last rent, and an F or G dwelling
// keeps its last rent whatever the vacancy, the revision or the landlord's reason.
export function asked(fields: RelocationFields): (keyof RelocationFields)[]
{
    const always: (keyof RelocationFields)[] = ["commune", "signedOn", "proposed", "first"];
    if (fields.first === "yes")
    {
        return always;
    }

    return fields.dpe === "F" || fields.dpe === "G"
        ? [...always, "dpe", "lastRent"]
        : [...always, "dpe", "vacancy", "lastRent", "revised", "basis"];
}

export function nextRelocation(step: RelocationStep, event: RelocationEvent, world: RelocationWorld): RelocationStep
{
    switch (event.type)
    {
        case "answered":
            return step.at === "form" ? answered(event.fields, world) : step;

        case "helped":
            return step.at === "result" ? { at: "help", from: step } : step;

        case "back":
            if (step.at === "result")
            {
                return { at: "form", fields: step.fields, errors: {} };
            }

            return step.at === "help" ? step.from : step;
    }
}

function answered(fields: RelocationFields, world: RelocationWorld): RelocationStep
{
    const needed = asked(fields);
    const commune = world.communes.find((one) => one.code === fields.commune);
    const proposed = centsFrom(fields.proposed);
    const lastRent = fields.lastRent.trim() === "" ? null : centsFrom(fields.lastRent);
    const unanswered = (["first", "dpe", "vacancy", "revised", "basis"] as const).filter((key) => needed.includes(key) && !answers[key].includes(fields[key]));
    const errors: RelocationErrors = {
        ...(commune === undefined ? { commune: relocationQuestions.commune } : {}),
        ...(isDay(fields.signedOn) ? {} : { signedOn: relocationQuestions.signedOn }),
        ...(typeof proposed === "number" && proposed > 0 ? {} : { proposed: relocationQuestions.proposed }),
        ...(needed.includes("lastRent") && lastRent !== null && !(typeof lastRent === "number" && lastRent > 0) ? { lastRent: relocationQuestions.lastRent } : {}),
        ...Object.fromEntries(unanswered.map((key) => [key, relocationQuestions[key]])),
    };
    if (Object.keys(errors).length > 0 || commune === undefined || typeof proposed !== "number" || (lastRent !== null && typeof lastRent !== "number"))
    {
        return { at: "form", fields, errors };
    }

    const lease: Relocation = {
        signedOn: fields.signedOn,
        tense: tenseOn(commune, fields.signedOn, world.lists),
        firstLetting: fields.first === "yes",
        dpe: fields.dpe === "unknown" || fields.dpe === "" ? null : fields.dpe as Label,
        vacancy: fields.vacancy === "within" || fields.vacancy === "beyond" ? fields.vacancy as Vacancy : null,
        lastRent,
        revised: fields.revised === "yes" ? true : fields.revised === "no" ? false : null,
        basis: fields.basis === "works" || fields.basis === "undervalued" ? fields.basis as Basis : "none",
        proposed,
    };

    return {
        at: "result",
        fields,
        commune,
        capped: world.capped.includes(commune.code),
        lease,
        firstAssumed: fields.first === "unknown",
        basisAssumed: needed.includes("basis") && fields.basis === "unknown",
        check: relocation(lease, world.periods, world.index),
    };
}
