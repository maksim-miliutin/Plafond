import { addMonths, isDay, wholeMonths, type Day } from "./day.js";
import { rateOn, type Flat, type NoRate, type Rate } from "./rates.js";

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
    complement: Complement | null;
}

export interface Invalid
{
    kind: "invalid";
    field: keyof Claim;
}

export type Refusal = NoRate | Invalid;

export class CapError extends Error
{
    constructor(rate: Rate)
    {
        super(`cap: the rate from ${rate.from} for quartier ${rate.flat.quartier} gives a zero cap`);
        this.name = "CapError";
    }
}

// Overpaid rent can be claimed back for three years; a complement can be contested
// before the conciliation commission only within three months of signing.
const recoverableMonths = 36;
const contestMonths = 3;

const demands: readonly { field: keyof Claim; met: (claim: Claim) => boolean }[] = [
    { field: "surface", met: (c) => Number.isInteger(c.surface) && c.surface > 0 },
    { field: "signedOn", met: (c) => isDay(c.signedOn) },
    { field: "startsOn", met: (c) => isDay(c.startsOn) },
    { field: "rent", met: (c) => Number.isInteger(c.rent) && c.rent > 0 },
    { field: "complement", met: (c) => Number.isInteger(c.complement) && c.complement >= 0 },
    { field: "on", met: (c) => isDay(c.on) },
];

export function check(claim: Claim, rates: readonly Rate[]): Check | Refusal
{
    const unmet = demands.find((d) => !d.met(claim));
    if (unmet !== undefined)
    {
        return { kind: "invalid", field: unmet.field };
    }

    const rate = rateOn(rates, claim.flat, claim.signedOn);
    if ("kind" in rate)
    {
        return rate;
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
        contestUntil: addMonths(claim.signedOn, contestMonths),
    };
}

function rounded(numerator: number, denominator: number): number
{
    return Math.floor((2 * numerator + denominator) / (2 * denominator));
}
