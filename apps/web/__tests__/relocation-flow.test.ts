/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { indexOf, relocationRulesOf, zoneListsOf } from "@plafond/import";

import { asked, nextRelocation, relocationStart, type RelocationFields, type RelocationWorld } from "../lib/relocation-flow";

import sources from "../../../db/seed/zone-lists.json?raw";
import rules from "../../../db/seed/relocation-rules.json?raw";
import irl from "../../../db/seed/irl.json?raw";
import { regionList } from "./zone-seeds";

const world: RelocationWorld = {
    communes: regionList.filter((row) => ["94080", "93048", "75056", "93066", "77022", "78043", "77034", "91067", "91377"].includes(row.code)),
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

test("the commune is read from its name and department, its code, or a name only one commune bears", () =>
{
    expect(answer({ commune: "Massy (91)" })).toMatchObject({ at: "result", commune: { code: "91377" } });
    expect(answer({ commune: "massy" })).toMatchObject({ at: "result", commune: { code: "91377" } });
    expect(answer({ commune: "Pierrefitte-sur-Seine" })).toMatchObject({ at: "result", commune: { code: "93066" } });
    expect(answer({ commune: "Blandy" })).toMatchObject({ at: "form", errors: { commune: "Plusieurs communes portent ce nom : choisissez celle de votre département dans la liste." } });
    expect(answer({ commune: "Blandy (77)" })).toMatchObject({ at: "result", commune: { code: "77034" } });
});

// Article 1 of décret n° 2017-1198 reads part 1 of the list: Barbizon is only in part 2, Bailly in zone A bis but in neither part.
test("outside part 1 of the list the decree does not apply, though an F or G dwelling stays frozen", () =>
{
    expect(answer({ commune: "77022" })).toMatchObject({ at: "result", check: { kind: "untense" } });
    expect(answer({ commune: "78043" })).toMatchObject({ at: "result", check: { kind: "untense" } });
    expect(answer({ commune: "77022", dpe: "G", vacancy: "", revised: "", basis: "" })).toMatchObject({ at: "result", check: { kind: "frozen" } });
});

// Décret n° 2023-642 covered the leases signed from 1 August 2023; Vincennes was in part 1 of the list then too.
test("an older lease is read under the decree of its year, with the index published by its signature", () =>
{
    const step = answer({ signedOn: "2024-03-01", revised: "no", proposed: "1 100" });

    expect(step).toMatchObject({ at: "result", check: { kind: "indexed", period: { from: "2023-08-01" }, to: { year: 2023, quarter: 4 }, from: { year: 2022, quarter: 4 } } });
    expect(answer({ signedOn: "2017-09-01", revised: "no" })).toMatchObject({
        at: "result",
        check: { kind: "indexed", period: { from: "2017-08-01" }, to: { year: 2017, quarter: 2 }, from: { year: 2016, quarter: 2 }, allowed: 100750 },
    });
});
