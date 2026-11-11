import { expect, test } from "vitest";

import type { IndexRow } from "@plafond/domain";

import { nextRevision, revisionStart, type RevisionEvent, type RevisionFields, type RevisionStep } from "../lib/revision-flow";

const index: IndexRow[] = [
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
];
const world = { on: "2026-10-12", index };
const filled: RevisionFields = {
    address: "12 Rue des Lilas 69003 Lyon",
    clause: "yes",
    rent: "600",
    asked: "620",
    quarter: "2",
    signedOn: "2025-07-20",
    revisedOn: "2026-07-20",
    askedOn: "2026-08-03",
};

function walk(...events: RevisionEvent[]): RevisionStep
{
    return events.reduce<RevisionStep>((step, event) => nextRevision(step, event, world), revisionStart);
}

test("the check starts on an empty form", () =>
{
    expect(revisionStart).toMatchObject({ at: "form", errors: {} });
    expect(Object.values(revisionStart.fields).every((value) => value === "")).toBe(true);
});

test("each missing or impossible answer is asked for under its own field", () =>
{
    const missing = walk({ type: "answered", fields: { ...filled, clause: "", asked: "", quarter: "", askedOn: "" } });

    expect(missing.at === "form" && Object.keys(missing.errors).sort()).toEqual(["asked", "askedOn", "clause", "quarter"]);
    expect(walk({ type: "answered", fields: { ...filled, quarter: "5" } })).toMatchObject({ at: "form", errors: { quarter: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, rent: "0" } })).toMatchObject({ at: "form", errors: { rent: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, askedOn: "2026-02-30" } })).toMatchObject({ at: "form", errors: { askedOn: expect.any(String) } });
});

test("a rise above the index shows what was allowed and offers the letter", () =>
{
    expect(walk({ type: "answered", fields: filled })).toMatchObject({
        at: "result",
        lease: { clause: true, rent: 60000, asked: 62000, quarter: 2 },
        check: { kind: "revised", allowed: 60691, excess: 1309 },
        letter: { demands: [{ ground: "revision" }] },
    });
});

test("a lease naming no quarter, or a tenant unsure of the clause, is checked on the landlord's best case", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, quarter: "none" } })).toMatchObject({ lease: { quarter: null }, check: { assumed: true } });
    expect(walk({ type: "answered", fields: { ...filled, clause: "unknown" } })).toMatchObject({ lease: { clause: true }, clauseAssumed: true });
    expect(walk({ type: "answered", fields: filled })).toMatchObject({ clauseAssumed: false });
});

test("with nothing to claim there is no letter, and asking for one changes nothing", () =>
{
    const within = walk({ type: "answered", fields: { ...filled, asked: "606,91" } });

    expect(within).toMatchObject({ at: "result", check: { excess: 0 }, letter: null });
    expect(nextRevision(within, { type: "wrote" }, world)).toBe(within);
});

test("going back keeps what was typed, and free help returns to the same result", () =>
{
    const result = walk({ type: "answered", fields: filled });
    const letter = nextRevision(result, { type: "wrote" }, world);
    const help = nextRevision(result, { type: "helped" }, world);

    expect(letter.at).toBe("letter");
    expect(nextRevision(letter, { type: "back" }, world)).toMatchObject({ at: "result" });
    expect(nextRevision(result, { type: "back" }, world)).toMatchObject({ at: "form", fields: filled, errors: {} });
    expect(nextRevision(help, { type: "back" }, world)).toBe(result);
});
