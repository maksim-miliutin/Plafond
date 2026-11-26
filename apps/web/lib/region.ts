import type { MetropoleCommune, RegionalCommune } from "@plafond/import";

import { searchKey } from "./metropole";

// A commune of Île-de-France as the search and the forms need it, with the names of communes merged into it.
export interface RegionCommune extends RegionalCommune
{
    former: string[];
}

export const departmentNames: Record<string, string> = {
    "75": "Paris",
    "77": "Seine-et-Marne",
    "78": "Yvelines",
    "91": "Essonne",
    "92": "Hauts-de-Seine",
    "93": "Seine-Saint-Denis",
    "94": "Val-de-Marne",
    "95": "Val-d'Oise",
};

// The 1 266 communes go to the browser as one line each, a fraction of the same list as objects:
// code;name;part;zone ABC;A bis before;Grand Paris;former names joined by |.
export function packRegion(communes: readonly RegionalCommune[], metropole: readonly MetropoleCommune[]): string
{
    const former = new Map(metropole.map((commune) => [commune.code, commune.former]));

    return communes
        .map((commune) => [
            commune.code,
            commune.name,
            commune.tensePart,
            commune.abcZone,
            commune.veryTenseBefore ? 1 : 0,
            commune.grandParis ? 1 : 0,
            (former.get(commune.code) ?? []).join("|"),
        ].join(";"))
        .join("\n");
}

export function unpackRegion(text: string): RegionCommune[]
{
    return text.split("\n").filter((line) => line !== "").map((line) =>
    {
        const [code = "", name = "", part = "0", zone = "C", before = "0", grandParis = "0", former = ""] = line.split(";");

        return {
            code,
            name,
            department: code.slice(0, 2),
            tensePart: Number(part) as RegionalCommune["tensePart"],
            abcZone: zone as RegionalCommune["abcZone"],
            veryTenseBefore: before === "1",
            grandParis: grandParis === "1",
            former: former === "" ? [] : former.split("|"),
        };
    });
}

export const labelOf = (commune: RegionCommune) => `${commune.name} (${commune.department})`;

// Names are compared as the Grand Paris search compares them; digits find the INSEE codes that start with them, so "91"
// lists the Essonne. Whole names come first, then names that start with what was typed.
export function regionMatching(communes: readonly RegionCommune[], typed: string): RegionCommune[]
{
    const digits = typed.replace(/\s/g, "");
    if (/^\d[\dAB]*$/.test(digits))
    {
        return communes.filter((commune) => commune.code.startsWith(digits));
    }

    const key = searchKey(typed);
    if (key === "")
    {
        return [];
    }

    const rank = (commune: RegionCommune) =>
    {
        const keys = [commune.name, ...commune.former].map(searchKey);
        return keys.includes(key) ? 0 : keys.some((one) => one.startsWith(key)) ? 1 : keys.some((one) => one.includes(key)) ? 2 : 3;
    };

    return communes
        .map((commune) => ({ commune, rank: rank(commune) }))
        .filter((found) => found.rank < 3)
        .sort((a, b) => a.rank - b.rank || a.commune.name.localeCompare(b.commune.name, "fr"))
        .map((found) => found.commune);
}

// What each rule reads in the commune, by the latest lists: the notice and the reletting rent read part 1 of the list,
// agency fees either part and zone A bis.
export function zoneLineOf(commune: RegionCommune): string
{
    const fees = commune.abcZone === "Abis" ? "frais d'agence de zone très tendue" : commune.tensePart === 0 ? "frais d'agence hors zone tendue" : "frais d'agence de zone tendue";

    return commune.tensePart === 1
        ? `Zone tendue, ${fees}.`
        : `Hors zone tendue pour le préavis et la relocation, ${fees}.`;
}
