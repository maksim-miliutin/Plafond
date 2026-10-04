import { expect, test } from "vitest";

import { caretakerShares, chargeKinds } from "../src/charges.js";

// Décret n° 87-713 du 26 août 1987: only what its list names may be passed on to the tenant, and the list is closed.
test("every kind of charge says whether the tenant can be made to pay it, and has a name to show", () =>
{
    for (const kind of chargeKinds)
    {
        expect(["recoverable", "not-recoverable", "caretaker"], kind.id).toContain(kind.verdict);
        expect(kind.name.length, kind.id).toBeGreaterThan(5);
    }

    expect(new Set(chargeKinds.map((kind) => kind.id)).size).toBe(chargeKinds.length);
});

test("the charges landlords most often pass on wrongly are listed as not recoverable", () =>
{
    const refused = chargeKinds.filter((kind) => kind.verdict === "not-recoverable").map((kind) => kind.id);

    expect(refused).toEqual(expect.arrayContaining(["manager-fees", "insurance", "property-tax", "works", "replacement", "legal-fees"]));
});

test("the waste collection tax and the lift's upkeep may be passed on", () =>
{
    const allowed = chargeKinds.filter((kind) => kind.verdict === "recoverable").map((kind) => kind.id);

    expect(allowed).toEqual(expect.arrayContaining(["waste-tax", "lift", "water", "heating", "cleaning"]));
});

// Same decree: 75 % of a caretaker's pay when the caretaker both cleans and takes out the waste, 40 % for one of the two;
// a building employee who is not a caretaker counts in full.
test("a caretaker's pay is passed on in the share the decree sets for each case", () =>
{
    expect(caretakerShares).toEqual({ both: 75, one: 40, employee: 100 });
});
