// @vitest-environment jsdom
import axe from "axe-core";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { charges, check, deposit, letter, type Check, type Claim, type Contest, type Deposit, type Letter, type Regularisation, type Quartier, type Rate } from "@plafond/domain";

import type { Listing } from "@plafond/ademe";

import { AddressStep } from "../components/AddressStep";
import { DpeChooseStep } from "../components/DpeChooseStep";
import { DpeFindStep } from "../components/DpeFindStep";
import { DpeLeaseStep } from "../components/DpeLeaseStep";
import { DpeResultStep } from "../components/DpeResultStep";
import { HelpStep } from "../components/HelpStep";
import { DepositFormStep } from "../components/DepositFormStep";
import { DepositResultStep } from "../components/DepositResultStep";
import { ChargesFormStep } from "../components/ChargesFormStep";
import { ChargesResultStep } from "../components/ChargesResultStep";
import { chargesStart } from "../lib/charges-flow";
import { depositQuestions, type DepositFields } from "../lib/deposit-flow";
import { Mentions } from "../components/Mentions";
import { helpers, parisRent } from "../lib/help";
import { LeaseStep } from "../components/LeaseStep";
import { LetterStep } from "../components/LetterStep";
import { QuartierStep } from "../components/QuartierStep";
import { ResultStep } from "../components/ResultStep";
import { questions, type LeaseFields } from "../lib/lease";
import { claim as lease, rate as base } from "./fixtures";

const contest: Contest = { outcome: "pending", court: "Conseil d'État", decidedOn: "2024-11-18", claimsBy: null, source: "https://example.org" };
const rate: Rate = { ...base, decree: { ...base.decree, contest } };

const claim: Claim = { ...lease, complement: 20000, on: "2025-09-25" };

const checked = check(claim, [rate]) as Check;
const written = letter({ check: checked, claim, address: "4 Place du Louvre 75001 Paris", quartier: "Saint-Germain-l'Auxerrois", stated: false }) as Letter;
const quartier: Quartier = { number: 1, name: "Saint-Germain-l'Auxerrois", rings: [[[2.34, 48.86], [2.345, 48.86], [2.345, 48.863], [2.34, 48.86]]] };
const blank = Object.fromEntries(Object.keys(questions).map((key) => [key, ""])) as unknown as LeaseFields;

const listing: Listing = {
    dpe: { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" },
    address: "7 Place du Panthéon 75005 Paris",
    surface: 7320,
    floor: 4,
    detail: null,
    electric: true,
};

const held: Deposit = { paid: 120000, rent: 120000, furnished: false, keysOn: "2026-07-01", conforming: true, addressGiven: true, returned: 0, returnedOn: null, on: "2026-10-03" };

const statement: Regularisation = { year: 2024, lines: [{ kind: "water", billed: 30000 }, { kind: "insurance", billed: 15000 }], provisions: 30000, receivedOn: "2026-02-10" };

const screens: Record<string, ReactElement> = {
    "dpe search": <DpeFindStep />,
    "refused dpe search": <DpeFindStep typed="7 place du Panthéon" problem="no-diagnosis" />,
    "dpe lease": <DpeLeaseStep fields={{ signedOn: "", furnished: "", landlord: "", raised: "", raisedOn: "" }} errors={{ raised: "Indiquez si votre loyer a augmenté depuis la signature." }} />,
    "dpe result": <DpeResultStep listing={listing} raisedOn="2024-03-01" decency={{ kind: "not-decent", since: "2026-03-01" }} increase={{ kind: "forbidden", since: "2023-03-01" }} writable />,
    "help": <HelpStep helpers={[parisRent, ...helpers]} onBack={() => undefined} />,
    "legal notice": <Mentions />,
    "deposit form": <DepositFormStep fields={Object.fromEntries(Object.keys(depositQuestions).map((key) => [key, ""])) as unknown as DepositFields} errors={{ keysOn: "Indiquez la date de remise des clés." }} />,
    "deposit result": <DepositResultStep held={held} check={deposit(held)} writable onHelp={() => undefined} onBack={() => undefined} />,
    "charges form": <ChargesFormStep fields={chargesStart.at === "form" ? chargesStart.fields : {}} errors={{ lines: "Reportez au moins un poste de votre décompte." }} />,
    "charges result": <ChargesResultStep regularised={statement} check={charges(statement)} on="2026-03-01" writable onHelp={() => undefined} onBack={() => undefined} />,
    "dpe choice": <DpeChooseStep listings={[listing, { ...listing, dpe: { ...listing.dpe, number: "2375E1759742J", label: "E" } }]} />,
    "address": <AddressStep />,
    "refused address": <AddressStep typed="4 place du louvre" problem="street-only" />,
    "quartier": <QuartierStep quartier={quartier} around={[]} address="4 Place du Louvre 75001 Paris" point={{ lon: 2.342, lat: 48.861 }} />,
    "lease": <LeaseStep fields={blank} errors={{}} />,
    "refused lease": <LeaseStep fields={blank} errors={questions} noRate={{ side: "after", until: "2026-11-24" }} />,
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
