import type { DpeSource, Listing } from "@plafond/ademe";
import type { Geocoder, Lookup } from "@plafond/address";

export type DpeProblem = Exclude<Lookup["kind"], "located"> | "malformed" | "no-diagnosis";

export type Searched =
    | { kind: "listed"; listings: Listing[] }
    | { kind: "refused"; problem: DpeProblem };

export interface Searching
{
    geocoder: Geocoder;
    source: DpeSource;
}

// The number printed on a diagnosis since July 2021: year, department, a letter, seven digits and a check letter.
const printedNumber = /^\d{2}[0-9A-Z]{2}[A-Z]\d{7}[A-Z]$/;

export async function search(text: string, needs: Searching): Promise<Searched>
{
    const typed = text.trim();
    if (printedNumber.test(typed.replace(/\s/g, "").toUpperCase()))
    {
        return listed(await needs.source.byNumber(typed));
    }

    const lookup = await needs.geocoder.locate(typed);
    if (lookup.kind !== "located")
    {
        return { kind: "refused", problem: lookup.kind };
    }

    return listed(await needs.source.atAddress(lookup.id));
}

function listed(found: Awaited<ReturnType<DpeSource["byNumber"]>>): Searched
{
    if (!Array.isArray(found))
    {
        return { kind: "refused", problem: found.kind };
    }

    return found.length === 0 ? { kind: "refused", problem: "no-diagnosis" } : { kind: "listed", listings: found };
}
