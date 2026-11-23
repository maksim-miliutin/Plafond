import type { City, Decree, Dwelling, Period, Rate, Rooms } from "@plafond/domain";

import { readRows } from "./csv.js";

export class TerritoryError extends Error
{
    constructor(problem: string)
    {
        super(`territory: ${problem}`);
        this.name = "TerritoryError";
    }
}

// One row per published rent of the decrees for Est Ensemble and Plaine Commune, copied from their annexes 2 to 4:
// the territory, the decree's year and dates, the category, the three rents in euros a m², and the PDF page it is on.
const columns = [
    "territoire", "millesime", "from", "until_exclusive", "secteur", "type_logement", "pieces_min", "epoque_construction", "meuble",
    "loyer_minore_eur_m2", "loyer_reference_eur_m2", "loyer_majore_eur_m2", "source_pdf", "annexe", "page_pdf",
] as const;

type Column = typeof columns[number];

// From 2024 the decrees print one grid, "toute typologie confondue", for some sectors: it prices houses and flats alike.
const dwellings: Readonly<Record<string, readonly Dwelling[]>> = { appartement: ["flat"], maison: ["house"], tous: ["flat", "house"] };
const rooms: Readonly<Record<string, Rooms>> = { "1": 1, "2": 2, "3": 3, "4": 4 };
const periods: Readonly<Record<string, Period>> = { "avant-1946": "before-1946", "1946-1970": "1946-1970", "1971-1990": "1971-1990", "apres-1990": "after-1990" };
const lettings: Readonly<Record<string, boolean>> = { false: false, true: true };

// Every sector of every decree prices two dwellings, four sizes, four periods and two lettings.
const categories = 2 * 4 * 4 * 2;

export function territoryRates(table: string, city: City, decrees: ReadonlyMap<number, Decree>): Rate[]
{
    const [names = [], ...lines] = readRows(table.trimEnd() + "\n", ",").filter((line) => line.some((field) => field !== ""));
    if (names.join(",") !== columns.join(","))
    {
        throw new TerritoryError(`the first line is not ${columns.join(",")}`);
    }

    const seen = new Set<string>();
    const rates = lines.flatMap((line, index): Rate[] =>
    {
        const where = `line ${index + 2}`;
        const at = (name: Column) => line[columns.indexOf(name)] ?? "";
        if (line.length !== columns.length)
        {
            throw new TerritoryError(`${where} has ${line.length} fields, not ${columns.length}`);
        }

        if (at("territoire") !== city)
        {
            return [];
        }

        const decree = decrees.get(Number(at("millesime")));
        if (decree === undefined)
        {
            throw new TerritoryError(`${where}: no decree of ${city} for ${at("millesime")}`);
        }

        if (at("from") !== decree.from || at("until_exclusive") !== decree.until)
        {
            throw new TerritoryError(`${where}: the rents run from ${at("from")} to ${at("until_exclusive")}, not as ${decree.title}`);
        }

        const sector = Number(at("secteur"));
        const kinds = dwellings[at("type_logement")];
        const size = rooms[at("pieces_min")];
        const period = periods[at("epoque_construction")];
        const furnished = lettings[at("meuble")];
        if (!Number.isInteger(sector) || kinds === undefined || size === undefined || period === undefined || furnished === undefined)
        {
            throw new TerritoryError(`${where} is not a sector, a dwelling, a number of rooms, a period and a letting`);
        }

        const rents = rentsOf(at("loyer_reference_eur_m2"), at("loyer_majore_eur_m2"), at("loyer_minore_eur_m2"), where);

        return kinds.map((dwelling) =>
        {
            const key = `${decree.from} ${sector} ${dwelling} ${size} ${period} ${furnished}`;
            if (seen.has(key))
            {
                throw new TerritoryError(`${where} prices ${key} a second time`);
            }

            seen.add(key);

            return { flat: { city, quartier: sector, rooms: size, period, furnished, dwelling }, ...rents, decree };
        });
    });

    const counts = new Map<string, number>();
    for (const rate of rates)
    {
        const sector = `${rate.decree.title}, sector ${rate.flat.quartier}`;
        counts.set(sector, (counts.get(sector) ?? 0) + 1);
    }

    const partial = [...counts].find(([, count]) => count !== categories);
    if (partial !== undefined)
    {
        throw new TerritoryError(`${partial[0]} is priced in ${partial[1]} categories, not ${categories}`);
    }

    const unpriced = [...decrees.values()].find((decree) => !rates.some((rate) => rate.decree === decree));
    if (unpriced !== undefined)
    {
        throw new TerritoryError(`${unpriced.title} prices no rent of ${city}`);
    }

    return rates;
}

// The decrees set the majored rent 20 percent above the reference and the reduced one 30 percent below, printed to the
// tenth and rounded half up: a reference of 12,5 € gives a reduced rent of 8,8 €.
function rentsOf(reference: string, majored: string, minored: string, where: string): Pick<Rate, "reference" | "majored" | "minored">
{
    const [ref, high, low] = [reference, majored, minored].map((price) =>
    {
        if (!/^\d+(\.\d)?$/.test(price))
        {
            throw new TerritoryError(`${where}: ${price} is not a rent in euros and tenths`);
        }

        return Math.round(Number(price) * 10);
    }) as [number, number, number];

    if (Math.abs(high * 100 - ref * 120) > 50 || Math.abs(low * 100 - ref * 70) > 50)
    {
        throw new TerritoryError(`${where}: the majored and reduced rents are not the reference plus 20 and minus 30 percent`);
    }

    return { reference: ref * 10, majored: high * 10, minored: low * 10 };
}
