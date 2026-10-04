import { expect, test } from "vitest";

import { decency, increase, type Dpe, type Tenancy } from "../src/dpe.js";

// Dates counted by hand from the loi Climat et résilience: the freeze starts on 24 August 2022 and binds a lease
// only once it is signed, renewed or tacitly renewed after that day; an empty flat renews every 3 years, a furnished one every year.
const g: Dpe = { number: "2275E0000001A", label: "G", establishedOn: "2022-01-15", validUntil: "2032-01-14" };
const e: Dpe = { ...g, label: "E" };

const empty = (signedOn: string): Tenancy => ({ signedOn, furnished: false, company: false, on: "2026-10-03" });
const company = (signedOn: string): Tenancy => ({ signedOn, furnished: false, company: true, on: "2026-10-03" });
const furnished = (signedOn: string): Tenancy => ({ signedOn, furnished: true, company: false, on: "2026-10-03" });

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

// From the same law: a G flat stops being decent in a lease signed or renewed from 1 January 2025, F from 2028, E from 2034.
test("a G flat is not decent once its lease was signed or renewed in 2025 or later", () =>
{
    expect(decency(g, empty("2025-02-01"))).toEqual({ kind: "not-decent", since: "2025-02-01" });
    expect(decency(g, empty("2023-03-01"))).toEqual({ kind: "not-decent", since: "2026-03-01" });
    expect(decency(g, furnished("2024-06-01"))).toEqual({ kind: "not-decent", since: "2025-06-01" });
});

test("a lease not yet renewed under the rule learns the day the rule will reach it", () =>
{
    expect(decency(g, empty("2024-06-01"))).toEqual({ kind: "from", on: "2027-06-01" });
    expect(decency({ ...g, label: "F" }, empty("2023-03-01"))).toEqual({ kind: "from", on: "2029-03-01" });
    expect(decency(e, furnished("2024-05-10"))).toEqual({ kind: "from", on: "2034-05-10" });
});

test("a flat rated A to D meets the energy rule of decency", () =>
{
    expect(decency({ ...g, label: "D" }, empty("2023-03-01"))).toEqual({ kind: "decent" });
});

test("a lease signed or renewed on the very day the rule starts falls under it", () =>
{
    expect(decency(g, empty("2025-01-01"))).toEqual({ kind: "not-decent", since: "2025-01-01" });
    expect(decency(g, empty("2022-01-01"))).toEqual({ kind: "not-decent", since: "2025-01-01" });
    expect(decency({ ...g, label: "F" }, empty("2025-01-01"))).toEqual({ kind: "from", on: "2028-01-01" });
});

// Loi du 6 juillet 1989, article 10: an empty flat let by a company runs for 6 years, not 3, and renews for 6.
test("a lease from a company renews every 6 years, so both rules reach it later", () =>
{
    expect(increase(g, company("2021-01-01"), "2024-01-01")).toEqual({ kind: "allowed", reason: "term-before-freeze" });
    expect(increase(g, company("2021-01-01"), "2027-01-01")).toEqual({ kind: "forbidden", since: "2027-01-01" });
    expect(decency(g, company("2023-03-01"))).toEqual({ kind: "from", on: "2029-03-01" });
});

