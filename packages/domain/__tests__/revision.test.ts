import { expect, test } from "vitest";

import { revision, type IndexRow, type Revision } from "../src/revision.js";

// The IRL for mainland France as ANIL's table publishes it, with the day INSEE published each quarter.
const index: IndexRow[] = [
    { year: 2023, quarter: 4, value: 14206, publishedOn: "2024-01-16" },
    { year: 2024, quarter: 2, value: 14517, publishedOn: "2024-07-12" },
    { year: 2024, quarter: 3, value: 14451, publishedOn: "2024-10-15" },
    { year: 2024, quarter: 4, value: 14464, publishedOn: "2025-01-15" },
    { year: 2025, quarter: 1, value: 14547, publishedOn: "2025-04-15" },
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2025, quarter: 3, value: 14577, publishedOn: "2025-10-15" },
    { year: 2025, quarter: 4, value: 14578, publishedOn: "2026-01-15" },
    { year: 2026, quarter: 1, value: 14660, publishedOn: "2026-04-15" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
];

// Service-public, « Augmentation et révision du loyer en cours de bail », vérifiée le 8 août 2025: a lease of 600 € signed on
// 20 July 2025 names no quarter, so it takes the last index then published, 146,68; on 20 July 2026, 600 × 148,37 / 146,68 = 606,91.
const lease: Revision = {
    clause: true,
    rent: 60000,
    asked: 60691,
    quarter: null,
    signedOn: "2025-07-20",
    revisedOn: "2026-07-20",
    askedOn: "2026-07-20",
};

test("service-public's own example comes out to the cent", () =>
{
    expect(revision(lease, index)).toMatchObject({
        kind: "revised",
        quarter: 2,
        assumed: true,
        from: { year: 2025, quarter: 2 },
        to: { year: 2026, quarter: 2 },
        allowed: 60691,
        excess: 0,
    });
});

test("a rent asked above the index is split into what was allowed and what is too much", () =>
{
    expect(revision({ ...lease, asked: 62000 }, index)).toMatchObject({ allowed: 60691, excess: 1309 });
    expect(revision({ ...lease, asked: 60000 }, index)).toMatchObject({ excess: 0 });
});

test("the quarter the lease names is used, with the index published at the revision date", () =>
{
    expect(revision({ ...lease, quarter: 3, rent: 95000, asked: 96000, revisedOn: "2026-07-20" }, index)).toMatchObject({
        quarter: 3,
        assumed: false,
        from: { year: 2024, quarter: 3 },
        to: { year: 2025, quarter: 3 },
        allowed: 95828,
        excess: 172,
    });
});

test("a revision dated before the new quarter is published still uses the year before, and on its day the new one", () =>
{
    expect(revision({ ...lease, quarter: 2, revisedOn: "2026-07-10", askedOn: "2026-07-10" }, index)).toMatchObject({ to: { year: 2026 } });
    expect(revision({ ...lease, quarter: 2, revisedOn: "2026-07-05", askedOn: "2026-07-05" }, index)).toMatchObject({
        to: { year: 2025, quarter: 2 },
        from: { year: 2024, quarter: 2 },
        allowed: 60624,
    });
});

// Same page: with a revision date of 13 March 2025 the landlord may ask until 12 March 2026; asked on 13 June 2025, the rise
// counts only from that day, never before.
test("a rise asked within the year counts from the day it was asked", () =>
{
    const late = revision({ ...lease, quarter: 4, rent: 120000, asked: 120946, revisedOn: "2026-03-13", askedOn: "2026-06-13" }, index);

    expect(late).toMatchObject({ kind: "revised", allowed: 120946, startsOn: "2026-06-13" });
    expect(revision({ ...lease, askedOn: "2026-07-01" }, index)).toMatchObject({ startsOn: "2026-07-20" });
});

test("a rise asked a year or more after the revision date is lost for that year", () =>
{
    expect(revision({ ...lease, quarter: 4, revisedOn: "2025-03-13", askedOn: "2026-03-12" }, index)).toMatchObject({ kind: "revised" });
    expect(revision({ ...lease, quarter: 4, revisedOn: "2025-03-13", askedOn: "2026-03-13", asked: 61000 }, index)).toEqual({
        kind: "lapsed",
        lastDay: "2026-03-12",
        allowed: 60000,
        excess: 1000,
    });
});

test("without a revision clause the rent stays as it is", () =>
{
    expect(revision({ ...lease, clause: false, asked: 61000 }, index)).toEqual({ kind: "no-clause", allowed: 60000, excess: 1000 });
});

test("a quarter the table does not hold gives no answer rather than a wrong one", () =>
{
    expect(revision({ ...lease, quarter: 2, revisedOn: "2024-09-01", askedOn: "2024-09-01" }, index)).toEqual({ kind: "no-index" });
    expect(revision({ ...lease, signedOn: "2024-01-01" }, index)).toEqual({ kind: "no-index" });
});

test("the tenant has three years from the revision date to take it to the judge", () =>
{
    expect(revision(lease, index)).toMatchObject({ contestBy: "2029-07-19" });
});
