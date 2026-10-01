// @vitest-environment jsdom
import axe from "axe-core";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { check, letter, type Check, type Claim, type Letter, type Quartier, type Rate } from "@plafond/domain";

import { AddressStep } from "../components/AddressStep";
import { LeaseStep } from "../components/LeaseStep";
import { LetterStep } from "../components/LetterStep";
import { QuartierStep } from "../components/QuartierStep";
import { ResultStep } from "../components/ResultStep";
import { questions, type LeaseFields } from "../lib/lease";

const rate: Rate = {
    flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
    reference: 2670,
    majored: 3200,
    minored: 1870,
    decree: {
        title: "Arrêté préfectoral n° 2025-06-16-00003",
        url: "https://example.org/decree",
        from: "2025-07-01",
        until: "2026-07-01",
        contest: { outcome: "pending", court: "Conseil d'État", decidedOn: "2024-11-18", claimsBy: null, source: "https://example.org" },
    },
};

const claim: Claim = {
    flat: rate.flat,
    surface: 4000,
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    rent: 150000,
    complement: 20000,
    on: "2025-09-25",
};

const checked = check(claim, [rate]) as Check;
const written = letter({ check: checked, claim, address: "4 Place du Louvre 75001 Paris", quartier: "Saint-Germain-l'Auxerrois", stated: false }) as Letter;
const quartier: Quartier = { number: 1, name: "Saint-Germain-l'Auxerrois", rings: [[[2.34, 48.86], [2.345, 48.86], [2.345, 48.863], [2.34, 48.86]]] };
const blank = Object.fromEntries(Object.keys(questions).map((key) => [key, ""])) as unknown as LeaseFields;

const screens: Record<string, ReactElement> = {
    "address": <AddressStep />,
    "refused address": <AddressStep typed="4 place du louvre" problem="street-only" />,
    "quartier": <QuartierStep quartier={quartier} around={[]} address="4 Place du Louvre 75001 Paris" point={{ lon: 2.342, lat: 48.861 }} />,
    "lease": <LeaseStep fields={blank} errors={{}} />,
    "refused lease": <LeaseStep fields={blank} errors={questions} noRate />,
    "result": <ResultStep check={checked} claim={claim} quartier="Saint-Germain-l'Auxerrois" writable />,
    "letter": <LetterStep letter={written} />,
};

// Colour contrast needs a real layout, which jsdom does not have; the browser tests look at it instead.
const withoutLayout = { rules: { "color-contrast": { enabled: false } } };

for (const [name, screen] of Object.entries(screens))
{
    test(`the ${name} screen has nothing a screen reader or a keyboard would trip on`, async () =>
    {
        document.documentElement.lang = "fr";
        document.title = "Plafond";
        document.body.innerHTML = renderToStaticMarkup(screen);

        const found = await axe.run(document, withoutLayout);

        expect(found.violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target.join(" ")).join(", ")}`)).toEqual([]);
    });
}

// axe leaves these two to best practice and lets them pass here, yet a screen reader user leans on both.
test("every screen has exactly one main heading and names each group of choices", () =>
{
    for (const [name, screen] of Object.entries(screens))
    {
        const html = renderToStaticMarkup(screen);

        expect(html.match(/<h1[\s>]/g)?.length ?? 0, name).toBe(1);
        expect(html.match(/<legend[\s>]/g)?.length ?? 0, name).toBe(html.match(/<fieldset[\s>]/g)?.length ?? 0);
    }
});
