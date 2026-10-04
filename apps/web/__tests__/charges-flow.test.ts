import { expect, test } from "vitest";

import { chargesStart, nextCharges, type ChargesEvent, type ChargesStep } from "../lib/charges-flow";

const world = { on: "2026-03-01" };
const filled: Record<string, string> = {
    ...(chargesStart.at === "form" ? chargesStart.fields : {}),
    address: "12 Rue des Lilas 69003 Lyon",
    year: "2024",
    receivedOn: "2026-02-10",
    provisions: "900",
    "amount-water": "300",
    "amount-insurance": "150",
    "amount-manager-fees": "200",
    "amount-caretaker": "400",
    caretaker: "one",
    "amount-waste-tax": "180",
};

function walk(...events: ChargesEvent[]): ChargesStep
{
    return events.reduce((step, event) => nextCharges(step, event, world), chargesStart);
}

test("the check starts on an empty form with one amount for each kind of charge in the table", () =>
{
    expect(chargesStart.at).toBe("form");
    expect(chargesStart.at === "form" && Object.keys(chargesStart.fields).filter((key) => key.startsWith("amount-")).length).toBe(16);
});

test("a filled form reckons the statement and offers the letter", () =>
{
    expect(walk({ type: "answered", fields: filled })).toMatchObject({
        at: "result",
        check: { billed: 123000, allowed: 64000, wrong: 59000, balance: -26000, twelfths: true },
        letter: { demands: [{ ground: "charges" }, { ground: "proofs" }] },
    });
});

test("missing answers, an unreadable amount, a caretaker without tasks or no line at all are asked for", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, year: "24", receivedOn: "" } })).toMatchObject({ at: "form", errors: { year: expect.any(String), receivedOn: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, "amount-water": "trois cents" } })).toMatchObject({ at: "form", errors: { "amount-water": expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, caretaker: "" } })).toMatchObject({ at: "form", errors: { caretaker: expect.any(String) } });

    const empty = Object.fromEntries(Object.entries(filled).map(([key, value]) => [key, key.startsWith("amount-") ? "" : value]));
    expect(walk({ type: "answered", fields: empty })).toMatchObject({ at: "form", errors: { lines: expect.any(String) } });
});

test("a caretaker's tasks are not asked when no caretaker is billed", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, "amount-caretaker": "", caretaker: "" } })).toMatchObject({ at: "result" });
});

test("going back keeps what was typed, and free help returns to the same result", () =>
{
    const result = walk({ type: "answered", fields: filled });
    const help = nextCharges(result, { type: "helped" }, world);

    expect(nextCharges(nextCharges(result, { type: "wrote" }, world), { type: "back" }, world)).toMatchObject({ at: "result" });
    expect(nextCharges(result, { type: "back" }, world)).toMatchObject({ at: "form", fields: filled, errors: {} });
    expect(nextCharges(help, { type: "back" }, world)).toBe(result);
});
