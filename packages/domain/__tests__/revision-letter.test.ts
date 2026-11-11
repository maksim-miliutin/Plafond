import { expect, test } from "vitest";

import { letterText, type Letter } from "../src/letter.js";
import { revision, type IndexRow, type Revision } from "../src/revision.js";
import { revisionLetter } from "../src/revision-letter.js";

const index: IndexRow[] = [
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
];
const lease: Revision = {
    clause: true,
    rent: 60000,
    asked: 62000,
    quarter: 2,
    signedOn: "2025-07-20",
    revisedOn: "2026-07-20",
    askedOn: "2026-08-03",
};
const address = "12 Rue des Lilas 69003 Lyon";

function written(change: Partial<Revision> = {}): ReturnType<typeof revisionLetter>
{
    const asked = { ...lease, ...change };

    return revisionLetter({ lease: asked, check: revision(asked, index), address, on: "2026-10-12" });
}

const said = (change: Partial<Revision> = {}) => letterText(written(change) as Letter);

test("a rise above the index is contested with the two values of the index and the rent they allow", () =>
{
    expect((written() as Letter).subject).toBe("Objet : contestation de la révision du loyer");
    expect(said()).toContain("vous m'avez demandé de porter le loyer hors charges de 600,00 € à 620,00 €");
    expect(said()).toContain("L'indice de référence des loyers du 2e trimestre 2026 est de 148,37, celui du 2e trimestre 2025 de 146,68");
    expect(said()).toContain("le loyer révisé ne peut donc pas dépasser 600,00 € × 148,37 / 146,68, soit 606,91 €");
    expect(said()).toContain("article 17-1 de la loi n° 89-462 du 6 juillet 1989");
});

test("a rise asked after the revision date is owed only from the day it was asked", () =>
{
    expect(said()).toContain("La révision ne prend effet qu'à compter de votre demande, le 3 août 2026, et non au 20 juillet 2026.");
    expect(said({ askedOn: "2026-07-20" })).not.toContain("ne prend effet qu'à compter de votre demande");
});

test("a lease that names no quarter is held to the last index published at its signing", () =>
{
    expect(said({ quarter: null })).toContain("Le bail ne mentionnant pas de trimestre de référence, c'est le dernier indice publié à sa signature qui "
        + "s'applique, celui du 2e trimestre.");
    expect(said()).not.toContain("ne mentionnant pas de trimestre");
});

test("a rise asked too late, or without a clause, is refused whole", () =>
{
    expect(said({ askedOn: "2027-07-20" })).toContain("La révision devait être demandée au plus tard le 19 juillet 2027");
    expect(said({ askedOn: "2027-07-20" })).toContain("le loyer reste de 600,00 €");
    expect(said({ clause: false })).toContain("Le bail ne contient pas de clause de révision");
});

test("a rise within the index, or one the table cannot check, leaves nothing to claim", () =>
{
    expect(written({ asked: 60691 })).toEqual({ kind: "nothing-to-claim" });
    expect(written({ revisedOn: "2025-08-01", askedOn: "2025-08-01" })).toEqual({ kind: "nothing-to-claim" });
});
