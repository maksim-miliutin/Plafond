import { expect, test } from "vitest";

import { decency, increase, type Dpe, type Tenancy } from "../src/dpe.js";
import { dpeLetter } from "../src/dpe-letter.js";
import { letterText, type Letter } from "../src/letter.js";

const g: Dpe = { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" };
const lease: Tenancy = { signedOn: "2023-03-01", furnished: false, company: false, on: "2026-10-03" };
const address = "7 Place du Panthéon 75005 Paris";

function written(dpe: Dpe, tenancy: Tenancy, raisedOn: string | null): ReturnType<typeof dpeLetter>
{
    return dpeLetter({
        dpe,
        tenancy,
        address,
        raisedOn,
        increase: raisedOn === null ? null : increase(dpe, tenancy, raisedOn),
        decency: decency(dpe, tenancy),
    });
}

test("a G flat raised after the freeze and not decent since its renewal gets both demands, the freeze first", () =>
{
    const sent = written(g, lease, "2024-03-01") as Letter;
    const said = (ground: string) => sent.demands.find((d) => d.ground === ground)!.paragraphs.join(" ");

    expect(sent.demands.map((d) => d.ground)).toEqual(["freeze", "decency"]);
    expect(said("freeze")).toContain("je vous mets en demeure de renoncer à l'augmentation de loyer appliquée le 1er mars 2024");
    expect(said("decency")).toContain("je vous mets en demeure de réaliser les travaux");
    expect(said("decency")).toContain("Depuis le 1er janvier 2025, un logement classé G");
});

test("the letter names the diagnosis it rests on, by its number, date and class", () =>
{
    const opening = (written(g, lease, "2024-03-01") as Letter).opening.join(" ");

    expect(opening).toContain("situé au 7 Place du Panthéon, 75005 Paris");
    expect(opening).toContain("diagnostic de performance énergétique n° 2375E0345814N, établi le 2 février 2023, classe ce logement en G");
});

test("a letter outside Paris is dated from the town of the flat", () =>
{
    const lyon = dpeLetter({ dpe: g, tenancy: lease, address: "10 Rue de la République 69001 Lyon", raisedOn: null, increase: null, decency: decency(g, lease) }) as Letter;

    expect(lyon.dated).toBe("Lyon, le 3 octobre 2026");
});

test("a flat with nothing to put right asks for nothing", () =>
{
    expect(written({ ...g, label: "E" }, lease, "2024-03-01")).toEqual({ kind: "nothing-to-claim" });
    expect(written(g, { ...lease, signedOn: "2024-06-01" }, null)).toEqual({ kind: "nothing-to-claim" });
});

test("the copied DPE letter reads like the rent letter, numbered and signed", () =>
{
    const copy = letterText(written(g, lease, "2024-03-01") as Letter);

    expect(copy).toContain("\n1. ");
    expect(copy).toContain("\n2. ");
    expect(copy.endsWith("\n[Signature]\n")).toBe(true);
});

test("the climate law is cited plainly, without an article in front of it inside the brackets", () =>
{
    const said = (written(g, lease, "2024-03-01") as Letter).demands.map((demand) => demand.paragraphs.join(" ")).join(" ");

    expect(said).toContain("(loi n° 2021-1104 du 22 août 2021 dite Climat et résilience)");
    expect(said).toContain("modifié par la loi n° 2021-1104");
    expect(said).not.toContain("(la loi");
});
