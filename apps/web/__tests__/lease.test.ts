import { expect, test } from "vitest";

import { leaseFrom, type LeaseFields } from "../lib/lease";

const filled: LeaseFields = {
    rooms: "3",
    period: "1946-1970",
    furnished: "yes",
    surface: "40",
    rent: "1 500",
    complement: "",
    signedOn: "2025-08-20",
    startsOn: "2025-09-01",
};

const context = { quartier: 1, on: "2026-09-29" };

test("a filled form becomes the lease the check expects", () =>
{
    expect(leaseFrom(filled, context)).toEqual({
        flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
        surface: 4000,
        signedOn: "2025-08-20",
        startsOn: "2025-09-01",
        rent: 150000,
        complement: 0,
        on: "2026-09-29",
    });
});

test("every missing answer is named at once, and the complement may stay empty", () =>
{
    const empty = Object.fromEntries(Object.keys(filled).map((key) => [key, ""])) as unknown as LeaseFields;
    const result = leaseFrom(empty, context);

    expect(result).toMatchObject({ kind: "unanswered" });
    expect(Object.keys("fields" in result ? result.fields : {}).sort()).toEqual(
        ["furnished", "period", "rent", "rooms", "signedOn", "startsOn", "surface"],
    );
});

test("an ambiguous amount is asked again rather than guessed", () =>
{
    expect(leaseFrom({ ...filled, rent: "1.500" }, context)).toMatchObject({ kind: "unanswered", fields: { rent: expect.any(String) } });
});

test("a zero surface or rent is not a lease", () =>
{
    expect(leaseFrom({ ...filled, surface: "0" }, context)).toMatchObject({ fields: { surface: expect.any(String) } });
    expect(leaseFrom({ ...filled, rent: "0" }, context)).toMatchObject({ fields: { rent: expect.any(String) } });
});

test("a complement is read when one is given", () =>
{
    expect(leaseFrom({ ...filled, complement: "200" }, context)).toMatchObject({ complement: 20000 });
    expect(leaseFrom({ ...filled, complement: "   " }, context)).toMatchObject({ complement: 0 });
    expect(leaseFrom({ ...filled, complement: "deux cents" }, context)).toMatchObject({ fields: { complement: expect.any(String) } });
});

test("a choice outside the offered lists is refused", () =>
{
    expect(leaseFrom({ ...filled, rooms: "5" }, context)).toMatchObject({ fields: { rooms: expect.any(String) } });
    expect(leaseFrom({ ...filled, period: "1900" }, context)).toMatchObject({ fields: { period: expect.any(String) } });
    expect(leaseFrom({ ...filled, period: "constructor" }, context)).toMatchObject({ fields: { period: expect.any(String) } });
    expect(leaseFrom({ ...filled, rooms: "toString" }, context)).toMatchObject({ fields: { rooms: expect.any(String) } });
    expect(leaseFrom({ ...filled, furnished: "maybe" }, context)).toMatchObject({ fields: { furnished: expect.any(String) } });
    expect(leaseFrom({ ...filled, signedOn: "01/09/2025" }, context)).toMatchObject({ fields: { signedOn: expect.any(String) } });
});
