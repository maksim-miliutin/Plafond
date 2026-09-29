import { DayError, isDay, type Day } from "./day.js";

// 4 stands for four rooms or more: the published tables group them that way.
export type Rooms = 1 | 2 | 3 | 4;

export type Period = "before-1946" | "1946-1970" | "1971-1990" | "after-1990";

export interface Flat
{
    quartier: number;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
}

export interface Decree
{
    title: string;
    url: string;
}

export interface Rate
{
    flat: Flat;
    from: Day;
    until: Day | null;  // the first day it no longer applies; null while still in force
    // The three published rents, in cents per square metre.
    reference: number;
    majored: number;
    minored: number;
    decree: Decree;
}

export interface NoRate
{
    kind: "no-rate";
}

export class RatesError extends Error
{
    constructor(flat: Flat, on: Day, count: number)
    {
        const letting = flat.furnished ? "furnished" : "unfurnished";
        super(`rates: ${count} rates cover quartier ${flat.quartier}, ${flat.rooms} rooms, ${flat.period}, ${letting} on ${on}`);
        this.name = "RatesError";
    }
}

export function rateOn(rates: readonly Rate[], flat: Flat, on: Day): Rate | NoRate
{
    if (!isDay(on))
    {
        throw new DayError(on);
    }

    const found = rates.filter((r) => sameFlat(r.flat, flat) && covers(r, on));
    if (found.length > 1)
    {
        throw new RatesError(flat, on, found.length);
    }

    return found[0] ?? { kind: "no-rate" };
}

function sameFlat(a: Flat, b: Flat): boolean
{
    return a.quartier === b.quartier
        && a.rooms === b.rooms
        && a.period === b.period
        && a.furnished === b.furnished;
}

function covers(rate: Rate, on: Day): boolean
{
    return rate.from <= on && (rate.until === null || on < rate.until);
}
