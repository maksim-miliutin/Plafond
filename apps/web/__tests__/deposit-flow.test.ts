import { expect, test } from "vitest";

import { depositStart, nextDeposit, type DepositEvent, type DepositFields, type DepositStep } from "../lib/deposit-flow";

const world = { on: "2026-10-03" };
const filled: DepositFields = {
    address: "12 Rue des Lilas 69003 Lyon",
    rent: "1 200",
    paid: "1 200",
    furnished: "no",
    keysOn: "2026-07-01",
    conforming: "yes",
    addressGiven: "yes",
    returned: "",
    returnedOn: "",
};

function walk(...events: DepositEvent[]): DepositStep
{
    return events.reduce((step, event) => nextDeposit(step, event, world), depositStart);
}

test("the check starts on an empty form", () =>
{
    expect(depositStart.at).toBe("form");
    expect(depositStart.at === "form" && Object.values(depositStart.fields).every((value) => value === "")).toBe(true);
});

test("each missing answer is asked for under its own field, and nothing returned needs no date", () =>
{
    const missing = walk({ type: "answered", fields: { ...filled, rent: "", keysOn: "" } });

    expect(missing).toMatchObject({ at: "form", errors: { rent: expect.any(String), keysOn: expect.any(String) } });
    expect(walk({ type: "answered", fields: filled })).toMatchObject({ at: "result" });
});

test("a sum returned needs its date, and cannot exceed the deposit", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, returned: "600" } })).toMatchObject({ at: "form", errors: { returnedOn: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, returned: "1 500", returnedOn: "2026-07-20" } })).toMatchObject({ at: "form", errors: { returned: expect.any(String) } });
});

test("a deposit still held after the deadline shows the penalty and offers the letter", () =>
{
    expect(walk({ type: "answered", fields: filled })).toMatchObject({
        at: "result",
        check: { deadline: "2026-08-01", owed: 120000, late: 3, penalty: 36000 },
        letter: { demands: [{ ground: "deposit" }] },
    });
});

test("before the deadline there is nothing to write, and asking changes nothing", () =>
{
    const early = nextDeposit(depositStart, { type: "answered", fields: { ...filled, keysOn: "2026-09-20" } }, world);

    expect(early).toMatchObject({ at: "result", letter: null, check: { late: 0 } });
    expect(nextDeposit(early, { type: "wrote" }, world)).toBe(early);
});

test("going back keeps what was typed, and free help returns to the same result", () =>
{
    const result = walk({ type: "answered", fields: filled });
    const letter = nextDeposit(result, { type: "wrote" }, world);
    const help = nextDeposit(result, { type: "helped" }, world);

    expect(letter.at).toBe("letter");
    expect(nextDeposit(letter, { type: "back" }, world)).toMatchObject({ at: "result" });
    expect(nextDeposit(result, { type: "back" }, world)).toMatchObject({ at: "form", fields: filled, errors: {} });
    expect(nextDeposit(help, { type: "back" }, world)).toBe(result);
});
