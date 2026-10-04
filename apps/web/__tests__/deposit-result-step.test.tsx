import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { deposit, type Deposit } from "@plafond/domain";

import { DepositResultStep } from "../components/DepositResultStep";

const moved: Deposit = {
    paid: 120000,
    rent: 120000,
    furnished: false,
    keysOn: "2026-07-01",
    conforming: true,
    addressGiven: true,
    returned: 0,
    returnedOn: null,
    on: "2026-10-03",
};
const thin = "\u202F";
const hard = "\u00A0";

function page(change: Partial<Deposit> = {}, writable = false): string
{
    const held = { ...moved, ...change };

    return renderToStaticMarkup(<DepositResultStep held={held} check={deposit(held)} writable={writable} onHelp={() => undefined} />);
}

test("a deposit held past the deadline heads the screen with all that is owed, then each part with its date", () =>
{
    const shown = page({}, true);

    expect(shown).toMatch(new RegExp(`<h1[^>]*>.*1${thin}560,00${hard}€.*vous sont dus.*</h1>`, "s"));
    expect(shown).toContain(`1${thin}200,00${hard}€`);
    expect(shown).toContain(`360,00${hard}€`);
    expect(shown).toContain("1er août 2026");
    expect(shown).toContain("Préparer la lettre au propriétaire");
    expect(shown).toContain("Trouver une aide gratuite");
});

test("before the deadline the screen says how long the landlord still has", () =>
{
    const shown = page({ keysOn: "2026-09-20" });

    expect(shown).toContain("Le délai court encore");
    expect(shown).toContain("jusqu&#x27;au 20 octobre 2026");
    expect(shown).not.toContain("Préparer la lettre");
});

test("a deposit returned in time says so and offers no letter", () =>
{
    expect(page({ returned: 120000, returnedOn: "2026-07-25" })).toContain("rendu à temps");
});

test("without a new address the penalty is said not to be due, while the deposit still is", () =>
{
    const shown = page({ addressGiven: false });

    expect(shown).toContain("la majoration n&#x27;est pas due");
    expect(shown).toMatch(new RegExp(`<h1[^>]*>.*1${thin}200,00${hard}€.*vous sont dus.*</h1>`, "s"));
});

test("a deposit above the legal maximum is pointed out with that maximum", () =>
{
    expect(page({ paid: 240000 })).toContain(`maximum légal de 1${thin}200,00${hard}€`);
    expect(page()).not.toContain("maximum légal");
});

test("the screen recalls the share a landlord in a building with shared accounts may keep for a while", () =>
{
    expect(page()).toContain("20\u00A0%");
});
