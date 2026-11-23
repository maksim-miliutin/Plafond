import { readRows } from "./csv.js";

// The territories inside the Métropole du Grand Paris whose rents a decree caps under article 140 of loi n° 2018-1021.
export type Territory = "paris" | "est-ensemble" | "plaine-commune";

export interface MetropoleCommune
{
    code: string;  // INSEE code, kept as text as the geocoder returns it
    name: string;
    territory: Territory | null;  // null where no decree caps the rents
    former: string[];  // communes merged into it that tenants still name, as Pierrefitte-sur-Seine into Saint-Denis in 2025
}

export class MetropoleError extends Error
{
    constructor(problem: string)
    {
        super(`metropole: ${problem}`);
        this.name = "MetropoleError";
    }
}

const territories: readonly Territory[] = ["paris", "est-ensemble", "plaine-commune"];
const header = "code;name;territory;former";

// Paris counts as one commune here: its arrondissements have codes of their own, which the geocoder gives instead.
const arrondissement = /^751\d\d$/;

export function metropoleOf(text: string): MetropoleCommune[]
{
    const [names, ...rows] = readRows(text.trimEnd() + "\n").filter((row) => row.some((field) => field !== ""));
    if (names?.join(";") !== header)
    {
        throw new MetropoleError(`the first line is not ${header}`);
    }

    const seen = new Set<string>();

    return rows.map((row, index) =>
    {
        const [code = "", name = "", territory = "", former = ""] = row;
        const where = `line ${index + 2}`;
        if (row.length !== 4 || !/^\d{5}$/.test(code) || arrondissement.test(code) || name.trim() === "")
        {
            throw new MetropoleError(`${where} is not a commune's five-digit code, its name, its territory and its former communes`);
        }

        if (seen.has(code))
        {
            throw new MetropoleError(`${where} gives ${code} a second time`);
        }

        seen.add(code);

        const capped = territories.find((known) => known === territory);
        if (territory !== "" && capped === undefined)
        {
            throw new MetropoleError(`${where}: "${territory}" is not a territory whose rents are capped`);
        }

        return { code, name, territory: capped ?? null, former: former === "" ? [] : former.split("|") };
    });
}
