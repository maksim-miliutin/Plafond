import { centsFrom, chargeKinds, charges, chargesLetter, isDay } from "@plafond/domain";
import type { CaretakerCase, ChargeLine, ChargesCheck, Day, Letter, Regularisation } from "@plafond/domain";

export type ChargesFields = Record<string, string>;
export type ChargesErrors = Record<string, string>;

interface Reckoned
{
    on: Day;
    fields: ChargesFields;
    regularised: Regularisation;
    check: ChargesCheck;
}

export type ChargesStep =
    | { at: "form"; fields: ChargesFields; errors: ChargesErrors }
    | ({ at: "result"; letter: Letter | null } & Reckoned)
    | ({ at: "letter"; letter: Letter } & Reckoned)
    | { at: "help"; from: Extract<ChargesStep, { at: "result" }> };

export type ChargesEvent =
    | { type: "answered"; fields: ChargesFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export const amountKey = (kind: string) => `amount-${kind}`;

export const chargesKeys: readonly string[] = ["address", "year", "receivedOn", "provisions", "caretaker", ...chargeKinds.map((kind) => amountKey(kind.id))];

export const chargesQuestions = {
    address: "Indiquez l'adresse du logement.",
    year: "Indiquez l'année des charges régularisées, par exemple 2025.",
    receivedOn: "Indiquez la date à laquelle vous avez reçu la régularisation.",
    provisions: "Indiquez le total des provisions versées sur l'année, ou 0.",
    caretaker: "Indiquez ce que fait le gardien.",
    amount: "Indiquez un montant en euros, par exemple 150 ou 150,50.",
    lines: "Reportez au moins un poste de votre décompte.",
};

const cases: readonly string[] = ["both", "one", "employee"];

export const chargesStart: ChargesStep = { at: "form", fields: Object.fromEntries(chargesKeys.map((key) => [key, ""])), errors: {} };

export function nextCharges(step: ChargesStep, event: ChargesEvent, world: { on: Day }): ChargesStep
{
    switch (event.type)
    {
        case "answered":
            return step.at === "form" ? answered(event.fields, world.on) : step;

        case "wrote":
            return step.at === "result" && step.letter !== null ? { ...step, at: "letter", letter: step.letter } : step;

        case "helped":
            return step.at === "result" ? { at: "help", from: step } : step;

        case "back":
            return back(step);
    }
}

function answered(fields: ChargesFields, on: Day): ChargesStep
{
    const year = Number(fields.year);
    const provisions = centsFrom(fields.provisions ?? "");
    const errors: ChargesErrors = {
        ...((fields.address ?? "").trim() === "" ? { address: chargesQuestions.address } : {}),
        ...(/^\d{4}$/.test(fields.year ?? "") && year >= 2000 && year <= Number(on.slice(0, 4)) ? {} : { year: chargesQuestions.year }),
        ...(isDay(fields.receivedOn ?? "") ? {} : { receivedOn: chargesQuestions.receivedOn }),
        ...(typeof provisions === "number" && provisions >= 0 ? {} : { provisions: chargesQuestions.provisions }),
    };

    const lines: ChargeLine[] = [];
    for (const kind of chargeKinds)
    {
        const typed = (fields[amountKey(kind.id)] ?? "").trim();
        if (typed === "")
        {
            continue;
        }

        const billed = centsFrom(typed);
        if (typeof billed !== "number" || billed <= 0)
        {
            errors[amountKey(kind.id)] = chargesQuestions.amount;
            continue;
        }

        if (kind.verdict === "caretaker" && !cases.includes(fields.caretaker ?? ""))
        {
            errors.caretaker = chargesQuestions.caretaker;
        }

        lines.push(kind.verdict === "caretaker" ? { kind: kind.id, billed, caretaker: fields.caretaker as CaretakerCase } : { kind: kind.id, billed });
    }

    if (lines.length === 0 && !Object.keys(errors).some((key) => key.startsWith("amount-")))
    {
        errors.lines = chargesQuestions.lines;
    }

    if (Object.keys(errors).length > 0 || typeof provisions !== "number")
    {
        return { at: "form", fields, errors };
    }

    const regularised: Regularisation = { year, lines, provisions, receivedOn: fields.receivedOn! };
    const check = charges(regularised);
    const written = chargesLetter({ regularised, check, address: fields.address!.trim(), on });

    return { at: "result", on, fields, regularised, check, letter: written.kind === "letter" ? written : null };
}

function back(step: ChargesStep): ChargesStep
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
