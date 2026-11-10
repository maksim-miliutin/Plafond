import { centsFrom, isDay, notice, noticeLetter, noticeReasons } from "@plafond/domain";
import type { Day, Leaving, Letter, NoticeCheck, Reason } from "@plafond/domain";

export interface NoticeFields
{
    address: string;
    rent: string;
    furnished: string;
    tense: string;
    reason: string;
    receivedOn: string;
}

export type NoticeErrors = Partial<Record<keyof NoticeFields, string>>;

interface Reckoned
{
    fields: NoticeFields;
    check: NoticeCheck;
    ifTense: NoticeCheck | null;
    letter: Letter;
}

export type NoticeStep =
    | { at: "form"; fields: NoticeFields; errors: NoticeErrors }
    | ({ at: "result" } & Reckoned)
    | ({ at: "letter" } & Reckoned)
    | { at: "help"; from: Extract<NoticeStep, { at: "result" }> };

export type NoticeEvent =
    | { type: "answered"; fields: NoticeFields }
    | { type: "wrote" }
    | { type: "helped" }
    | { type: "back" };

export const noticeQuestions: Record<keyof NoticeFields, string> = {
    address: "Indiquez l'adresse du logement.",
    rent: "Indiquez le loyer mensuel, charges comprises.",
    furnished: "Indiquez si le logement est loué vide ou meublé.",
    tense: "Indiquez si le logement est en zone tendue.",
    reason: "Choisissez un motif dans la liste, ou aucun.",
    receivedOn: "Indiquez la date à laquelle le propriétaire reçoit la lettre.",
};

export const otherReasons = noticeReasons.filter((reason) => reason.id !== "tense");

export const noticeStart: NoticeStep = {
    at: "form",
    fields: { address: "", rent: "", furnished: "", tense: "", reason: "none", receivedOn: "" },
    errors: {},
};

export function nextNotice(step: NoticeStep, event: NoticeEvent, world: { on: Day }): NoticeStep
{
    switch (event.type)
    {
        case "answered":
            return step.at === "form" ? answered(event.fields, world.on) : step;

        case "wrote":
            return step.at === "result" ? { ...step, at: "letter" } : step;

        case "helped":
            return step.at === "result" ? { at: "help", from: step } : step;

        case "back":
            return back(step);
    }
}

function answered(fields: NoticeFields, on: Day): NoticeStep
{
    const rent = centsFrom(fields.rent);
    const empty = fields.furnished === "no";
    const reason = otherReasons.find((known) => known.id === fields.reason)?.id;
    const errors: NoticeErrors = {
        ...(fields.address.trim() === "" ? { address: noticeQuestions.address } : {}),
        ...(typeof rent === "number" && rent > 0 ? {} : { rent: noticeQuestions.rent }),
        ...(fields.furnished === "yes" || empty ? {} : { furnished: noticeQuestions.furnished }),
        ...(!empty || ["yes", "no", "unknown"].includes(fields.tense) ? {} : { tense: noticeQuestions.tense }),
        ...(!empty || fields.reason === "none" || reason !== undefined ? {} : { reason: noticeQuestions.reason }),
        ...(isDay(fields.receivedOn) ? {} : { receivedOn: noticeQuestions.receivedOn }),
    };
    if (Object.keys(errors).length > 0 || typeof rent !== "number")
    {
        return { at: "form", fields, errors };
    }

    const reasons = [fields.tense === "yes" ? "tense" : undefined, reason].filter((known): known is Reason => known !== undefined);
    const leaving: Leaving = { furnished: !empty, reasons, receivedOn: fields.receivedOn, rent };
    const check = notice(leaving);
    const unsure = empty && fields.tense === "unknown" && check.reason === null;

    return {
        at: "result",
        fields,
        check,
        ifTense: unsure ? notice({ ...leaving, reasons: ["tense"] }) : null,
        letter: noticeLetter({ check, address: fields.address.trim(), on }),
    };
}

function back(step: NoticeStep): NoticeStep
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
