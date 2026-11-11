import type { Day } from "./day.js";
import { rounded } from "./money.js";

export type FeeZone = "very-tense" | "tense" | "other";

export interface FeeCaps
{
    from: Day;
    until: Day;  // the first day it no longer applies
    letting: Record<FeeZone, number>;  // cents per square metre for the visits, the file and the lease together
    inspection: number;  // cents per square metre for the entry inspection, in every zone
    title: string;
    url: string;
}

export interface AgencyFees
{
    zone: FeeZone | null;  // null when the tenant does not know it
    surface: number;  // hundredths of a square metre
    letting: number;
    inspection: number;
    signedOn: Day;
}

export interface FeesCheck
{
    kind: "fees";
    caps: FeeCaps;
    zone: FeeZone;
    assumed: boolean;
    lettingCap: number;
    inspectionCap: number;
    lettingExcess: number;
    inspectionExcess: number;
    excess: number;
}

export type NoCaps =
    | { kind: "no-caps"; side: "before"; from: Day }
    | { kind: "no-caps"; side: "after"; until: Day };

export class AgencyError extends Error
{
    constructor(problem: string)
    {
        super(`agency: ${problem}`);
        this.name = "AgencyError";
    }
}

export function agencyFees(paid: AgencyFees, table: readonly FeeCaps[]): FeesCheck | NoCaps
{
    const ordered = [...table].sort((a, b) => a.from.localeCompare(b.from));
    const first = ordered[0];
    const last = ordered.at(-1);
    if (first === undefined || last === undefined)
    {
        throw new AgencyError("the table of fee caps is empty");
    }

    if (paid.signedOn < first.from)
    {
        return { kind: "no-caps", side: "before", from: first.from };
    }

    if (paid.signedOn >= last.until)
    {
        return { kind: "no-caps", side: "after", until: last.until };
    }

    const caps = ordered.find((row) => row.from <= paid.signedOn && paid.signedOn < row.until);
    if (caps === undefined)
    {
        throw new AgencyError(`no fee caps cover ${paid.signedOn}, between ${first.from} and ${last.until}`);
    }

    const zone = paid.zone ?? highest(caps);
    const lettingCap = rounded(caps.letting[zone] * paid.surface, 100);
    const inspectionCap = rounded(caps.inspection * paid.surface, 100);
    const lettingExcess = Math.max(0, paid.letting - lettingCap);
    const inspectionExcess = Math.max(0, paid.inspection - inspectionCap);

    return {
        kind: "fees",
        caps,
        zone,
        assumed: paid.zone === null,
        lettingCap,
        inspectionCap,
        lettingExcess,
        inspectionExcess,
        excess: lettingExcess + inspectionExcess,
    };
}

// Not knowing the zone must never make the agency look worse than it is: the claim then stands even where caps are highest.
function highest(caps: FeeCaps): FeeZone
{
    const zones = Object.keys(caps.letting) as FeeZone[];

    return zones.reduce((best, zone) => caps.letting[zone] > caps.letting[best] ? zone : best);
}
