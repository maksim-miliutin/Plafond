import { DayError, isDay, type Day } from "./day.js";

// 4 stands for four rooms or more: the published tables group them that way.
export type Rooms = 1 | 2 | 3 | 4;

export type City = "paris" | "lyon";

export type Period = "before-1946" | "1946-1970" | "1971-1990" | "after-1990" | "1991-2005" | "after-2005";

// Each prefecture cuts construction years its own way: Paris stops at 1990, Lyon splits on to 2005.
export const periodsOf: Record<City, readonly Period[]> = {
    paris: ["before-1946", "1946-1970", "1971-1990", "after-1990"],
    lyon: ["before-1946", "1946-1970", "1971-1990", "1991-2005", "after-2005"],
};

export interface Flat
{
    city: City;
    quartier: number;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
}

export interface Contest
{
    outcome: "annulled" | "pending";
    court: string;
    decidedOn: Day;
    claimsBy: Day | null;  // an annulment reaches only claims brought by this day; null when not limited
    source: string;
}

export interface Decree
{
    title: string;
    url: string;
    from: Day;
    until: Day;  // the first day it no longer applies
    contest: Contest | null;
}

export interface Rate
{
    flat: Flat;
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
        super(`rates: ${count} rates cover ${flat.city} area ${flat.quartier}, ${flat.rooms} rooms, ${flat.period}, ${letting} on ${on}`);
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
    return a.city === b.city
        && a.quartier === b.quartier
        && a.rooms === b.rooms
        && a.period === b.period
        && a.furnished === b.furnished;
}

function covers(rate: Rate, on: Day): boolean
{
    return rate.decree.from <= on && on < rate.decree.until;
}
