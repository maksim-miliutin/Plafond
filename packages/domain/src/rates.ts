import { DayError, isDay, type Day } from "./day.js";

// 4 stands for four rooms or more: the published tables group them that way.
export type Rooms = 1 | 2 | 3 | 4;

export type City = "paris" | "lyon" | "est-ensemble";

export type Period = "before-1946" | "1946-1970" | "1971-1990" | "after-1990" | "1991-2005" | "after-2005";

// Each prefecture cuts construction years its own way: Paris and Est Ensemble stop at 1990, Lyon splits on to 2005.
export const periodsOf: Record<City, readonly Period[]> = {
    paris: ["before-1946", "1946-1970", "1971-1990", "after-1990"],
    lyon: ["before-1946", "1946-1970", "1971-1990", "1991-2005", "after-2005"],
    "est-ensemble": ["before-1946", "1946-1970", "1971-1990", "after-1990"],
};

// The first day a lease falls under each city's control: the décrets of 2019 for Paris and of 2 September 2021 for Lyon,
// and for Est Ensemble the first decree of the prefect under the décret n° 2021-688 of 28 May 2021.
export const controlledSince: Record<City, Day> = { paris: "2019-07-01", lyon: "2021-11-01", "est-ensemble": "2021-12-01" };

// Paris and Lyon publish an outline for every area. The Est Ensemble decree names communes, each in one sector, and
// outlines only the commune it splits, so there an address finds its area by its commune code first.
export const placing: Record<City, "outline" | "commune"> = { paris: "outline", lyon: "outline", "est-ensemble": "commune" };

export const dwellingsApart: Record<City, boolean> = { paris: false, lyon: false, "est-ensemble": true };

// The decrees for Est Ensemble and Plaine Commune price houses and flats apart, the other decrees do not.
export type Dwelling = "flat" | "house";

export interface Flat
{
    city: City;
    quartier: number;
    rooms: Rooms;
    period: Period;
    furnished: boolean;
    dwelling?: Dwelling;  // left out where one grid prices houses and flats alike
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
        const kind = flat.dwelling === undefined ? "" : `${flat.dwelling}, `;
        super(`rates: ${count} rates cover ${flat.city} area ${flat.quartier}, ${kind}${flat.rooms} rooms, ${flat.period}, ${letting} on ${on}`);
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
        && a.furnished === b.furnished
        && a.dwelling === b.dwelling;
}

function covers(rate: Rate, on: Day): boolean
{
    return rate.decree.from <= on && on < rate.decree.until;
}
