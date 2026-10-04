import { expect, test } from "vitest";

import type { Quartier } from "@plafond/domain";
import type { Lookup } from "@plafond/address";

import type { LeaseFields } from "../lib/lease";
import { next, start, type Step, type World } from "../lib/flow";
import { rate } from "./fixtures";

const side = 0.005;

function square(number: number, name: string, west: number): Quartier
{
    const south = 48.86;
    const ring: [number, number][] = [[west, south], [west + side, south], [west + side, south + side], [west, south + side], [west, south]];

    return { number, name, rings: [ring] };
}

const one = square(1, "Saint-Germain-l'Auxerrois", 2.34);
const two = square(2, "Halles", 2.34 + side);

const world: World = { rates: [rate], quartiers: [one, two], on: "2026-09-29" };

const filled: LeaseFields = {
    rooms: "3",
    period: "1946-1970",
    furnished: "yes",
    surface: "40",
    rent: "1 500",
    complement: "",
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    stated: "yes",
};

const typed = "4 place du louvre";
const found: Lookup = { kind: "located", id: "75101_5925_00004", label: "4 Place du Louvre 75001 Paris", point: { lon: 2.3425, lat: 48.8625 } };

function walk(...events: Parameters<typeof next>[1][]): Step
{
    return events.reduce((step, event) => next(step, event, world), start);
}

test("an address inside a quartier asks to confirm that quartier", () =>
{
    const step = walk({ type: "located", typed, lookup: found });

    expect(step).toMatchObject({ at: "quartier", place: { label: "4 Place du Louvre 75001 Paris", quartier: { number: 1 } } });
    expect(step.at === "quartier" && step.place.around.map((q) => q.number)).toEqual([2]);
});

test("an address the geocoder cannot place stays on the first step, keeps the text and says why", () =>
{
    const refusals: Lookup[] = [
        { kind: "not-found" },
        { kind: "not-paris", label: "4 Place du Louvre 69001 Lyon" },
        { kind: "street-only", label: "Rue de Rivoli 75001 Paris" },
        { kind: "unreachable" },
    ];

    for (const lookup of refusals)
    {
        expect(walk({ type: "located", typed, lookup })).toEqual({ at: "address", typed, problem: lookup.kind });
    }
});

test("an address that falls outside every outline, or on the line between two, is told apart", () =>
{
    const far: Lookup = { kind: "located", id: "75116_0001_00001", label: "Somewhere", point: { lon: 2.2, lat: 48.8 } };
    const line: Lookup = { kind: "located", id: "75101_0001_00001", label: "On the line", point: { lon: 2.34 + side, lat: 48.8625 } };

    expect(walk({ type: "located", typed, lookup: far })).toMatchObject({ at: "address", problem: "outside" });
    expect(walk({ type: "located", typed, lookup: line })).toMatchObject({ at: "address", problem: "border" });
});

test("a confirmed quartier opens an empty lease form", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" });

    expect(step).toMatchObject({ at: "lease", errors: {}, noRate: null });
    expect(step.at === "lease" && Object.values(step.fields).every((value) => value === "")).toBe(true);
});

test("an incomplete lease stays on the form with its questions", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, rent: "" } });

    expect(step).toMatchObject({ at: "lease", fields: { rent: "" }, errors: { rent: expect.any(String) } });
});

test("a lease signed on a day no rate covers says so on the form, and on which side of the known decrees", () =>
{
    const signed = (signedOn: string) => walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, signedOn, startsOn: signedOn } });

    expect(signed("2026-08-01")).toMatchObject({ at: "lease", noRate: { side: "after", until: "2026-06-30" }, errors: {} });
    expect(signed("2025-06-01")).toMatchObject({ at: "lease", noRate: { side: "before", from: "2025-07-01" }, errors: {} });
});

test("a lease over the cap shows the check and offers the letter", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: filled });

    expect(step).toMatchObject({ at: "result", check: { cap: 128000, excess: 22000 }, letter: { kind: "letter" } });
});

test("a lease within the cap with nothing to put right offers no letter, and asking for one changes nothing", () =>
{
    const within = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, rent: "1 200" } });

    expect(within).toMatchObject({ at: "result", letter: null });
    expect(next(within, { type: "wrote" }, world)).toBe(within);
});

test("a lease that leaves out the reference rents gets a letter while its month runs, even within the cap", () =>
{
    const recent = { ...filled, rent: "1 200", signedOn: "2026-06-20", startsOn: "2026-09-15" };
    const answer = (stated: string) =>
        walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...recent, stated } });

    expect(answer("no")).toMatchObject({ at: "result", letter: { demands: [{ ground: "unstated" }] } });
    expect(answer("yes")).toMatchObject({ at: "result", letter: null });
});

test("the letter names the flat by the address the geocoder found", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: filled }, { type: "wrote" });

    expect(step.at).toBe("letter");
    expect(step.at === "letter" && step.letter.sender).toContain("4 Place du Louvre 75001 Paris");
});

test("going back retraces every step and keeps what was typed", () =>
{
    const events = [{ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: filled }, { type: "wrote" }] as const;
    const back = { type: "back" } as const;

    expect(walk(...events, back).at).toBe("result");
    expect(walk(...events, back, back)).toMatchObject({ at: "lease", fields: filled });
    expect(walk(...events, back, back, back).at).toBe("quartier");
    expect(walk(...events, back, back, back, back)).toEqual({ at: "address", typed, problem: null });
    expect(walk(back)).toBe(start);
});

test("an event that does not belong to the step changes nothing", () =>
{
    expect(walk({ type: "confirmed" })).toBe(start);
    expect(walk({ type: "answered", fields: filled })).toBe(start);

    const asked = walk({ type: "located", typed, lookup: found });
    expect(next(asked, { type: "located", typed: "ailleurs", lookup: found }, world)).toBe(asked);
});

test("free help opens from the result and going back returns to the very same result", () =>
{
    const checked = walk({ type: "located", typed: "4 place du Louvre", lookup: found }, { type: "confirmed" }, { type: "answered", fields: filled });
    const help = next(checked, { type: "helped" }, world);

    expect(checked.at).toBe("result");
    expect(help).toEqual({ at: "help", from: checked });
    expect(next(help, { type: "back" }, world)).toBe(checked);
    expect(next(start, { type: "helped" }, world)).toBe(start);
});
