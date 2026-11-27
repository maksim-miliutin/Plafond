/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { zoneListsOf } from "../src/zones.js";

import lists from "../../../db/seed/zone-lists.json?raw";

// Décret n° 2026-831 replaces the former TLV list on 1 January 2027 with the same communes.
test("each list carries the day its version took effect and its source", () =>
{
    const read = zoneListsOf(JSON.parse(lists));

    expect([read.tense.from, read.veryTense.from]).toEqual(["2027-01-01", "2026-06-26"]);
    expect([read.earlierVeryTense.from, read.earlierVeryTense.until]).toEqual(["2025-09-07", "2026-06-26"]);
    expect(() => zoneListsOf({ ...read, earlierVeryTense: { ...read.earlierVeryTense, until: "2026-06-25" } })).toThrow("does not end the day");
    expect(read.tense.url).toMatch(/^https:\/\/www\.legifrance\.gouv\.fr\//);
    expect(() => zoneListsOf({ tense: read.tense })).toThrow("the veryTense list has no day it took effect");
    expect(() => zoneListsOf({ ...read, tense: { ...read.tense, from: "24/12/2025" } })).toThrow("the tense list has no day it took effect");
});
