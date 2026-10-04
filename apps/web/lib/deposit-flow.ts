import { centsFrom, deposit, depositLetter, isDay } from "@plafond/domain";
import type { Day, Deposit, DepositCheck, Letter } from "@plafond/domain";

export interface DepositFields
{
    address: string;
    rent: string;
    paid: string;
    furnished: string;
    keysOn: string;
    conforming: string;
    addressGiven: string;
    returned: string;
    returnedOn: string;
}

export type DepositErrors = Partial<Record<keyof DepositFields, string>>;

interface Reckoned
{
    fields: DepositFields;
    held: Deposit;
    check: DepositCheck;
}

export type DepositStep =
    | { at: "form"; fields: DepositFields; errors: DepositErrors }
    | ({ at: "result"; letter: Letter | null } & Reckoned)
    | ({ at: "letter"; letter: Letter } & Reckoned)
    | { at: "help"; from: Extract<DepositStep, { at: "result" }> };

export type DepositEvent =
    | { type: "answered"; fields: DepositFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export const depositQuestions: Record<keyof DepositFields, string> = {
    address: "Indiquez l'adresse du logement quitté.",
    rent: "Indiquez le loyer mensuel hors charges.",
    paid: "Indiquez le montant du dépôt de garantie versé.",
    furnished: "Indiquez si le logement était loué vide ou meublé.",
    keysOn: "Indiquez la date de remise des clés.",
    conforming: "Indiquez si l'état des lieux de sortie est conforme à celui d'entrée.",
    addressGiven: "Indiquez si vous avez donné votre nouvelle adresse au propriétaire.",
    returned: "Le montant restitué ne peut pas dépasser le dépôt.",
    returnedOn: "Indiquez la date de cette restitution.",
};

const blank = Object.fromEntries(Object.keys(depositQuestions).map((key) => [key, ""])) as unknown as DepositFields;

export const depositStart: DepositStep = { at: "form", fields: blank, errors: {} };

export function nextDeposit(step: DepositStep, event: DepositEvent, world: { on: Day }): DepositStep
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

function answered(fields: DepositFields, on: Day): DepositStep
{
    const rent = centsFrom(fields.rent);
    const paid = centsFrom(fields.paid);
    const returned = fields.returned.trim() === "" ? 0 : centsFrom(fields.returned);
    const yes = (answer: string) => answer === "yes" || answer === "no";
    const errors: DepositErrors = {
        ...(fields.address.trim() === "" ? { address: depositQuestions.address } : {}),
        ...(typeof rent === "number" && rent > 0 ? {} : { rent: depositQuestions.rent }),
        ...(typeof paid === "number" && paid > 0 ? {} : { paid: depositQuestions.paid }),
        ...(yes(fields.furnished) ? {} : { furnished: depositQuestions.furnished }),
        ...(isDay(fields.keysOn) ? {} : { keysOn: depositQuestions.keysOn }),
        ...(yes(fields.conforming) ? {} : { conforming: depositQuestions.conforming }),
        ...(yes(fields.addressGiven) ? {} : { addressGiven: depositQuestions.addressGiven }),
        ...(typeof returned === "number" && (typeof paid !== "number" || returned <= paid) ? {} : { returned: depositQuestions.returned }),
        ...(typeof returned === "number" && returned > 0 && !isDay(fields.returnedOn) ? { returnedOn: depositQuestions.returnedOn } : {}),
    };
    if (Object.keys(errors).length > 0 || typeof rent !== "number" || typeof paid !== "number" || typeof returned !== "number")
    {
        return { at: "form", fields, errors };
    }

    const held: Deposit = {
        paid,
        rent,
        furnished: fields.furnished === "yes",
        keysOn: fields.keysOn,
        conforming: fields.conforming === "yes",
        addressGiven: fields.addressGiven === "yes",
        returned,
        returnedOn: returned > 0 ? fields.returnedOn : null,
        on,
    };
    const check = deposit(held);
    const written = depositLetter({ held, check, address: fields.address.trim() });

    return { at: "result", fields, held, check, letter: written.kind === "letter" ? written : null };
}

function back(step: DepositStep): DepositStep
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
