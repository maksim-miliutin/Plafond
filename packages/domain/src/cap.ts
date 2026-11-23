import { addMonths, dayBefore, isDay, wholeMonths, type Day } from "./day.js";
import { lawOn, type Lapsed, type LawPeriod } from "./law.js";
import { controlledSince, rateOn, type Flat, type Rate } from "./rates.js";
import { rounded } from "./money.js";

export interface Claim
{
    flat: Flat;
    surface: number;     // hundredths of a square metre
    signedOn: Day;
    startsOn: Day;       // prise d'effet: rent months count from here, the rate from signedOn
    rent: number;        // cents a month: base rent from the lease, without charges or complement
    complement: number;  // cents a month; zero when the lease states none
    on: Day;
}

export interface Complement
{
    amount: number;      // cents a month
    share: number;       // hundredths of a percent of the cap
    contestUntil: Day;   // last day, inclusive, to bring it before the commission
    shortOfCap: number;  // cents a month the base rent falls below the cap; zero when it reaches it
}

export interface Check
{
    kind: "checked";
    rate: Rate;
    cap: number;          // cents a month
    excess: number;       // cents a month above the cap; zero when within it
    months: number;
    sinceStart: number;   // cents
    recoverable: number;  // cents
    claimBy: Day | null;  // last day, inclusive, to claim a lower rent, taking signing as the day the tenant knew; null when within the cap
    complement: Complement | null;
}

export interface Invalid
{
    kind: "invalid";
    field: keyof Claim;
}

// After the known decrees, the latest one is named and linked: the official source that says where the rates stop.
export type Gap = { side: "before"; from: Day } | { side: "after"; until: Day; title: string; url: string } | { side: "between" };

export type Unpriced = { kind: "no-rate" } & Gap;

export type Unchecked = Unpriced | Lapsed;

export type Refusal = Unchecked | Invalid;

export class CapError extends Error
{
    constructor(rate: Rate)
    {
        super(`cap: the rate from ${rate.decree.from} for quartier ${rate.flat.quartier} gives a zero cap`);
        this.name = "CapError";
    }
}

// Overpaid rent can be claimed back for three years. The one-year deadline below is on bringing the claim: no source
// yet says it shortens how far back the refund reaches, so this stays at three years on purpose.
const recoverableMonths = 36;

// Loi n° 2026-1072 of 21 November 2026, published the next day and dated by nothing else, takes effect on
// 23 November 2026 (article 1 of the Code civil). It gives a year instead of three months to bring a complement
// before the conciliation commission. Under article 2222 of the Code civil a longer deadline reaches every window
// still open that day, counted from the same signing, and leaves a closed one closed.
const reformedOn: Day = "2026-11-23";
const contestMonthsBefore = 3;
const contestMonths = 12;

// The same law makes the claim for a lower rent lapse a year, not three (article 7-1 of loi n° 89-462), after the
// tenant knew or should have known the excess. Signing is the earliest such day a landlord can argue. A shorter
// deadline runs from the day it took effect and never past the old one (article 2222 of the Code civil).
const claimMonthsBefore = 36;
const claimMonths = 12;

const demands: readonly { field: keyof Claim; met: (claim: Claim) => boolean }[] = [
    { field: "surface", met: (c) => Number.isInteger(c.surface) && c.surface > 0 },
    { field: "signedOn", met: (c) => isDay(c.signedOn) },
    { field: "startsOn", met: (c) => isDay(c.startsOn) },
    { field: "rent", met: (c) => Number.isInteger(c.rent) && c.rent > 0 },
    { field: "complement", met: (c) => Number.isInteger(c.complement) && c.complement >= 0 },
    { field: "on", met: (c) => isDay(c.on) },
];

export function check(claim: Claim, rates: readonly Rate[], law: readonly LawPeriod[]): Check | Refusal
{
    const unmet = demands.find((d) => !d.met(claim));
    if (unmet !== undefined)
    {
        return { kind: "invalid", field: unmet.field };
    }

    const inForce = lawOn(claim.signedOn, law);
    if (inForce !== null && "kind" in inForce)
    {
        return inForce;
    }

    const rate = rateOn(rates, claim.flat, claim.signedOn);
    if ("kind" in rate)
    {
        return { kind: "no-rate", ...gapOf(claim, rates) };
    }

    const cap = rounded(rate.majored * claim.surface, 100);
    if (cap <= 0)
    {
        throw new CapError(rate);
    }

    const excess = Math.max(0, claim.rent - cap);
    const months = wholeMonths(claim.startsOn, claim.on);

    return {
        kind: "checked",
        rate,
        cap,
        excess,
        months,
        sinceStart: excess * months,
        recoverable: excess * Math.min(months, recoverableMonths),
        claimBy: excess > 0 ? claimBy(claim.signedOn) : null,
        complement: complementOf(claim, cap),
    };
}

function complementOf(claim: Claim, cap: number): Complement | null
{
    if (claim.complement === 0)
    {
        return null;
    }

    return {
        amount: claim.complement,
        share: rounded(claim.complement * 10000, cap),
        contestUntil: contestUntil(claim.signedOn),
        shortOfCap: Math.max(0, cap - claim.rent),
    };
}

function contestUntil(signedOn: Day): Day
{
    const before = addMonths(signedOn, contestMonthsBefore);
    if (before < reformedOn)
    {
        return before;
    }

    return addMonths(signedOn, contestMonths);
}

function claimBy(signedOn: Day): Day
{
    const before = addMonths(signedOn, claimMonthsBefore);
    const after = addMonths(signedOn < reformedOn ? reformedOn : signedOn, claimMonths);

    return before < after ? before : after;
}

function gapOf(claim: Claim, rates: readonly Rate[]): Gap
{
    const since = controlledSince[claim.flat.city];
    if (claim.signedOn < since)
    {
        return { side: "before", from: since };
    }

    const latest = rates.filter((rate) => rate.flat.city === claim.flat.city).map((rate) => rate.decree)
        .sort((a, b) => a.until.localeCompare(b.until)).at(-1);
    if (latest !== undefined && claim.signedOn >= latest.until)
    {
        return { side: "after", until: dayBefore(latest.until), title: latest.title, url: latest.url };
    }

    return { side: "between" };
}
