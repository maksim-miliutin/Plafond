import { addMonths, dayBefore, type Day } from "./day.js";
import { rounded } from "./money.js";

export type Quarter = 1 | 2 | 3 | 4;

export interface IndexRow
{
    year: number;
    quarter: Quarter;
    value: number;  // hundredths of a point of the rent index
    publishedOn: Day;
}

export interface Revision
{
    clause: boolean;
    rent: number;  // cents a month before the revision, charges excluded
    asked: number;
    quarter: Quarter | null;  // the lease's reference quarter, null when it names none
    signedOn: Day;
    revisedOn: Day;
    askedOn: Day;
}

export type RevisionCheck =
    | { kind: "no-clause"; allowed: number; excess: number }
    | { kind: "lapsed"; lastDay: Day; allowed: number; excess: number }
    | {
        kind: "revised";
        quarter: Quarter;
        assumed: boolean;
        from: IndexRow;
        to: IndexRow;
        allowed: number;
        excess: number;
        startsOn: Day;
        contestBy: Day;
    }
    | { kind: "no-index" };

// Loi n° 89-462 du 6 juillet 1989, article 17-1: once a year if the lease says so, by the change of the index over a year,
// asked within the year after the revision date and owed only from the day it is asked.
export function revision(lease: Revision, index: readonly IndexRow[]): RevisionCheck
{
    const over = (allowed: number) => Math.max(0, lease.asked - allowed);
    if (!lease.clause)
    {
        return { kind: "no-clause", allowed: lease.rent, excess: over(lease.rent) };
    }

    const lastDay = dayBefore(addMonths(lease.revisedOn, 12));
    if (lease.askedOn > lastDay)
    {
        return { kind: "lapsed", lastDay, allowed: lease.rent, excess: over(lease.rent) };
    }

    const quarter = lease.quarter ?? latest(index, lease.signedOn)?.quarter;
    const to = quarter === undefined ? undefined : latest(index.filter((row) => row.quarter === quarter), lease.revisedOn);
    const from = to === undefined ? undefined : index.find((row) => row.quarter === to.quarter && row.year === to.year - 1);
    if (quarter === undefined || to === undefined || from === undefined)
    {
        return { kind: "no-index" };
    }

    const allowed = rounded(lease.rent * to.value, from.value);

    return {
        kind: "revised",
        quarter,
        assumed: lease.quarter === null,
        from,
        to,
        allowed,
        excess: over(allowed),
        startsOn: lease.askedOn > lease.revisedOn ? lease.askedOn : lease.revisedOn,
        contestBy: dayBefore(addMonths(lease.revisedOn, 36)),
    };
}

function latest(rows: readonly IndexRow[], on: Day): IndexRow | undefined
{
    return rows.filter((row) => row.publishedOn <= on).reduce<IndexRow | undefined>(
        (best, row) => best === undefined || row.publishedOn > best.publishedOn ? row : best,
        undefined,
    );
}
