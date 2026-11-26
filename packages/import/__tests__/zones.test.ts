/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { zoneListsOf } from "../src/zones.js";

import lists from "../../../db/seed/zone-lists.json?raw";

// The TLV list as décret n° 2025-1267 set it took effect on 24 December 2025; zone A bis as the arrêté of 23 June 2026 set it, on 26 June.
test("each list carries the day its version took effect and its source", () =>
{
    const read = zoneListsOf(JSON.parse(lists));

    expect([read.tense.from, read.veryTense.from]).toEqual(["2025-12-24", "2026-06-26"]);
    expect([read.earlierVeryTense.from, read.earlierVeryTense.until]).toEqual(["2025-09-07", "2026-06-26"]);
    expect(() => zoneListsOf({ ...read, earlierVeryTense: { ...read.earlierVeryTense, until: "2026-06-25" } })).toThrow("does not end the day");
    expect(read.tense.url).toMatch(/^https:\/\/www\.legifrance\.gouv\.fr\//);
    expect(() => zoneListsOf({ tense: read.tense })).toThrow("the veryTense list has no day it took effect");
    expect(() => zoneListsOf({ ...read, tense: { ...read.tense, from: "24/12/2025" } })).toThrow("the tense list has no day it took effect");
});
