/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { indexOf, relocationRulesOf, zoneListsOf } from "@plafond/import";

import { asked, nextRelocation, relocationStart, type RelocationFields, type RelocationWorld } from "../lib/relocation-flow";

import sources from "../../../db/seed/zone-lists.json?raw";
import rules from "../../../db/seed/relocation-rules.json?raw";
import irl from "../../../db/seed/irl.json?raw";
import { seededZones } from "./zone-seeds";

const world: RelocationWorld = {
    communes: seededZones.filter((row) => ["94080", "93048", "75056"].includes(row.code)),
    lists: zoneListsOf(JSON.parse(sources)),
    capped: ["75056", "93048"],
    periods: relocationRulesOf(JSON.parse(rules)),
    index: indexOf(JSON.parse(irl)).rows,
};

// The acceptance case: a D dwelling in Vincennes relet after two months, its last rent of 1 000 € revised in the year before.
const vincennes: RelocationFields = {
    commune: "94080",
    signedOn: "2026-09-01",
    proposed: "1 080",
    first: "no",
    dpe: "D",
    vacancy: "within",
    lastRent: "1000",
    revised: "yes",
    basis: "none",
};

const answer = (changes: Partial<RelocationFields>) => nextRelocation(relocationStart, { type: "answered", fields: { ...vincennes, ...changes } }, world);

test("Vincennes: 1 080 € asked over a last rent of 1 000 € revised in the year is 80 € too much", () =>
{
    const step = answer({});

    expect(step).toMatchObject({ at: "result", capped: false, check: { kind: "kept", allowed: 100000, excess: 8000 } });
});

test("in Paris and Montreuil the result also leads to the rent cap, elsewhere it does not", () =>
{
    expect(answer({ commune: "75056" })).toMatchObject({ at: "result", capped: true });
    expect(answer({ commune: "93048" })).toMatchObject({ at: "result", capped: true });
});

test("the form asks only what the case needs: nothing of the last rent for a first letting, no vacancy for an F or G dwelling", () =>
{
    expect(asked({ ...vincennes, first: "yes" })).toEqual(["commune", "signedOn", "proposed", "first"]);
    expect(asked({ ...vincennes, dpe: "G" })).toEqual(["commune", "signedOn", "proposed", "first", "dpe", "lastRent"]);
    expect(asked(vincennes)).toEqual(["commune", "signedOn", "proposed", "first", "dpe", "vacancy", "lastRent", "revised", "basis"]);

    expect(answer({ first: "yes", dpe: "", vacancy: "", lastRent: "", revised: "", basis: "" })).toMatchObject({ at: "result", check: { kind: "first-letting" } });
    expect(answer({ dpe: "G", vacancy: "", revised: "", basis: "" })).toMatchObject({ at: "result", check: { kind: "frozen", allowed: 100000 } });
});

test("an answer the case needs and the tenant does not know is named rather than guessed", () =>
{
    expect(answer({ lastRent: "" })).toMatchObject({ at: "result", check: { kind: "missing", field: "lastRent" } });
    expect(answer({ dpe: "unknown" })).toMatchObject({ at: "result", check: { kind: "missing", field: "dpe" } });
    expect(answer({ vacancy: "unknown" })).toMatchObject({ at: "result", check: { kind: "missing", field: "vacancy" } });
    expect(answer({ revised: "unknown" })).toMatchObject({ at: "result", check: { kind: "missing", field: "revised" } });
});

test("a first letting or a reason the tenant does not know is taken as the usual case, and the result says so", () =>
{
    expect(answer({ first: "unknown" })).toMatchObject({ at: "result", firstAssumed: true, check: { kind: "kept" } });
    expect(answer({ basis: "unknown" })).toMatchObject({ at: "result", basisAssumed: true, check: { kind: "kept" } });
    expect(answer({ basis: "works" })).toMatchObject({ at: "result", check: { kind: "special", basis: "works" } });
});

test("a commune outside the list, a missing answer or an amount that cannot be read stays on the form with the question", () =>
{
    const step = answer({ commune: "12345", signedOn: "", proposed: "beaucoup", lastRent: "mille", dpe: "" });

    expect(step.at).toBe("form");
    expect(step.at === "form" && Object.keys(step.errors).sort()).toEqual(["commune", "dpe", "lastRent", "proposed", "signedOn"]);
});

test("a lease signed on 31 July 2027 is within the rules, one signed the next day is not", () =>
{
    expect(answer({ signedOn: "2027-07-31" })).toMatchObject({ at: "result", check: { kind: "kept" } });
    expect(answer({ signedOn: "2027-08-01" })).toMatchObject({ at: "result", check: { kind: "no-rules" } });
});

test("back from the result keeps the answers, and back from help returns to the result", () =>
{
    const result = answer({});
    const help = nextRelocation(result, { type: "helped" }, world);

    expect(nextRelocation(result, { type: "back" }, world)).toEqual({ at: "form", fields: vincennes, errors: {} });
    expect(nextRelocation(help, { type: "back" }, world)).toEqual(result);
});
