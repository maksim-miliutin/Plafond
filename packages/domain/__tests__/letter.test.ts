import { expect, test } from "vitest";

import { check, type Check, type Claim } from "../src/cap.js";
import { letter, letterText, type Letter } from "../src/letter.js";
import type { Contest, Rate } from "../src/rates.js";

const thin = "\u202F";
const hard = "\u00A0";

// The 2025 rate for St-Germain-l'Auxerrois, three rooms, 1946-1970, furnished, from the published table.
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
        contest: null,
    },
};

const claim: Claim = {
    flat: rate.flat,
    surface: 4000,
    signedOn: "2025-09-01",
    startsOn: "2025-09-01",
    rent: 150000,
    complement: 0,
    on: "2026-09-29",
};

function written(change: Partial<Claim> = {}, stated = true, rates: Rate[] = [rate]): ReturnType<typeof letter>
{
    const lease = { ...claim, ...change };

    const address = "4 Place du Louvre 75001 Paris";

    return letter({ check: check(lease, rates) as Check, claim: lease, address, quartier: "Saint-Germain-l'Auxerrois", stated });
}

function text(result: ReturnType<typeof letter>): string
{
    const sent = result as Letter;

    return [sent.delivery, sent.subject, sent.greeting, ...sent.opening, ...sent.demands.flatMap((d) => d.paragraphs), ...sent.closing].join("\n");
}

test("a rent over the cap asks for the cap and for the overpayment back", () =>
{
    const sent = written() as Letter;

    expect(sent.demands.map((demand) => demand.ground)).toEqual(["excess"]);
    expect(text(sent)).toContain(`1${thin}280,00${hard}€`);
    expect(text(sent)).toContain(`dépasse ce plafond de 220,00${hard}€`);
    expect(text(sent)).toContain(`2${thin}640,00${hard}€ pour les 12 mois complets écoulés depuis le 1er septembre 2025`);
    expect(text(sent)).toContain("article 140, III, A");
});

test("the letter shows how the cap follows from the decree and the surface", () =>
{
    const facts = (written() as Letter).opening.join("\n");

    expect(facts).toContain("situé au 4 Place du Louvre, 75001 Paris, dans le quartier Saint-Germain-l'Auxerrois");
    expect(facts).toContain("3 pièces, loué meublé, dans un immeuble construit entre 1946 et 1970");
    expect(facts).toContain("Arrêté préfectoral n° 2025-06-16-00003");
    expect(facts).toContain(`32,00${hard}€ × 40${hard}m²`);
});

test("the refund reaches back three years and no further", () =>
{
    const old: Rate = { ...rate, decree: { ...rate.decree, from: "2019-07-01", until: "2020-07-01" } };
    const long = written({ signedOn: "2019-09-01", startsOn: "2019-09-01" }, true, [old]);

    // 36 months at 220 euros over the cap, counted by hand.
    expect(text(long)).toContain(`7${thin}920,00${hard}€ pour les trois dernières années`);
});

test("a letter written before a full month has passed asks only to lower the rent", () =>
{
    const early = text(written({ on: "2025-09-20" }));

    expect(early).toContain("ramener le loyer de base");
    expect(early).not.toContain("rembourser");
});

test("a rent within the cap with nothing else to put right asks for nothing", () =>
{
    expect(written({ rent: 120000 })).toEqual({ kind: "nothing-to-claim" });
});

test("a lease that leaves out the reference rents is put right only in the month after it starts", () =>
{
    const inside = written({ rent: 120000, on: "2025-09-30" }, false) as Letter;

    expect(inside.demands.map((demand) => demand.ground)).toEqual(["unstated"]);
    expect(inside.demands[0]!.paragraphs.join("\n")).toContain(`soit 26,70${hard}€ par m² pour le loyer de référence et 32,00${hard}€`);
    expect(text(inside)).toContain("article 140, V");
    expect(written({ rent: 120000, on: "2025-10-01" }, false)).toMatchObject({ kind: "letter" });
    expect(written({ rent: 120000, on: "2025-10-02" }, false)).toEqual({ kind: "nothing-to-claim" });
});

test("the month to have the rents written in runs from the day the lease takes effect, not from signing", () =>
{
    expect(written({ rent: 120000, signedOn: "2025-08-20", startsOn: "2025-09-01", on: "2025-09-25" }, false)).toMatchObject({
        demands: [{ ground: "unstated" }],
    });
});

test("a lease that states the reference rents has nothing to put right", () =>
{
    expect(written({ rent: 120000, on: "2025-09-30" }, true)).toEqual({ kind: "nothing-to-claim" });
});

test("a complement is contested only while its three months run, and never called unlawful", () =>
{
    const open = written({ rent: 120000, complement: 20000, on: "2025-10-15" }) as Letter;

    expect(open.demands.map((demand) => demand.ground)).toEqual(["complement"]);
    expect(text(open)).toContain("commission départementale de conciliation au plus tard le 1er décembre 2025");
    expect(written({ rent: 120000, complement: 20000 })).toEqual({ kind: "nothing-to-claim" });
    for (const word of ["illégal", "illicite", "abusif", "interdit"])
    {
        expect(text(open)).not.toContain(word);
    }
});

test("every ground found goes into one letter, in a fixed order", () =>
{
    const all = written({ complement: 20000, on: "2025-09-25" }, false) as Letter;

    expect(all.demands.map((demand) => demand.ground)).toEqual(["excess", "unstated", "complement"]);
});

test("a decree contested in court travels with the letter as a caution, not in its text", () =>
{
    const contest: Contest = {
        outcome: "annulled",
        court: "Tribunal administratif de Paris",
        decidedOn: "2025-10-24",
        claimsBy: "2025-10-24",
        source: "https://example.org/judgment",
    };
    const judged = written({}, true, [{ ...rate, decree: { ...rate.decree, contest } }]) as Letter;

    expect(judged.caution).toEqual(contest);
    expect(text(judged)).not.toContain("Tribunal administratif");
    expect((written() as Letter).caution).toBeNull();
});

test("the letter carries the day it is written and gives a month to answer", () =>
{
    const sent = written() as Letter;

    expect(sent.writtenOn).toBe("2026-09-29");
    expect(sent.closing.join("\n")).toContain("dans un délai d'un mois à compter de la réception");
});

test("the letter's text for copying carries every paragraph, the demands numbered", () =>
{
    const all = written({ complement: 20000, on: "2025-09-25" }, false) as Letter;
    const copy = letterText(all);

    expect(copy.startsWith("[Votre prénom et nom]\n4 Place du Louvre 75001 Paris\n\n[Nom du propriétaire]\n[Adresse du propriétaire]\n\nParis, le 25 septembre 2025\n")).toBe(true);
    expect(copy.endsWith("\n[Signature]\n")).toBe(true);
    for (const paragraph of [...all.opening, ...all.demands.flatMap((demand) => demand.paragraphs), ...all.closing])
    {
        expect(copy).toContain(paragraph);
    }

    all.demands.forEach((demand, index) =>
    {
        expect(copy).toContain(`\n${index + 1}. ${demand.paragraphs[0]}`);
    });
});

test("a lease that takes effect the day it is signed says so once", () =>
{
    const same = (written() as Letter).opening[0];
    const apart = (written({ signedOn: "2025-08-20", startsOn: "2025-09-01" }) as Letter).opening[0];

    expect(same).toContain("signé le 1er septembre 2025 et a pris effet le même jour.");
    expect(apart).toContain("signé le 20 août 2025 et a pris effet le 1er septembre 2025.");
});

test("an address the geocoder gives without a number is not put after au", () =>
{
    const lease = { ...claim, on: "2026-09-29" };
    const sent = letter({ check: check(lease, [rate]) as Check, claim: lease, address: "Place du Louvre 75001 Paris", quartier: "Saint-Germain-l'Auxerrois", stated: true }) as Letter;

    expect(sent.opening[0]).toContain("situé Place du Louvre, 75001 Paris,");
});


test("the copied letter states how it is sent above its subject, as French letters do", () =>
{
    const copy = letterText(written() as Letter);

    expect(copy.indexOf("Lettre recommandée avec accusé de réception")).toBeLessThan(copy.indexOf("Objet"));
});
