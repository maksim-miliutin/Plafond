import { expect, test } from "vitest";

import type { Quartier, Rate } from "@plafond/domain";
import type { Lookup } from "@plafond/address";

import type { LeaseFields } from "../lib/lease";
import { next, start, type Step, type World } from "../lib/flow";
import { law, rate } from "./fixtures";

const side = 0.005;

function square(number: number, name: string, west: number): Quartier
{
    const south = 48.86;
    const ring: [number, number][] = [[west, south], [west + side, south], [west + side, south + side], [west, south + side], [west, south]];

    return { number, name, rings: [ring] };
}

const one = square(1, "Saint-Germain-l'Auxerrois", 2.34);
const two = square(2, "Halles", 2.34 + side);

const world: World = { city: "paris", rates: [rate], quartiers: [one, two], on: "2026-09-29", law };

const filled: LeaseFields = {
    dwelling: "",
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
const found: Lookup = { kind: "located", id: "75101_5925_00004", citycode: "75101", label: "4 Place du Louvre 75001 Paris", point: { lon: 2.3425, lat: 48.8625 } };

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
    const far: Lookup = { kind: "located", id: "75116_0001_00001", citycode: "75116", label: "Somewhere", point: { lon: 2.2, lat: 48.8 } };
    const line: Lookup = { kind: "located", id: "75101_0001_00001", citycode: "75101", label: "On the line", point: { lon: 2.34 + side, lat: 48.8625 } };

    expect(walk({ type: "located", typed, lookup: far })).toMatchObject({ at: "address", problem: "outside" });
    expect(walk({ type: "located", typed, lookup: line })).toMatchObject({ at: "address", problem: "border" });
});

test("a confirmed quartier opens an empty lease form", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" });

    expect(step).toMatchObject({ at: "lease", errors: {}, unchecked: null });
    expect(step.at === "lease" && Object.values(step.fields).every((value) => value === "")).toBe(true);
});

test("an incomplete lease stays on the form with its questions", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, rent: "" } });

    expect(step).toMatchObject({ at: "lease", fields: { rent: "" }, errors: { rent: expect.any(String) } });
});

test("a lease signed after the last day of the law stays on the form, with that day", () =>
{
    const step = walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, signedOn: "2026-11-25", startsOn: "2026-11-25" } });

    expect(step).toMatchObject({ at: "lease", unchecked: { kind: "lapsed", lastDay: "2026-11-24" }, errors: {} });
});

test("a lease signed on a day no rate covers says so on the form, and on which side of the known decrees", () =>
{
    const signed = (signedOn: string) => walk({ type: "located", typed, lookup: found }, { type: "confirmed" }, { type: "answered", fields: { ...filled, signedOn, startsOn: signedOn } });

    expect(signed("2026-08-01")).toMatchObject({ at: "lease", unchecked: { side: "after", until: "2026-06-30" }, errors: {} });
    expect(signed("2025-06-01")).toMatchObject({ at: "lease", unchecked: { side: "between" }, errors: {} });
    expect(signed("2019-06-01")).toMatchObject({ at: "lease", unchecked: { side: "before", from: "2019-07-01" }, errors: {} });
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

test("the city of the world that located the address goes with the place, and into the claim", () =>
{
    const lyonWorld: World = { ...world, city: "lyon", rates: [{ ...rate, flat: { ...rate.flat, city: "lyon" } }] };
    const placed = next(start, { type: "located", typed, lookup: found }, lyonWorld);
    const claimed = next(next(placed, { type: "confirmed" }, lyonWorld), { type: "answered", fields: filled }, lyonWorld);

    expect(placed).toMatchObject({ at: "quartier", place: { city: "lyon" } });
    expect(claimed).toMatchObject({ at: "result", claim: { flat: { city: "lyon" } } });
});


// Lyon's control began on 1 November 2021 but Plafond holds its tables only from November 2022; a lease in between must
// not be told the law did not yet apply.
test("a lease signed after the city's control began but before the first table Plafond holds is a gap in the data, not in the law", () =>
{
    const lyonWorld: World = { ...world, city: "lyon", rates: [{ ...rate, flat: { ...rate.flat, city: "lyon" }, decree: { ...rate.decree, from: "2022-11-01", until: "2023-11-01" } }] };
    const signed = (signedOn: string) => next(next(next(start, { type: "located", typed, lookup: found }, lyonWorld), { type: "confirmed" }, lyonWorld), { type: "answered", fields: { ...filled, signedOn, startsOn: signedOn } }, lyonWorld);

    expect(signed("2022-03-01")).toMatchObject({ at: "lease", unchecked: { side: "between" } });
    expect(signed("2021-06-01")).toMatchObject({ at: "lease", unchecked: { side: "before", from: "2021-11-01" } });
});

// Est Ensemble: Pantin lies whole in sector 308 and has no outline; Montreuil is split, here as two squares side by side.
const pantin: Quartier = { number: 308, name: "Pantin", rings: [], commune: "93055" };
const infraOne: Quartier = { ...square(307, "Montreuil", 2.44), commune: "93048" };
const infraTwo: Quartier = { ...square(308, "Montreuil", 2.44 + side), commune: "93048" };
const decree2026 = { title: "Arrêté préfectoral n° IDF-2026-04-28-00032", url: "https://example.org/ee", from: "2026-06-01", until: "2026-11-25", contest: null };
const pantinFlat: Rate = { flat: { city: "est-ensemble", quartier: 308, rooms: 2, period: "1946-1970", furnished: false, dwelling: "flat" }, reference: 1900, majored: 2280, minored: 1330, decree: decree2026 };
const east: World = { city: "est-ensemble", rates: [pantinFlat], quartiers: [pantin, infraOne, infraTwo], on: "2026-09-29", law };

function eastWalk(...events: Parameters<typeof next>[1][]): Step
{
    return events.reduce((step, event) => next(step, event, east), start);
}

const inPantin: Lookup = { kind: "located", id: "93055_1234_00012", citycode: "93055", label: "12 Rue Hoche 93500 Pantin", point: { lon: 2.404, lat: 48.894 } };

test("an Est Ensemble address is placed by its commune, and the map shows no other commune's sector", () =>
{
    const step = eastWalk({ type: "located", typed: "12 rue hoche pantin", lookup: inPantin });

    expect(step).toMatchObject({ at: "quartier", place: { city: "est-ensemble", quartier: { name: "Pantin", number: 308 }, around: [] } });
});

test("a Montreuil address is placed by its point, beside the other Montreuil sector", () =>
{
    const inMontreuil: Lookup = { ...inPantin, citycode: "93048", label: "1 Rue de Paris 93100 Montreuil", point: { lon: 2.44 + side * 1.5, lat: 48.8625 } };
    const step = eastWalk({ type: "located", typed: "1 rue de paris montreuil", lookup: inMontreuil });

    expect(step).toMatchObject({ at: "quartier", place: { quartier: { name: "Montreuil", number: 308 } } });
    expect(step.at === "quartier" && step.place.around).toEqual([infraOne]);
});

// An address the outlines cannot place goes back to the first step, which links the territory's official simulator.
test("a Montreuil address off both outlines is sent back with the territory it was looked for in", () =>
{
    const astray: Lookup = { ...inPantin, citycode: "93048", label: "200 Rue de Paris 93100 Montreuil", point: { lon: 2.5, lat: 48.8625 } };

    expect(eastWalk({ type: "located", typed: "200 rue de paris montreuil", lookup: astray })).toEqual({ at: "address", typed: "200 rue de paris montreuil", problem: "outside", city: "est-ensemble" });
});

// 38 m² at 22,80 €, the majored rent of sector 308 for an empty flat of two rooms built 1946-1970 under the 2026 decree.
test("an Est Ensemble lease names its dwelling and is capped by its own grid", () =>
{
    const lease = { ...filled, dwelling: "flat", rooms: "2", furnished: "no", surface: "38", rent: "900", signedOn: "2026-07-15", startsOn: "2026-07-15" };
    const asked = eastWalk({ type: "located", typed: "12 rue hoche pantin", lookup: inPantin }, { type: "confirmed" }, { type: "answered", fields: { ...lease, dwelling: "" } });
    const done = eastWalk({ type: "located", typed: "12 rue hoche pantin", lookup: inPantin }, { type: "confirmed" }, { type: "answered", fields: lease });

    expect(asked).toMatchObject({ at: "lease", errors: { dwelling: expect.any(String) } });
    expect(done).toMatchObject({ at: "result", check: { cap: 86640, excess: 3360 }, claim: { flat: { dwelling: "flat", quartier: 308 } } });
});
