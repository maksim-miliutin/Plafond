import { expect, test } from "vitest";

import { increase, type Dpe, type Tenancy } from "../src/dpe.js";

// Dates counted by hand from the loi Climat et résilience: the freeze starts on 24 August 2022 and binds a lease
// only once it is signed, renewed or tacitly renewed after that day; an empty flat renews every 3 years, a furnished one every year.
const g: Dpe = { number: "2275E0000001A", label: "G", establishedOn: "2022-01-15", validUntil: "2032-01-14" };
const e: Dpe = { ...g, label: "E" };

const empty = (signedOn: string): Tenancy => ({ signedOn, furnished: false, on: "2026-10-03" });
const furnished = (signedOn: string): Tenancy => ({ signedOn, furnished: true, on: "2026-10-03" });

test("a rise on an F or G flat is forbidden once the lease was signed after the freeze began", () =>
{
    expect(increase(g, empty("2022-08-24"), "2023-08-24")).toEqual({ kind: "forbidden", since: "2022-08-24" });
    expect(increase({ ...g, label: "F" }, empty("2023-03-01"), "2024-03-01")).toEqual({ kind: "forbidden", since: "2023-03-01" });
});

test("a lease signed before the freeze may still be indexed until it renews, and not after", () =>
{
    expect(increase(g, empty("2021-01-01"), "2023-01-01")).toEqual({ kind: "allowed", reason: "term-before-freeze" });
    expect(increase(g, empty("2021-01-01"), "2024-01-01")).toEqual({ kind: "forbidden", since: "2024-01-01" });
    expect(increase(g, empty("2021-01-01"), "2024-06-01")).toEqual({ kind: "forbidden", since: "2024-01-01" });
});

test("a furnished lease renews every year, so the freeze reaches it at its first anniversary", () =>
{
    expect(increase(g, furnished("2022-01-10"), "2022-10-01")).toEqual({ kind: "allowed", reason: "term-before-freeze" });
    expect(increase(g, furnished("2022-01-10"), "2023-02-01")).toEqual({ kind: "forbidden", since: "2023-01-10" });
});

test("a rise before the freeze, or on a flat rated A to E, is allowed", () =>
{
    expect(increase(g, empty("2022-08-24"), "2022-08-23")).toEqual({ kind: "allowed", reason: "before-freeze" });
    expect(increase(e, empty("2023-03-01"), "2024-03-01")).toEqual({ kind: "allowed", reason: "label" });
});

test("a diagnosis made after the rise says nothing of the rating the flat had then", () =>
{
    const later: Dpe = { ...g, establishedOn: "2025-02-01" };

    expect(increase(later, empty("2023-03-01"), "2024-03-01")).toEqual({ kind: "unknown", reason: "dpe-after-increase" });
});
