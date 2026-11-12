import { expect, test } from "vitest";

import { checkedSpan } from "@plafond/domain";

import lyonSeed from "../../../db/seed/lyon-decrees.json" with { type: "json" };
import parisSeed from "../../../db/seed/paris-decrees.json" with { type: "json" };
import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { decreesOf } from "../src/decrees.js";
import { lawOf } from "../src/law.js";

// The Paris arrêté IDF-2026-06-12-00003 and the law both end on 24 November 2026; the 2025 Rhône decree ends on 31 October 2026.
test("the seeds date the leases Plafond can check", () =>
{
    const law = lawOf(lawSeed);

    expect(checkedSpan("paris", [...decreesOf(parisSeed).values()], law)).toEqual({ from: "2019-07-01", lastDay: "2026-11-24" });
    expect(checkedSpan("lyon", [...decreesOf(lyonSeed).values()], law)).toEqual({ from: "2021-11-01", lastDay: "2026-10-31" });
});
