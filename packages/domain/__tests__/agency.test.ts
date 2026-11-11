import { expect, test } from "vitest";

import { AgencyError, agencyFees, type AgencyFees, type FeeCaps } from "../src/agency.js";

// Décret n° 2014-890: 12, 10, 8 € a m² for visits, file and lease, 3 € for the inspection. From 1 January 2026 the arrêté of
// 17 July 2025, as amended, raises them by the rent index (+0,87 %): 12,10, 10,09, 8,07 and 3,03 €, read in two trade papers.
const caps: FeeCaps[] = [
    {
        from: "2014-09-15",
        until: "2026-01-01",
        letting: { "very-tense": 1200, tense: 1000, other: 800 },
        inspection: 300,
        title: "Décret n° 2014-890 du 1er août 2014",
        url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000029337625/",
    },
    {
        from: "2026-01-01",
        until: "2027-01-01",
        letting: { "very-tense": 1210, tense: 1009, other: 807 },
        inspection: 303,
        title: "Arrêté du 17 juillet 2025",
        url: "https://www.legifrance.gouv.fr/loda/id/JORFTEXT000051949607/",
    },
];

const paid: AgencyFees = { zone: "very-tense", surface: 4250, letting: 80000, inspection: 15000, signedOn: "2025-09-01" };

test("fees above the caps of the zone are split into what was allowed and what was charged too much", () =>
{
    expect(agencyFees(paid, caps)).toMatchObject({
        kind: "fees",
        lettingCap: 51000,
        inspectionCap: 12750,
        lettingExcess: 29000,
        inspectionExcess: 2250,
        excess: 31250,
    });
});

test("a lease signed from 1 January 2026 is held to the raised caps, rounded half up", () =>
{
    expect(agencyFees({ ...paid, signedOn: "2026-03-01" }, caps)).toMatchObject({
        caps: { title: "Arrêté du 17 juillet 2025" },
        lettingCap: 51425,
        inspectionCap: 12878,
        excess: 30697,
    });
});

test("each zone has its own cap for the letting, and one cap for the inspection everywhere", () =>
{
    const tense = agencyFees({ ...paid, zone: "tense", surface: 3000, letting: 30000, inspection: 9000 }, caps);
    const elsewhere = agencyFees({ ...paid, zone: "other", surface: 5555, letting: 50000, inspection: 0, signedOn: "2026-02-01" }, caps);

    expect(tense).toMatchObject({ lettingCap: 30000, inspectionCap: 9000, excess: 0 });
    expect(elsewhere).toMatchObject({ lettingCap: 44829, lettingExcess: 5171, inspectionExcess: 0, excess: 5171 });
});

test("a tenant who does not know the zone is held to the highest cap, and the check says so", () =>
{
    expect(agencyFees({ ...paid, zone: null }, caps)).toMatchObject({ zone: "very-tense", assumed: true, lettingCap: 51000 });
    expect(agencyFees({ ...paid, zone: "tense" }, caps)).toMatchObject({ zone: "tense", assumed: false, lettingCap: 42500 });
});

test("fees under the caps leave nothing to claim, never a negative sum", () =>
{
    expect(agencyFees({ ...paid, letting: 20000, inspection: 5000 }, caps)).toMatchObject({ lettingExcess: 0, inspectionExcess: 0, excess: 0 });
});

// Loi ALUR: the caps hold for leases signed from 15 September 2014; before it, nothing capped a tenant's share.
test("a lease signed before the first caps, or after the last caps known, has none to check against", () =>
{
    expect(agencyFees({ ...paid, signedOn: "2014-09-14" }, caps)).toEqual({ kind: "no-caps", side: "before", from: "2014-09-15" });
    expect(agencyFees({ ...paid, signedOn: "2014-09-15" }, caps)).toMatchObject({ kind: "fees" });
    expect(agencyFees({ ...paid, signedOn: "2026-12-31" }, caps)).toMatchObject({ kind: "fees" });
    expect(agencyFees({ ...paid, signedOn: "2027-01-01" }, caps)).toEqual({ kind: "no-caps", side: "after", until: "2027-01-01" });
});

test("the rows may come in any order", () =>
{
    const reversed = [...caps].reverse();

    expect(agencyFees({ ...paid, signedOn: "2014-09-14" }, reversed)).toMatchObject({ side: "before", from: "2014-09-15" });
    expect(agencyFees({ ...paid, signedOn: "2027-01-01" }, reversed)).toMatchObject({ side: "after", until: "2027-01-01" });
});

test("a table with a hole between two rows is a breakage, not an answer", () =>
{
    const holed = [caps[0]!, { ...caps[1]!, from: "2026-02-01" }];

    expect(() => agencyFees({ ...paid, signedOn: "2026-01-15" }, holed)).toThrow(AgencyError);
    expect(() => agencyFees(paid, [])).toThrow(/^agency: /);
});
