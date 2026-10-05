import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import type { Listing } from "@plafond/ademe";

import { DpeChooseStep } from "../components/DpeChooseStep";

const recent: Listing = {
    dpe: { number: "2675E2325806E", label: "E", establishedOn: "2026-09-10", validUntil: "2036-09-09" },
    address: "3 Place du Panthéon 75005 Paris",
    surface: 14680,
    floor: 4,
    detail: null,
    electric: false,
};
const ground: Listing = { ...recent, dpe: { ...recent.dpe, number: "2375E1759742J", label: "G" }, surface: 17260, floor: null, detail: "Bat. 1; Etage 3; Porte Face" };
const bare: Listing = { ...recent, dpe: { ...recent.dpe, number: "2475E0959198G" }, surface: null, floor: null };

const page = renderToStaticMarkup(<DpeChooseStep listings={[recent, ground, bare]} />);
const buttons = page.match(/<button[^>]*class="listing"[^>]*>.*?<\/button>/gs) ?? [];

test("each diagnosis found is one button to choose, in the order given", () =>
{
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toContain("2675E2325806E");
    expect(buttons[1]).toContain("2375E1759742J");
});

test("a diagnosis shows what tells one flat from another: class, date, surface, floor and lot", () =>
{
    expect(buttons[0]).toMatch(/class="grade grade-E"[^>]*>E</);
    expect(buttons[0]).toContain("DPE du 10 septembre 2026");
    expect(buttons[0]).toContain("146,8\u00A0m²");
    expect(buttons[0]).toContain("4e étage");
    expect(buttons[1]).toContain("Bat. 1; Etage 3; Porte Face");
    expect(page).not.toContain("rez-de-chaussée");
});

test("what a diagnosis does not say is left out rather than shown empty", () =>
{
    expect(buttons[2]).not.toContain("m²");
    expect(buttons[2]).not.toContain("étage");
});

test("the screen says which of the four steps it is", () =>
{
    expect(page).toContain("Étape 2 sur 4\u00A0: votre logement");
    expect(page.match(/class="segment done"/g)).toHaveLength(2);
});
