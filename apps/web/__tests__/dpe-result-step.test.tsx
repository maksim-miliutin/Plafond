import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { decency, increase, type Tenancy } from "@plafond/domain";
import type { Listing } from "@plafond/ademe";

import { DpeResultStep } from "../components/DpeResultStep";

const g: Listing = {
    dpe: { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" },
    address: "7 Place du Panthéon 75005 Paris",
    surface: 7320,
    floor: 4,
    detail: null,
    electric: true,
};
const lease: Tenancy = { signedOn: "2023-03-01", furnished: false, company: false, on: "2026-10-03" };

function page(listing: Listing, raisedOn: string | null, writable = false, tenancy: Tenancy = lease): string
{
    return renderToStaticMarkup(
        <DpeResultStep
            listing={listing}
            raisedOn={raisedOn}
            decency={decency(listing.dpe, tenancy)}
            increase={raisedOn === null ? null : increase(listing.dpe, tenancy, raisedOn)}
            writable={writable}
        />,
    );
}

test("the class of the flat is the headline, with the diagnosis it comes from", () =>
{
    const shown = page(g, null);

    expect(shown).toMatch(/<h1[^>]*>.*Logement classé G.*<\/h1>/s);
    expect(shown).toContain("DPE n° 2375E0345814N, établi le 2 février 2023, valable jusqu&#x27;au 1er février 2033");
});

test("a forbidden rise and a flat no longer decent are each told with the dates that decide them", () =>
{
    const shown = page(g, "2024-03-01", true);

    expect(shown).toContain("L&#x27;augmentation du 1er mars 2024 n&#x27;était pas permise");
    expect(shown).toContain("24 août 2022");
    expect(shown).toContain("n&#x27;est plus décent");
    expect(shown).toContain("1er janvier 2025");
    expect(shown).toContain("Préparer la lettre au propriétaire");
});

test("each allowed rise says why it was allowed, and a late diagnosis says what it cannot tell", () =>
{
    const e: Listing = { ...g, dpe: { ...g.dpe, label: "E" } };
    const old: Tenancy = { ...lease, signedOn: "2021-01-01" };
    const late: Listing = { ...g, dpe: { ...g.dpe, establishedOn: "2025-02-01" } };

    expect(page(e, "2024-03-01")).toContain("le gel ne concerne que les logements classés F ou G");
    expect(page(g, "2023-06-01", false, old)).toContain("a commencé avant le 24 août 2022");
    expect(page(late, "2024-03-01")).toContain("ne dit pas quelle était la classe du logement");
});

test("a flat that meets decency or will fail it later is told so plainly", () =>
{
    expect(page({ ...g, dpe: { ...g.dpe, label: "D" } }, null)).toContain("respecte le critère énergétique de décence");
    expect(page(g, null, false, { ...lease, signedOn: "2024-06-01" })).toContain("le 1er juin 2027");
});

// The 2026 change of formula favours flats heated with electricity; an older F or G diagnosis may no longer be one.
test("an older F or G diagnosis of a flat heated with electricity points to a free update", () =>
{
    expect(page(g, null)).toContain("mise à jour gratuite");
    expect(page({ ...g, electric: false }, null)).not.toContain("mise à jour gratuite");
    expect(page({ ...g, dpe: { ...g.dpe, establishedOn: "2026-02-01" } }, null)).not.toContain("mise à jour gratuite");
});

test("no letter is offered when there is nothing to claim", () =>
{
    expect(page({ ...g, dpe: { ...g.dpe, label: "D" } }, null, false)).not.toContain("Préparer la lettre");
});
