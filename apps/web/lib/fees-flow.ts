import { agencyFees, agencyLetter, centsFrom, hundredthsFrom, isDay } from "@plafond/domain";
import type { AgencyFees, Day, FeeCaps, FeesCheck, FeeZone, Letter, NoCaps } from "@plafond/domain";

export interface FeesFields
{
    address: string;
    zone: string;
    surface: string;
    signedOn: string;
    letting: string;
    inspection: string;
}

export type FeesErrors = Partial<Record<keyof FeesFields, string>>;

interface Reckoned
{
    fields: FeesFields;
    paid: AgencyFees;
    check: FeesCheck | NoCaps;
}

export type FeesStep =
    | { at: "form"; fields: FeesFields; errors: FeesErrors }
    | ({ at: "result"; letter: Letter | null } & Reckoned)
    | ({ at: "letter"; letter: Letter } & Reckoned)
    | { at: "help"; from: Extract<FeesStep, { at: "result" }> };

export type FeesEvent =
    | { type: "answered"; fields: FeesFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export interface FeesWorld
{
    on: Day;
    caps: readonly FeeCaps[];
}

export const feesQuestions: Record<keyof FeesFields, string> = {
    address: "Indiquez l'adresse du logement.",
    zone: "Indiquez la zone du logement, ou que vous ne la connaissez pas.",
    surface: "Indiquez la surface habitable inscrite au bail.",
    signedOn: "Indiquez la date de signature du bail.",
    letting: "Indiquez les honoraires facturés pour la visite, le dossier et le bail, 0 s'il n'y en a pas.",
    inspection: "Indiquez les honoraires de l'état des lieux, ou laissez vide.",
};

const zones: Record<string, FeeZone | null> = { "very-tense": "very-tense", tense: "tense", other: "other", unknown: null };

export const feesStart: Extract<FeesStep, { at: "form" }> = {
    at: "form",
    fields: { address: "", zone: "", surface: "", signedOn: "", letting: "", inspection: "" },
    errors: {},
};

export function nextFees(step: FeesStep, event: FeesEvent, world: FeesWorld): FeesStep
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

function answered(fields: FeesFields, world: FeesWorld): FeesStep
{
    const surface = hundredthsFrom(fields.surface);
    const letting = centsFrom(fields.letting);
    const inspection = fields.inspection.trim() === "" ? 0 : centsFrom(fields.inspection);
    const errors: FeesErrors = {
        ...(fields.address.trim() === "" ? { address: feesQuestions.address } : {}),
        ...(Object.hasOwn(zones, fields.zone) ? {} : { zone: feesQuestions.zone }),
        ...(typeof surface === "number" && surface > 0 ? {} : { surface: feesQuestions.surface }),
        ...(isDay(fields.signedOn) ? {} : { signedOn: feesQuestions.signedOn }),
        ...(typeof letting === "number" ? {} : { letting: feesQuestions.letting }),
        ...(typeof inspection === "number" ? {} : { inspection: feesQuestions.inspection }),
    };
    if (Object.keys(errors).length > 0 || typeof surface !== "number" || typeof letting !== "number" || typeof inspection !== "number")
    {
        return { at: "form", fields, errors };
    }

    const paid: AgencyFees = { zone: zones[fields.zone]!, surface, letting, inspection, signedOn: fields.signedOn };
    const check = agencyFees(paid, world.caps);
    const written = agencyLetter({ paid, check, address: fields.address.trim(), on: world.on });

    return { at: "result", fields, paid, check, letter: written.kind === "letter" ? written : null };
}

function back(step: FeesStep): FeesStep
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
