import { expect, test } from "vitest";

import type { Listing } from "@plafond/ademe";

import { dpeStart, nextDpe, type DpeEvent, type DpeFields, type DpeStep } from "../lib/dpe-flow";

const g: Listing = {
    dpe: { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" },
    address: "7 Place du Panthéon 75005 Paris",
    surface: 7320,
    floor: 4,
    detail: null,
    electric: true,
};
const e: Listing = { ...g, dpe: { ...g.dpe, number: "2375E1759742J", label: "E" } };

const world = { on: "2026-10-03" };
const typed = "7 place du Panthéon";
const filled: DpeFields = { signedOn: "2023-03-01", furnished: "no", landlord: "person", raised: "yes", raisedOn: "2024-03-01" };

function walk(...events: DpeEvent[]): DpeStep
{
    return events.reduce((step, event) => nextDpe(step, event, world), dpeStart);
}

test("the diagnoses found are offered to choose from, the text kept", () =>
{
    expect(walk({ type: "searched", typed, outcome: { kind: "listed", listings: [g, e] } })).toEqual({ at: "choose", typed, listings: [g, e] });
});

test("a search that fails stays on the first step and says why", () =>
{
    expect(walk({ type: "searched", typed, outcome: { kind: "refused", problem: "no-diagnosis" } })).toEqual({ at: "find", typed, problem: "no-diagnosis" });
});

test("a chosen diagnosis opens an empty lease form", () =>
{
    const step = walk({ type: "searched", typed, outcome: { kind: "listed", listings: [g, e] } }, { type: "chose", index: 0 });

    expect(step).toMatchObject({ at: "lease", listing: g, errors: {} });
    expect(step.at === "lease" && Object.values(step.fields).every((value) => value === "")).toBe(true);
});

test("an incomplete lease stays on the form, and the day of the rise is asked only if there was one", () =>
{
    const chosen: DpeEvent[] = [{ type: "searched", typed, outcome: { kind: "listed", listings: [g] } }, { type: "chose", index: 0 }];

    expect(walk(...chosen, { type: "answered", fields: { ...filled, signedOn: "" } })).toMatchObject({ at: "lease", errors: { signedOn: expect.any(String) } });
    expect(walk(...chosen, { type: "answered", fields: { ...filled, raisedOn: "" } })).toMatchObject({ at: "lease", errors: { raisedOn: expect.any(String) } });
    expect(walk(...chosen, { type: "answered", fields: { ...filled, raised: "no", raisedOn: "" } })).toMatchObject({ at: "result" });
    expect(walk(...chosen, { type: "answered", fields: { ...filled, raised: "no" } })).toMatchObject({ at: "result", raisedOn: null, increase: null });
});

test("a G flat raised after the freeze shows both findings and offers the letter", () =>
{
    const step = walk({ type: "searched", typed, outcome: { kind: "listed", listings: [g] } }, { type: "chose", index: 0 }, { type: "answered", fields: filled });

    expect(step).toMatchObject({
        at: "result",
        increase: { kind: "forbidden", since: "2023-03-01" },
        decency: { kind: "not-decent", since: "2026-03-01" },
        letter: { demands: [{ ground: "freeze" }, { ground: "decency" }] },
    });
});

test("an E flat offers no letter, and asking for one changes nothing", () =>
{
    const step = walk({ type: "searched", typed, outcome: { kind: "listed", listings: [e] } }, { type: "chose", index: 0 }, { type: "answered", fields: filled });

    expect(step).toMatchObject({ at: "result", letter: null });
    expect(nextDpe(step, { type: "wrote" }, world)).toBe(step);
});

test("going back retraces every step and keeps what was typed", () =>
{
    const all: DpeEvent[] = [{ type: "searched", typed, outcome: { kind: "listed", listings: [g] } }, { type: "chose", index: 0 }, { type: "answered", fields: filled }, { type: "wrote" }];
    const back: DpeEvent = { type: "back" };

    expect(walk(...all).at).toBe("letter");
    expect(walk(...all, back).at).toBe("result");
    expect(walk(...all, back, back)).toMatchObject({ at: "lease", fields: filled });
    expect(walk(...all, back, back, back)).toMatchObject({ at: "choose", listings: [g] });
    expect(walk(...all, back, back, back, back)).toEqual({ at: "find", typed, problem: null });
});

test("who lets the flat is asked, and a company's lease is reckoned in spans of 6 years", () =>
{
    const chosen: DpeEvent[] = [{ type: "searched", typed, outcome: { kind: "listed", listings: [g] } }, { type: "chose", index: 0 }];

    expect(walk(...chosen, { type: "answered", fields: { ...filled, landlord: "" } })).toMatchObject({ at: "lease", errors: { landlord: expect.any(String) } });
    expect(walk(...chosen, { type: "answered", fields: { ...filled, landlord: "company" } })).toMatchObject({ at: "result", decency: { kind: "from", on: "2029-03-01" } });
});

