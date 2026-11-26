/// <reference types="vite/client" />
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { lawOf, seedsFrom } from "@plafond/import";
import type { City, Quartier, Rate } from "@plafond/domain";

import { LeaseStep } from "../components/LeaseStep";
import { next, type Step, type World } from "../lib/flow";
import type { LeaseFields } from "../lib/lease";

import lawSeed from "../../../db/seed/rent-control-law.json" with { type: "json" };

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const seeds = seedsFrom((name) => files[`../../../db/seed/${name}`]!);
const law = lawOf(lawSeed);

// One area of each territory around the end of the decrees of 2026. The acts of 23 November 2026 keep them in force, and
// Plafond holds each to the day before the next yearly decree: 1 July 2027 in Paris, 1 June 2027 in the two territories.
const territories: { city: City; rates: Rate[]; area: Quartier; dwelling: string; last: string; after: string }[] = [
    { city: "paris", rates: seeds.paris, area: seeds.quartiers[0]!, dwelling: "", last: "2027-06-30", after: "2027-07-01" },
    { city: "est-ensemble", rates: seeds.estEnsemble.rates, area: seeds.estEnsemble.areas.find((area) => area.name === "Pantin")!, dwelling: "flat", last: "2027-05-31", after: "2027-06-01" },
    { city: "plaine-commune", rates: seeds.plaineCommune.rates, area: seeds.plaineCommune.areas.find((area) => area.name === "Saint-Ouen-sur-Seine")!, dwelling: "flat", last: "2027-05-31", after: "2027-06-01" },
];

function signed(city: City, rates: Rate[], area: Quartier, dwelling: string, signedOn: string): Step
{
    const world: World = { city, rates, quartiers: [area], on: "2026-11-25", law };
    const place = { city, label: area.name, point: { lon: 2.35, lat: 48.86 }, quartier: area, around: [] };
    const fields: LeaseFields = {
        dwelling, rooms: "2", period: "1946-1970", furnished: "no", surface: "40", rent: "1 000", complement: "", signedOn, startsOn: signedOn, stated: "yes",
    };

    return next({ at: "lease", typed: area.name, place, fields, errors: {}, unchecked: null }, { type: "answered", fields }, world);
}

test("in Paris, Est Ensemble and Plaine Commune a lease of 25 November 2026 is priced, and one after the decree's last day is told the data is not out", () =>
{
    for (const { city, rates, area, dwelling, last: lastDay, after: dayAfter } of territories)
    {
        const today = signed(city, rates, area, dwelling, "2026-11-25");
        const last = signed(city, rates, area, dwelling, lastDay);
        const after = signed(city, rates, area, dwelling, dayAfter);

        expect(today, `${city} on 25 November 2026`).toMatchObject({ at: "result", check: { kind: "checked" } });
        expect(last, `${city} on ${lastDay}`).toMatchObject({ at: "result", check: { kind: "checked" } });
        expect(after, `${city} on ${dayAfter}`).toMatchObject({ at: "lease", unchecked: { kind: "no-rate", side: "after", until: lastDay } });

        const notice = after.at === "lease" ? renderToStaticMarkup(<LeaseStep fields={after.fields} errors={{}} unchecked={after.unchecked} city={city} />) : "";
        expect(notice, city).toContain("Données officielles indisponibles pour cette date de bail.");
        expect(notice, city).not.toMatch(/\d+,\d{2} €/);
    }
});
