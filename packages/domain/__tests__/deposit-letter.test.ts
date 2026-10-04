import { expect, test } from "vitest";

import { deposit, type Deposit } from "../src/deposit.js";
import { depositLetter } from "../src/deposit-letter.js";
import { letterText, type Letter } from "../src/letter.js";

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
const address = "12 Rue des Lilas 69003 Lyon";

function written(change: Partial<Deposit> = {}): ReturnType<typeof depositLetter>
{
    const held = { ...moved, ...change };

    return depositLetter({ held, check: deposit(held), address });
}

test("a deposit still held after the deadline is claimed with its penalty, period by period", () =>
{
    const sent = written() as Letter;
    const said = sent.demands.map((demand) => demand.paragraphs.join(" ")).join(" ");

    expect(sent.demands.map((demand) => demand.ground)).toEqual(["deposit"]);
    expect(said).toContain("au plus tard le 1er août 2026");
    expect(said).toContain("je vous mets en demeure de me restituer la somme de 1\u202F200,00\u00A0€");
    expect(said).toContain("majorée de 360,00\u00A0€");
    expect(said).toContain("3 périodes mensuelles commencées en retard");
});

test("a deposit returned late in full leaves only the penalty to claim", () =>
{
    const said = (written({ returned: 120000, returnedOn: "2026-08-20" }) as Letter).demands[0]!.paragraphs.join(" ");

    expect(said).toContain("restitué le 20 août 2026");
    expect(said).toContain("de me verser la majoration de 120,00\u00A0€");
    expect(said).not.toContain("de me restituer la somme");
});

test("without a new address the letter claims the deposit and leaves the penalty out", () =>
{
    const said = (written({ addressGiven: false }) as Letter).demands[0]!.paragraphs.join(" ");

    expect(said).toContain("de me restituer la somme de 1\u202F200,00\u00A0€");
    expect(said).not.toContain("majorée");
});

test("the letter asks for proof of anything the landlord keeps", () =>
{
    expect((written({ returned: 60000, returnedOn: "2026-07-20" }) as Letter).demands[0]!.paragraphs.join(" ")).toContain("justificatifs des sommes retenues");
});

test("nothing is claimed before the deadline or once all was returned in time", () =>
{
    expect(written({ on: "2026-07-25" })).toEqual({ kind: "nothing-to-claim" });
    expect(written({ returned: 120000, returnedOn: "2026-07-25" })).toEqual({ kind: "nothing-to-claim" });
});

test("the deposit letter is dated from the town of the flat and reads like the others", () =>
{
    const sent = written() as Letter;

    expect(sent.dated).toBe("Lyon, le 3 octobre 2026");
    expect(sent.subject).toContain("dépôt de garantie");
    expect(letterText(sent)).toContain("\n1. ");
});

test("a deposit returned late in full to a tenant who gave no new address leaves nothing to claim", () =>
{
    expect(written({ returned: 120000, returnedOn: "2026-08-20", addressGiven: false })).toEqual({ kind: "nothing-to-claim" });
});
