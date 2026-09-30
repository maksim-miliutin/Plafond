import { centsFrom, hundredthsFrom, isDay, periods, rooms } from "@plafond/domain";
import type { Claim, Day, Period, Rooms, Unreadable } from "@plafond/domain";

export interface LeaseFields
{
    rooms: string;
    period: string;
    furnished: string;
    surface: string;
    rent: string;
    complement: string;
    signedOn: string;
    startsOn: string;
    stated: string;
}

export interface Lease
{
    claim: Claim;
    stated: boolean;
}

export type FieldErrors = Partial<Record<keyof LeaseFields, string>>;

export interface Unanswered
{
    kind: "unanswered";
    fields: FieldErrors;
}

export interface Context
{
    quartier: number;
    on: Day;
}

export const questions: Record<keyof LeaseFields, string> = {
    rooms: "Choisissez le nombre de pièces principales.",
    period: "Choisissez l'époque de construction de l'immeuble.",
    furnished: "Indiquez si le logement est loué vide ou meublé.",
    surface: "Indiquez la surface habitable en m², par exemple 32,5.",
    rent: "Indiquez le loyer hors charges en euros, par exemple 1\u202F250,50.",
    complement: "Indiquez le complément de loyer en euros, ou laissez vide s'il n'y en a pas.",
    signedOn: "Indiquez la date de signature du bail.",
    startsOn: "Indiquez la date de prise d'effet du bail.",
    stated: "Indiquez si le bail mentionne le loyer de référence majoré.",
};

type Complete<T> = { [K in keyof T]: NonNullable<T[K]> };

export function leaseFrom(fields: LeaseFields, context: Context): Lease | Unanswered
{
    const read = {
        rooms: Object.hasOwn(rooms, fields.rooms) ? (Number(fields.rooms) as Rooms) : null,
        period: Object.hasOwn(periods, fields.period) ? (fields.period as Period) : null,
        furnished: yesOrNo(fields.furnished),
        surface: positive(hundredthsFrom(fields.surface)),
        rent: positive(centsFrom(fields.rent)),
        complement: fields.complement.trim() === "" ? 0 : number(centsFrom(fields.complement)),
        signedOn: isDay(fields.signedOn) ? fields.signedOn : null,
        startsOn: isDay(fields.startsOn) ? fields.startsOn : null,
        stated: yesOrNo(fields.stated),
    };

    if (!complete(read))
    {
        const missing = (Object.keys(read) as (keyof LeaseFields)[]).filter((key) => read[key] === null);

        return { kind: "unanswered", fields: Object.fromEntries(missing.map((key) => [key, questions[key]])) };
    }

    const claim = {
        flat: { quartier: context.quartier, rooms: read.rooms, period: read.period, furnished: read.furnished },
        surface: read.surface,
        signedOn: read.signedOn,
        startsOn: read.startsOn,
        rent: read.rent,
        complement: read.complement,
        on: context.on,
    };

    return { claim, stated: read.stated };
}

function yesOrNo(answer: string): boolean | null
{
    return answer === "yes" ? true : answer === "no" ? false : null;
}

function complete<T extends object>(read: T): read is Complete<T>
{
    return Object.values(read).every((value) => value !== null);
}

function number(value: number | Unreadable): number | null
{
    return typeof value === "number" ? value : null;
}

function positive(value: number | Unreadable): number | null
{
    return typeof value === "number" && value > 0 ? value : null;
}
