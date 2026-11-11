import { centsFrom, isDay, revision, revisionLetter } from "@plafond/domain";
import type { Day, IndexRow, Letter, Quarter, Revision, RevisionCheck } from "@plafond/domain";

export interface RevisionFields
{
    address: string;
    clause: string;
    rent: string;
    asked: string;
    quarter: string;
    signedOn: string;
    revisedOn: string;
    askedOn: string;
}

export type RevisionErrors = Partial<Record<keyof RevisionFields, string>>;

interface Reckoned
{
    fields: RevisionFields;
    lease: Revision;
    clauseAssumed: boolean;
    check: RevisionCheck;
}

export type RevisionStep =
    | { at: "form"; fields: RevisionFields; errors: RevisionErrors }
    | ({ at: "result"; letter: Letter | null } & Reckoned)
    | ({ at: "letter"; letter: Letter } & Reckoned)
    | { at: "help"; from: Extract<RevisionStep, { at: "result" }> };

export type RevisionEvent =
    | { type: "answered"; fields: RevisionFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export interface RevisionWorld
{
    on: Day;
    index: readonly IndexRow[];
}

export const revisionQuestions: Record<keyof RevisionFields, string> = {
    address: "Indiquez l'adresse du logement.",
    clause: "Indiquez si le bail contient une clause de révision.",
    rent: "Indiquez le loyer hors charges avant la hausse.",
    asked: "Indiquez le loyer hors charges que demande le propriétaire.",
    quarter: "Indiquez le trimestre de référence du bail, ou qu'il n'en indique pas.",
    signedOn: "Indiquez la date de signature du bail.",
    revisedOn: "Indiquez la date de révision prévue au bail, ou sa date anniversaire.",
    askedOn: "Indiquez la date à laquelle le propriétaire a demandé la hausse.",
};

const quarters: Record<string, Quarter | null> = { "1": 1, "2": 2, "3": 3, "4": 4, none: null };
const clauses: Record<string, boolean> = { yes: true, no: false, unknown: true };

export const revisionStart: Extract<RevisionStep, { at: "form" }> = {
    at: "form",
    fields: { address: "", clause: "", rent: "", asked: "", quarter: "", signedOn: "", revisedOn: "", askedOn: "" },
    errors: {},
};

export function nextRevision(step: RevisionStep, event: RevisionEvent, world: RevisionWorld): RevisionStep
{
    switch (event.type)
    {
        case "answered":
            return step.at === "form" ? answered(event.fields, world) : step;

        case "wrote":
            return step.at === "result" && step.letter !== null ? { ...step, at: "letter", letter: step.letter } : step;

        case "helped":
            return step.at === "result" ? { at: "help", from: step } : step;

        case "back":
            return back(step);
    }
}

function answered(fields: RevisionFields, world: RevisionWorld): RevisionStep
{
    const rent = centsFrom(fields.rent);
    const asked = centsFrom(fields.asked);
    const days = ["signedOn", "revisedOn", "askedOn"] as const;
    const errors: RevisionErrors = {
        ...(fields.address.trim() === "" ? { address: revisionQuestions.address } : {}),
        ...(Object.hasOwn(clauses, fields.clause) ? {} : { clause: revisionQuestions.clause }),
        ...(typeof rent === "number" && rent > 0 ? {} : { rent: revisionQuestions.rent }),
        ...(typeof asked === "number" && asked > 0 ? {} : { asked: revisionQuestions.asked }),
        ...(Object.hasOwn(quarters, fields.quarter) ? {} : { quarter: revisionQuestions.quarter }),
        ...Object.fromEntries(days.filter((day) => !isDay(fields[day])).map((day) => [day, revisionQuestions[day]])),
    };
    if (Object.keys(errors).length > 0 || typeof rent !== "number" || typeof asked !== "number")
    {
        return { at: "form", fields, errors };
    }

    const lease: Revision = {
        clause: clauses[fields.clause]!,
        rent,
        asked,
        quarter: quarters[fields.quarter]!,
        signedOn: fields.signedOn,
        revisedOn: fields.revisedOn,
        askedOn: fields.askedOn,
    };
    const check = revision(lease, world.index);
    const written = revisionLetter({ lease, check, address: fields.address.trim(), on: world.on });

    return { at: "result", fields, lease, clauseAssumed: fields.clause === "unknown", check, letter: written.kind === "letter" ? written : null };
}

function back(step: RevisionStep): RevisionStep
{
    switch (step.at)
    {
        case "form":
            return step;

        case "result":
            return { at: "form", fields: step.fields, errors: {} };

        case "letter":
            return { ...step, at: "result" };

        case "help":
            return step.from;
    }
}
