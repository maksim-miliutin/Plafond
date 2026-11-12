import { expect, test } from "vitest";

import seed from "../../../db/seed/irl.json" with { type: "json" };
import { IndexError, indexOf } from "../src/irl.js";

function row(year: number, quarter: number, value: number, change: number, publishedOn: string): Record<string, unknown>
{
    return { year, quarter, value, change, publishedOn };
}

const source = "https://example.org/irl";

test("each row becomes a quarter of the index, in order, with the day it was published", () =>
{
    const read = indexOf({ source, rows: [row(2025, 2, 14668, 104, "2025-07-11"), row(2025, 1, 14547, 140, "2025-04-15")] });

    expect(read.source).toBe(source);
    expect(read.rows).toEqual([
        { year: 2025, quarter: 1, value: 14547, publishedOn: "2025-04-15" },
        { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    ]);
});

// A value typed wrong by one digit still looks like an index; the change INSEE published beside it does not agree with it.
test("a value that disagrees with the yearly change published beside it is refused", () =>
{
    const year = [row(2024, 2, 14517, 326, "2024-07-12"), row(2024, 3, 14451, 247, "2024-10-15"), row(2024, 4, 14464, 182, "2025-01-15"), row(2025, 1, 14547, 140, "2025-04-15")];

    expect(() => indexOf({ source, rows: [...year, row(2025, 2, 14668, 104, "2025-07-11")] })).not.toThrow();
    expect(() => indexOf({ source, rows: [...year, row(2025, 2, 14686, 104, "2025-07-11")] })).toThrow(IndexError);
});

test("a missing quarter, a quarter twice, or a quarter published before the one it follows is refused", () =>
{
    expect(() => indexOf({ source, rows: [row(2025, 1, 14547, 140, "2025-04-15"), row(2025, 3, 14577, 87, "2025-10-15")] })).toThrow(/^index: /);
    expect(() => indexOf({ source, rows: [row(2025, 1, 14547, 140, "2025-04-15"), row(2025, 1, 14547, 140, "2025-04-15")] })).toThrow(IndexError);
    expect(() => indexOf({ source, rows: [row(2025, 1, 14547, 140, "2025-07-15"), row(2025, 2, 14668, 104, "2025-07-11")] })).toThrow(IndexError);
});

test("a row that is not a quarter, a value in decimals, a plain link or an empty table is refused", () =>
{
    expect(() => indexOf({ source, rows: [row(2025, 5, 14547, 140, "2025-04-15")] })).toThrow(IndexError);
    expect(() => indexOf({ source, rows: [row(2025, 1, 145.47, 140, "2025-04-15")] })).toThrow(IndexError);
    expect(() => indexOf({ source, rows: [row(2025, 1, 14547, 140, "15.4.25")] })).toThrow(IndexError);
    expect(() => indexOf({ source: "http://example.org", rows: [row(2025, 1, 14547, 140, "2025-04-15")] })).toThrow(IndexError);
    expect(() => indexOf({ source, rows: [] })).toThrow(IndexError);
});

// ANIL's table of the IRL, mainland France, from the first quarter of 2017; the third of 2026, published by INSEE on
// 15 October 2026 at 148,06, read in INSEE's release and in ANIL's table on 9 November 2026.
test("the seed holds every quarter from 2017 to the third of 2026, each agreeing with its published change", () =>
{
    const read = indexOf(seed);

    expect(read.rows).toHaveLength(39);
    expect(read.rows[0]).toEqual({ year: 2017, quarter: 1, value: 12590, publishedOn: "2017-04-13" });
    expect(read.rows.at(-1)).toEqual({ year: 2026, quarter: 3, value: 14806, publishedOn: "2026-10-15" });
});
