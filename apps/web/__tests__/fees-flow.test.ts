import { expect, test } from "vitest";

import type { FeeCaps } from "@plafond/domain";

import { feesStart, nextFees, type FeesEvent, type FeesFields, type FeesStep } from "../lib/fees-flow";

const caps: FeeCaps[] = [
    {
        from: "2026-01-01",
        until: "2027-01-01",
        letting: { "very-tense": 1210, tense: 1009, other: 807 },
        inspection: 303,
        title: "Arrêté du 17 juillet 2025",
        url: "https://example.org/caps",
    },
];
const world = { on: "2026-10-11", caps };
const filled: FeesFields = {
    address: "4 Place du Louvre 75001 Paris",
    zone: "very-tense",
    surface: "42,5",
    signedOn: "2026-03-01",
    letting: "800",
    inspection: "150",
};

function walk(...events: FeesEvent[]): FeesStep
{
    return events.reduce<FeesStep>((step, event) => nextFees(step, event, world), feesStart);
}

test("the check starts on an empty form", () =>
{
    expect(feesStart).toMatchObject({ at: "form", errors: {} });
    expect(Object.values(feesStart.fields).every((value) => value === "")).toBe(true);
});

test("each missing answer is asked for under its own field, and no inspection charged needs no sum", () =>
{
    const missing = walk({ type: "answered", fields: { ...filled, zone: "", surface: "", signedOn: "", letting: "" } });

    expect(missing.at === "form" && Object.keys(missing.errors).sort()).toEqual(["letting", "signedOn", "surface", "zone"]);
    expect(walk({ type: "answered", fields: { ...filled, surface: "0" } })).toMatchObject({ at: "form", errors: { surface: expect.any(String) } });
    expect(walk({ type: "answered", fields: { ...filled, inspection: "" } })).toMatchObject({ at: "result", paid: { inspection: 0 } });
});

// A zone checked with "in" let "constructor" and "toString" through, as keys every object has.
test("a zone outside the choices offered is refused, even one every object answers to", () =>
{
    for (const zone of ["somewhere", "constructor", "toString"])
    {
        expect(walk({ type: "answered", fields: { ...filled, zone } }), zone).toMatchObject({ at: "form", errors: { zone: expect.any(String) } });
    }
});

test("fees above the caps show what was charged too much and offer the letter to the agency", () =>
{
    expect(walk({ type: "answered", fields: filled })).toMatchObject({
        at: "result",
        paid: { zone: "very-tense", surface: 4250, letting: 80000, inspection: 15000 },
        check: { kind: "fees", excess: 30697 },
        letter: { recipient: ["[Nom de l'agence]", "[Adresse de l'agence]"], demands: [{ ground: "fees" }] },
    });
});

test("a tenant unsure of the zone is checked against the highest cap", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, zone: "unknown" } })).toMatchObject({ paid: { zone: null }, check: { assumed: true } });
});

test("a lease signed after the last caps known gets no letter", () =>
{
    expect(walk({ type: "answered", fields: { ...filled, signedOn: "2027-02-01" } })).toMatchObject({
        at: "result",
        check: { kind: "no-caps", side: "after" },
        letter: null,
    });
});

test("with nothing to claim there is no letter, and asking for one changes nothing", () =>
{
    const within = walk({ type: "answered", fields: { ...filled, letting: "300", inspection: "100" } });

    expect(within).toMatchObject({ at: "result", check: { excess: 0 }, letter: null });
    expect(nextFees(within, { type: "wrote" }, world)).toBe(within);
});

test("going back keeps what was typed, and free help returns to the same result", () =>
{
    const result = walk({ type: "answered", fields: filled });
    const letter = nextFees(result, { type: "wrote" }, world);
    const help = nextFees(result, { type: "helped" }, world);

    expect(letter.at).toBe("letter");
    expect(nextFees(letter, { type: "back" }, world)).toMatchObject({ at: "result" });
    expect(nextFees(result, { type: "back" }, world)).toMatchObject({ at: "form", fields: filled, errors: {} });
    expect(nextFees(help, { type: "back" }, world)).toBe(result);
});
