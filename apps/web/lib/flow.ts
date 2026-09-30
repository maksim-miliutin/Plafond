import { check, letter, quartierAt } from "@plafond/domain";
import type { Check, Claim, Day, Letter, Point, Quartier, Rate } from "@plafond/domain";
import type { Lookup } from "@plafond/address";

import { leaseFrom, questions, type FieldErrors, type LeaseFields } from "./lease";

export class FlowError extends Error
{
    constructor(problem: string)
    {
        super(`flow: ${problem}`);
        this.name = "FlowError";
    }
}

export interface World
{
    rates: readonly Rate[];
    quartiers: readonly Quartier[];
    on: Day;
}

export interface Place
{
    label: string;
    point: Point;
    quartier: Quartier;
    around: readonly Quartier[];
}

export type Problem = Exclude<Lookup["kind"], "located"> | "border" | "outside";

interface Found
{
    typed: string;
    place: Place;
}

interface Checked extends Found
{
    fields: LeaseFields;
    claim: Claim;
    check: Check;
}

export type Step =
    | { at: "address"; typed: string; problem: Problem | null }
    | ({ at: "quartier" } & Found)
    | ({ at: "lease"; fields: LeaseFields; errors: FieldErrors; noRate: boolean } & Found)
    | ({ at: "result"; letter: Letter | null } & Checked)
    | ({ at: "letter"; letter: Letter } & Checked);

export type Event =
    | { type: "located"; typed: string; lookup: Lookup }
    | { type: "confirmed" }
    | { type: "answered"; fields: LeaseFields }
    | { type: "wrote" }
    | { type: "back" };

export const start: Step = { at: "address", typed: "", problem: null };

const empty = Object.fromEntries(Object.keys(questions).map((key) => [key, ""])) as unknown as LeaseFields;

export function next(step: Step, event: Event, world: World): Step
{
    switch (event.type)
    {
        case "located":
            return step.at === "address" ? located(event.typed, event.lookup, world) : step;

        case "confirmed":
            return step.at === "quartier" ? { at: "lease", typed: step.typed, place: step.place, fields: empty, errors: {}, noRate: false } : step;

        case "answered":
            return step.at === "lease" ? answered(step, event.fields, world) : step;

        case "wrote":
            return step.at === "result" && step.letter !== null ? { ...step, at: "letter", letter: step.letter } : step;

        case "back":
            return back(step);
    }
}

function located(typed: string, lookup: Lookup, world: World): Step
{
    if (lookup.kind !== "located")
    {
        return { at: "address", typed, problem: lookup.kind };
    }

    const where = quartierAt(lookup.point, world.quartiers);
    if (where.kind !== "found")
    {
        return { at: "address", typed, problem: where.kind };
    }

    const quartier = world.quartiers.find((candidate) => candidate.number === where.quartier);
    if (quartier === undefined)
    {
        throw new FlowError(`quartier ${where.quartier} was found but is not among the outlines`);
    }

    const around = world.quartiers.filter((candidate) => candidate !== quartier);

    return { at: "quartier", typed, place: { label: lookup.label, point: lookup.point, quartier, around } };
}

function answered(step: Extract<Step, { at: "lease" }>, fields: LeaseFields, world: World): Step
{
    const lease = leaseFrom(fields, { quartier: step.place.quartier.number, on: world.on });
    if ("kind" in lease)
    {
        return { ...step, fields, errors: lease.fields, noRate: false };
    }

    const result = check(lease.claim, world.rates);
    if (result.kind === "no-rate")
    {
        return { ...step, fields, errors: {}, noRate: true };
    }

    if (result.kind === "invalid")
    {
        throw new FlowError(`the check refused ${result.field}, which the form had accepted`);
    }

    const written = letter({
        check: result,
        claim: lease.claim,
        address: step.place.label,
        quartier: step.place.quartier.name,
        stated: lease.stated,
    });

    return {
        at: "result",
        typed: step.typed,
        place: step.place,
        fields,
        claim: lease.claim,
        check: result,
        letter: written.kind === "letter" ? written : null,
    };
}

function back(step: Step): Step
{
    switch (step.at)
    {
        case "address":
            return step;

        case "quartier":
            return { at: "address", typed: step.typed, problem: null };

        case "lease":
            return { at: "quartier", typed: step.typed, place: step.place };

        case "result":
            return { at: "lease", typed: step.typed, place: step.place, fields: step.fields, errors: {}, noRate: false };

        case "letter":
            return { ...step, at: "result" };
    }
}
