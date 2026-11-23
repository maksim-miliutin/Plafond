import { centsFrom, dwellings, dwellingsApart, hundredthsFrom, isDay, periodsOf, rooms } from "@plafond/domain";
import type { City, Claim, Day, Dwelling, Flat, Period, Rooms, Unreadable } from "@plafond/domain";

import { readForm } from "./forms";

export interface LeaseFields
{
    dwelling: string;
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
    city: City;
    quartier: number;
    on: Day;
}

export const questions: Record<keyof LeaseFields, string> = {
    dwelling: "Indiquez si le logement est un appartement ou une maison.",
    rooms: "Choisissez le nombre de pièces principales.",
    period: "Choisissez l'époque de construction du bâtiment.",
    furnished: "Indiquez si le logement est loué vide ou meublé.",
    surface: "Indiquez la surface habitable en m², par exemple 32,5.",
    rent: "Indiquez le loyer hors charges en euros, par exemple 1\u202F250,50.",
    complement: "Indiquez le complément de loyer en euros, ou laissez vide s'il n'y en a pas.",
    signedOn: "Indiquez la date de signature du bail.",
    startsOn: "Indiquez la date de prise d'effet du bail.",
    stated: "Indiquez si le bail mentionne le loyer de référence majoré.",
};

type Complete<T> = { [K in keyof T]: NonNullable<T[K]> };

export function fieldsFrom(sent: FormData): LeaseFields
{
    return readForm(sent, Object.keys(questions) as (keyof LeaseFields)[]);
}

export function leaseFrom(fields: LeaseFields, context: Context): Lease | Unanswered
{
    const read = {
        rooms: Object.hasOwn(rooms, fields.rooms) ? (Number(fields.rooms) as Rooms) : null,
        period: (periodsOf[context.city] as readonly string[]).includes(fields.period) ? (fields.period as Period) : null,
        furnished: yesOrNo(fields.furnished),
        surface: positive(hundredthsFrom(fields.surface)),
        rent: positive(centsFrom(fields.rent)),
        complement: fields.complement.trim() === "" ? 0 : number(centsFrom(fields.complement)),
        signedOn: isDay(fields.signedOn) ? fields.signedOn : null,
        startsOn: isDay(fields.startsOn) ? fields.startsOn : null,
        stated: yesOrNo(fields.stated),
    };

    // Asked only where the decree prices houses and flats apart; elsewhere the answer stays out of the claim.
    const dwelling = !dwellingsApart[context.city] ? undefined : Object.hasOwn(dwellings, fields.dwelling) ? (fields.dwelling as Dwelling) : null;

    if (!complete(read) || dwelling === null)
    {
        const missing: (keyof LeaseFields)[] = (Object.keys(read) as (keyof typeof read)[]).filter((key) => read[key] === null);

        return { kind: "unanswered", fields: Object.fromEntries([...(dwelling === null ? ["dwelling" as const] : []), ...missing].map((key) => [key, questions[key]])) };
    }

    const flat: Flat = { city: context.city, quartier: context.quartier, rooms: read.rooms, period: read.period, furnished: read.furnished };
    const claim = {
        flat: dwelling === undefined ? flat : { ...flat, dwelling },
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
