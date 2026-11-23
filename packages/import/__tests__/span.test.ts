/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { check, checkedSpans, quartierAt } from "@plafond/domain";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };
import { lyonSectors } from "../src/annex.js";
import { lawOf } from "../src/law.js";
import { seedsFrom } from "../src/seed.js";

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;

function read(name: string): string
{
    const text = files[`../../../db/seed/${name}`];
    if (text === undefined)
    {
        throw new Error(`no seed file is called ${name}`);
    }

    return text;
}

// The Lyon page once promised leases from 1 November 2021, though no table of the 2021 or the 2023 decree was loaded.
test("the seeds the site reads date the leases Plafond can check, gaps included", () =>
{
    const { paris, lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);

    expect(checkedSpans("paris", paris, law)).toEqual([{ from: "2019-07-01", lastDay: "2026-11-24" }]);
    expect(checkedSpans("lyon", lyon.rates, law)).toEqual([{ from: "2021-11-01", lastDay: "2026-11-23" }]);
});

test("a lease signed under the annulled decree of 2023 is priced, and carries the annulment for the screen to show", () =>
{
    const { lyon } = seedsFrom(read);
    const flat = { city: "lyon" as const, quartier: lyon.outlines[0]!.number, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const claim = { flat, surface: 2500, signedOn: "2024-02-01", startsOn: "2024-02-01", rent: 60000, complement: 0, on: "2026-11-13" };

    expect(check(claim, lyon.rates, lawOf(lawSeed))).toMatchObject({ kind: "checked", rate: { decree: { from: "2023-11-01", contest: { outcome: "annulled" } } } });
});

// Article 3 of each Lyon decree sets these edges. The 2026 decree stops on 23 November 2026, while the law of
// 21 November 2026 runs the control on to 24 November 2028: between the two a lease finds no rate, not a lapsed law.
test("a Lyon lease is priced by the decree in force on the day it was signed, edge days included", () =>
{
    const { lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const flat = { city: "lyon" as const, quartier: lyon.outlines[0]!.number, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const signed = (day: string) =>
    {
        const result = check({ flat, surface: 2500, signedOn: day, startsOn: day, rent: 60000, complement: 0, on: "2026-11-13" }, lyon.rates, law);
        if (result.kind === "checked")
        {
            return `decree from ${result.rate.decree.from}`;
        }

        return result.kind === "no-rate" ? `no rate, ${result.side}` : result.kind;
    };

    expect(signed("2021-10-31")).toBe("no rate, before");
    expect(signed("2021-11-01")).toBe("decree from 2021-11-01");
    expect(signed("2022-10-31")).toBe("decree from 2021-11-01");
    expect(signed("2022-11-01")).toBe("decree from 2022-11-01");
    expect(signed("2026-10-31")).toBe("decree from 2025-11-01");
    expect(signed("2026-11-01")).toBe("decree from 2026-11-01");
    expect(signed("2026-11-23")).toBe("decree from 2026-11-01");
    expect(signed("2026-11-24")).toBe("no rate, after");
    expect(signed("2026-11-25")).toBe("no rate, after");
    expect(signed("2028-11-24")).toBe("no rate, after");
    expect(signed("2028-11-25")).toBe("lapsed");
});

// The bug this guards: the law of 21 November 2026 extended the control to 24 November 2028, yet a Paris lease signed
// on 25 November 2026 was still told that no published text extends it. The 2026 decree itself stops on 24 November.
test("a Paris lease signed after the 2026 decree finds no rate under the extended law, and lapses only after 24 November 2028", () =>
{
    const { paris } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const flat = paris.find((rate) => rate.decree.from === "2026-07-01")!.flat;
    const signed = (day: string) =>
    {
        const result = check({ flat, surface: 2500, signedOn: day, startsOn: day, rent: 60000, complement: 0, on: "2026-11-22" }, paris, law);
        if (result.kind === "checked")
        {
            return `decree from ${result.rate.decree.from}`;
        }

        return result.kind === "no-rate" ? `no rate, ${result.side}` : result.kind;
    };

    expect(signed("2026-06-30")).toBe("decree from 2025-07-01");
    expect(signed("2026-07-01")).toBe("decree from 2026-07-01");
    expect(signed("2026-11-24")).toBe("decree from 2026-07-01");
    expect(signed("2026-11-25")).toBe("no rate, after");
    expect(signed("2028-11-24")).toBe("no rate, after");
    expect(signed("2028-11-25")).toBe("lapsed");
});

// One point per zone, more than 200 m inside its IRIS on the outlines of the Métropole's 2025-2026 file. The rents are read
// off that file (decree of 2025) and annex 1 of the decree of 23 October 2026, for one room built before 1946; each cap is
// that rent times 25 m², worked by hand: zone 1 in 2025, 21,00 € and 23,80 € a m², gives 525,00 € and 595,00 €.
const studios = [
    { zone: 1, iris: 693820402, at: { lon: 4.830673, lat: 45.750821 }, caps: { "2026-06-15": [52500, 59500], "2026-11-15": [54000, 61000] } },
    { zone: 2, iris: 693830301, at: { lon: 4.85592, lat: 45.760847 }, caps: { "2026-06-15": [52750, 59750], "2026-11-15": [53500, 60250] } },
    { zone: 3, iris: 693870701, at: { lon: 4.842595, lat: 45.72917 }, caps: { "2026-06-15": [51250, 58000], "2026-11-15": [50500, 57000] } },
    { zone: 4, iris: 693890302, at: { lon: 4.799114, lat: 45.777575 }, caps: { "2026-06-15": [48000, 54250], "2026-11-15": [50000, 56750] } },
    { zone: 5, iris: 692660201, at: { lon: 4.877211, lat: 45.787508 }, caps: { "2026-06-15": [47750, 54000], "2026-11-15": [50750, 57250] } },
];

test("a studio placed in each Lyon zone is capped at that zone's rents of 2025 and 2026, empty and furnished", () =>
{
    const { lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);

    for (const studio of studios)
    {
        expect(quartierAt(studio.at, lyon.outlines), `zone ${studio.zone}`).toEqual({ kind: "found", quartier: studio.iris });
        expect(lyon.zoning.get(studio.iris), `zone ${studio.zone}`).toBe(studio.zone);
        for (const [day, [empty, furnished]] of Object.entries(studio.caps))
        {
            for (const [isFurnished, cap] of [[false, empty], [true, furnished]] as const)
            {
                const flat = { city: "lyon" as const, quartier: studio.iris, rooms: 1 as const, period: "before-1946" as const, furnished: isFurnished };
                const claim = { flat, surface: 2500, signedOn: day, startsOn: day, rent: 100000, complement: 0, on: "2026-11-22" };

                expect(check(claim, lyon.rates, law), `zone ${studio.zone}, ${day}, furnished ${isFurnished}`).toMatchObject({ kind: "checked", cap });
            }
        }
    }
});

// The Métropole's press kit of 27 October 2021 works two cases through the decree of 2021: a studio of 15 m² built before
// 1946 in Lyon 1er capped at 307,50 €, which is the furnished majored rent of zone 1 (the empty one would give 289,50 €),
// and an empty three-room flat built 1971-1990 in zone 3 of Villeurbanne, between 7,10 € and 12,20 € a m².
// https://www.grandlyon.com/fileadmin/user_upload/media/pdf/espace-presse/dp/2021/20211027_dp_encadrement-loyers.pdf
test("the rents copied from the scanned 2021 decree agree with the two cases the Métropole worked in October 2021", () =>
{
    const { lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const signed = (quartier: number, rooms: 1 | 3, period: "before-1946" | "1971-1990", furnished: boolean, surface: number) =>
        check({ flat: { city: "lyon", quartier, rooms, period, furnished }, surface, signedOn: "2021-11-15", startsOn: "2021-11-15", rent: 100000, complement: 0, on: "2026-11-22" }, lyon.rates, law);

    expect(signed(693810101, 1, "before-1946", true, 1500)).toMatchObject({ kind: "checked", cap: 30750 });
    expect(signed(692660101, 3, "1971-1990", false, 6000)).toMatchObject({ kind: "checked", rate: { majored: 1220, minored: 710 } });
});

// A second reader, shown only the decrees' maps and their legends and not these files, placed twelve IRIS: five on the
// map of the decree of 23 October 2026, seven on the map of the 2021 decree.
const readBlind = [
    { year: 2026, iris: 693820504, sector: 3 },
    { year: 2026, iris: 692661101, sector: 3 },
    { year: 2026, iris: 693890605, sector: 5 },
    { year: 2026, iris: 693820501, sector: 3 },
    { year: 2026, iris: 692661401, sector: 5 },
    { year: 2021, iris: 693810302, sector: 1 },
    { year: 2021, iris: 693810304, sector: 1 },
    { year: 2021, iris: 693880503, sector: 3 },
    { year: 2021, iris: 692661802, sector: 4 },
    { year: 2021, iris: 693880301, sector: 2 },
    { year: 2021, iris: 693880203, sector: 3 },
    { year: 2021, iris: 693880404, sector: 3 },
];

test("the twelve IRIS read blind off the decrees' maps lie in the sectors the seeds give them", () =>
{
    const sectors = new Map([2021, 2026].map((year) => [year, lyonSectors(read(`lyon-sectors-${year}.csv`))]));

    for (const { year, iris, sector } of readBlind)
    {
        expect(sectors.get(year)!.get(iris), `${year}, IRIS ${iris}`).toBe(sector);
    }
});

// Lyon and Villeurbanne share one decree, so both stop on its last day, 23 November 2026.
test("a Villeurbanne lease finds the 2026 decree on 23 November 2026 and no rate from the day after", () =>
{
    const { lyon } = seedsFrom(read);
    const law = lawOf(lawSeed);
    const flat = { city: "lyon" as const, quartier: 692660201, rooms: 1 as const, period: "before-1946" as const, furnished: false };
    const signed = (day: string) => check({ flat, surface: 2500, signedOn: day, startsOn: day, rent: 60000, complement: 0, on: "2026-11-22" }, lyon.rates, law);

    expect(signed("2026-11-23")).toMatchObject({ kind: "checked", rate: { decree: { title: "Arrêté préfectoral n° DDT 69-2026-10-23-00004" } } });
    expect(signed("2026-11-24")).toMatchObject({ kind: "no-rate", side: "after", until: "2026-11-23" });
    expect(signed("2026-11-25")).toMatchObject({ kind: "no-rate", side: "after", until: "2026-11-23" });
});
