import type { Day } from "./day.js";
import { freezeFrom, type Label } from "./dpe.js";
import { rounded } from "./money.js";
import { latestIndex, type IndexRow } from "./revision.js";

// The leases a version of décret n° 2017-1198 covers, by the day they are signed: from the first day, up to the last one excluded.
export interface RelocationPeriod
{
    from: Day;
    until: Day;
    title: string;
    url: string;
}

export type Vacancy = "within" | "beyond";  // empty up to eighteen months before the lease, or longer
export type Basis = "none" | "works" | "undervalued";  // what the landlord gives under article 4 for a higher rent

export interface Relocation
{
    signedOn: Day;
    tense: boolean | null;  // whether the commune is on the list of the tense zone that day, null when Plafond lacks that list
    firstLetting: boolean;
    dpe: Label | null;
    vacancy: Vacancy | null;
    lastRent: number | null;  // cents a month paid by the tenant before, charges excluded
    revised: boolean | null;  // whether that rent was revised in the twelve months before the lease
    basis: Basis;
    proposed: number;  // cents a month the new lease asks, charges excluded
}

export type RelocationField = "lastRent" | "dpe" | "vacancy" | "revised" | "index";

export type RelocationCheck =
    | { kind: "first-letting" }
    | { kind: "frozen"; dpe: "F" | "G"; allowed: number; excess: number }
    | { kind: "no-rules"; periods: readonly RelocationPeriod[] }
    | { kind: "untense"; period: RelocationPeriod }
    | { kind: "missing"; field: RelocationField; period: RelocationPeriod | null }
    | { kind: "vacant"; period: RelocationPeriod }
    | { kind: "special"; basis: Exclude<Basis, "none">; period: RelocationPeriod }
    | { kind: "kept"; allowed: number; excess: number; period: RelocationPeriod }
    | { kind: "indexed"; from: IndexRow; to: IndexRow; allowed: number; excess: number; period: RelocationPeriod };

// A new lease of a dwelling let before. Loi n° 89-462, article 17: an F or G dwelling's rent stays at its last one, with no
// exception. Décret n° 2017-1198, in the tense zone: article 2 leaves out a first letting and a dwelling empty more than
// eighteen months; article 3 caps the rent at the last one, revised by the index when it was not in the year before;
// article 4 allows more after works or for an undervalued rent, which needs facts this check does not ask.
export function relocation(lease: Relocation, periods: readonly RelocationPeriod[], index: readonly IndexRow[]): RelocationCheck
{
    const over = (allowed: number) => Math.max(0, lease.proposed - allowed);
    if (lease.firstLetting)
    {
        return { kind: "first-letting" };
    }

    if ((lease.dpe === "F" || lease.dpe === "G") && lease.signedOn >= freezeFrom)
    {
        return lease.lastRent === null
            ? { kind: "missing", field: "lastRent", period: null }
            : { kind: "frozen", dpe: lease.dpe, allowed: lease.lastRent, excess: over(lease.lastRent) };
    }

    const period = periods.find((one) => one.from <= lease.signedOn && lease.signedOn < one.until);
    if (period === undefined || lease.tense === null)
    {
        return { kind: "no-rules", periods };
    }

    const missing = (field: RelocationField) => ({ kind: "missing", field, period }) as const;
    if (!lease.tense)
    {
        return { kind: "untense", period };
    }

    if (lease.dpe === null)
    {
        return missing("dpe");
    }

    if (lease.vacancy === null)
    {
        return missing("vacancy");
    }

    if (lease.vacancy === "beyond")
    {
        return { kind: "vacant", period };
    }

    if (lease.basis !== "none")
    {
        return { kind: "special", basis: lease.basis, period };
    }

    if (lease.lastRent === null)
    {
        return missing("lastRent");
    }

    if (lease.revised === null)
    {
        return missing("revised");
    }

    if (lease.revised)
    {
        return { kind: "kept", allowed: lease.lastRent, excess: over(lease.lastRent), period };
    }

    const to = latestIndex(index, lease.signedOn);
    const from = to === undefined ? undefined : index.find((row) => row.quarter === to.quarter && row.year === to.year - 1);
    if (to === undefined || from === undefined)
    {
        return missing("index");
    }

    const allowed = rounded(lease.lastRent * to.value, from.value);

    return { kind: "indexed", from, to, allowed, excess: over(allowed), period };
}
