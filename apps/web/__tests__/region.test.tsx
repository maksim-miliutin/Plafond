/// <reference types="vite/client" />
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { metropoleOf } from "@plafond/import";

import { IleDeFrance } from "../components/IleDeFrance";
import { departmentCounts, labelOf, packRegion, regionMatching, unpackRegion, zoneLineOf } from "../lib/region";
import { regionCommunes } from "./zone-seeds";

import list from "../../../db/seed/grand-paris-communes.csv?raw";

const metropole = metropoleOf(list);
const packed = packRegion(regionCommunes, metropole);
const region = unpackRegion(packed);
const find = (typed: string) => regionMatching(region, typed).map(labelOf);

test("the packed list comes back as it went, Saint-Denis with Pierrefitte, in a fraction of the size", () =>
{
    expect(region).toHaveLength(1266);
    expect(region.find((commune) => commune.code === "93066")).toMatchObject({ name: "Saint-Denis", department: "93", tensePart: 1, abcZone: "Abis", grandParis: true, former: ["Pierrefitte-sur-Seine"] });
    expect(region.map(({ former, ...commune }) => commune)).toEqual(regionCommunes);
    expect(region.find((commune) => commune.code === "78551")).toMatchObject({ pastTense: [1, 1, 1, 1], pastVeryTense: [null, null, null, null, null, null] });
    expect(packed.length).toBeLessThan(JSON.stringify(regionCommunes).length / 2);
});

test("a name is found with or without its accents, a former name finds the commune it joined, each once", () =>
{
    expect(find("Versailles")).toEqual(["Versailles (78)"]);
    expect(find("evry courcouronnes")).toEqual(["Évry-Courcouronnes (91)"]);
    expect(find("Pierrefitte")).toEqual(["Saint-Denis (93)"]);
    expect(find("Argenteuil")).toEqual(["Argenteuil (95)"]);
    expect(find("massy")[0]).toBe("Massy (91)");
});

test("communes of the same name show their department, and digits find INSEE codes as text", () =>
{
    expect(find("Blandy")).toEqual(["Blandy (77)", "Blandy (91)"]);
    expect(find("91377")).toEqual(["Massy (91)"]);
    expect(find("75056")).toEqual(["Paris (75)"]);
    expect(find("01053")).toEqual([]);
    expect(find("91").length).toBe(region.filter((commune) => commune.department === "91").length);
});

// Part 1 of the list reads for the notice and the reletting rent; part 2 and zone A bis only for agency fees.
test("each commune says what each rule reads there", () =>
{
    const line = (code: string) => zoneLineOf(region.find((commune) => commune.code === code)!);

    expect(line("78646")).toBe("Zone tendue, frais d'agence de zone très tendue.");
    expect(line("91377")).toBe("Zone tendue, frais d'agence de zone tendue.");
    expect(line("77022")).toBe("Hors zone tendue pour le préavis et la relocation, frais d'agence de zone tendue.");
    expect(line("78043")).toBe("Hors zone tendue pour le préavis et la relocation, frais d'agence de zone très tendue.");
    expect(line("77186")).toBe("Hors zone tendue pour le préavis et la relocation, frais d'agence hors zone tendue.");
});

test("the page names its 1 266 communes, its sources and the Grand Paris, and lists nothing before a name is typed", () =>
{
    const page = renderToStaticMarkup(<IleDeFrance communes={packed} count={region.length} capped={[]} />).replaceAll("&#x27;", "'");

    expect(page).toContain("1 266 communes");
    expect(page).toContain("Licence Ouverte 2.0");
    expect(page).toContain('<a href="../grand-paris/">Le Grand Paris commune par commune</a>');
    expect(page).toContain("Saisissez le nom de la commune ou son code Insee.");
    expect(page).not.toContain("<strong>Versailles</strong>");
});

test("the departments hold 1 266 communes between them, Seine-et-Marne the most", () =>
{
    const counts = departmentCounts(region);

    expect(counts.map((department) => [department.code, department.count])).toEqual([
        ["75", 1], ["77", 507], ["78", 259], ["91", 194], ["92", 36], ["93", 39], ["94", 47], ["95", 183],
    ]);
    expect(counts.reduce((sum, department) => sum + department.count, 0)).toBe(1266);
});
