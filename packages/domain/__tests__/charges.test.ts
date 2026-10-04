import { expect, test } from "vitest";

import { ChargesError, caretakerShares, chargeKinds, charges, type CaretakerCase, type Regularisation } from "../src/charges.js";

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

// Counted by hand: 300 € of water, 150 € of insurance, 200 € of manager's fees, 400 € of a caretaker who does one of the
// two tasks (40 %, so 160 €) and 180 € of waste tax, against 900 € of advances paid over 2024.
const regularised: Regularisation = {
    year: 2024,
    lines: [
        { kind: "water", billed: 30000 },
        { kind: "insurance", billed: 15000 },
        { kind: "manager-fees", billed: 20000 },
        { kind: "caretaker", billed: 40000, caretaker: "one" },
        { kind: "waste-tax", billed: 18000 },
    ],
    provisions: 90000,
    receivedOn: "2026-02-10",
};

test("a regularisation is split into what may be passed on and what was charged wrongly", () =>
{
    expect(charges(regularised)).toMatchObject({ billed: 123000, allowed: 64000, wrong: 59000, provisions: 90000, balance: -26000 });
});

test("each line keeps what may be passed on of it", () =>
{
    expect(charges(regularised).lines.map((line) => [line.kind.id, line.allowed])).toEqual([
        ["water", 30000],
        ["insurance", 0],
        ["manager-fees", 0],
        ["caretaker", 16000],
        ["waste-tax", 18000],
    ]);
});

test("a caretaker's share is rounded half up, the one rule for money", () =>
{
    const one = (caretaker: CaretakerCase, billed: number) => charges({ ...regularised, lines: [{ kind: "caretaker", billed, caretaker }] }).allowed;

    expect(one("both", 40000)).toBe(30000);
    expect(one("employee", 40000)).toBe(40000);
    expect(one("both", 12345)).toBe(9259);
});

// Loi du 6 juillet 1989, article 23: a regularisation made after the end of the calendar year that follows the charges'
// year may be paid in twelve monthly parts; the proofs stay open to the tenant for six months after the statement is sent.
test("a regularisation received after the end of the following year may be paid in twelfths, and the proofs stay open six months", () =>
{
    expect(charges(regularised)).toMatchObject({ twelfths: true, proofsUntil: "2026-08-10" });
    expect(charges({ ...regularised, receivedOn: "2025-12-31" })).toMatchObject({ twelfths: false, proofsUntil: "2026-06-30" });
});

test("a kind the table does not know, or a caretaker without a case, is a breakage", () =>
{
    expect(() => charges({ ...regularised, lines: [{ kind: "parking", billed: 1000 }] })).toThrow(ChargesError);
    expect(() => charges({ ...regularised, lines: [{ kind: "caretaker", billed: 1000 }] })).toThrow(/caretaker/);
});
