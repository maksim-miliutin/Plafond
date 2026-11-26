import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { FeesFormStep } from "../components/FeesFormStep";
import { NoticeFormStep } from "../components/NoticeFormStep";
import { feesStart, type FeesFields } from "../lib/fees-flow";
import { noticeStart, type NoticeFields } from "../lib/notice-flow";
import { regionNamed, seededLists as lists } from "./zone-seeds";

const known = (code: string) => ({ commune: regionNamed(code), lists });
const checked = (html: string, name: string) => (html.match(/<input[^>]*>/g) ?? [])
    .filter((input) => input.includes(`name="${name}"`) && input.includes('checked=""'))
    .map((input) => /value="([^"]+)"/.exec(input)?.[1]);

function fees(code: string, fields: Partial<FeesFields> = {}): string
{
    return renderToStaticMarkup(<FeesFormStep fields={{ ...feesStart.fields, ...fields }} errors={{}} commune={known(code)} today="2026-11-25" />).replaceAll("&#x27;", "'");
}

function notice(code: string, fields: Partial<NoticeFields> = {}): string
{
    return renderToStaticMarkup(<NoticeFormStep fields={{ ...noticeStart.fields, ...fields }} errors={{}} commune={known(code)} />).replaceAll("&#x27;", "'");
}

test("opened from Vincennes, the fees form ticks zone très tendue and says where it comes from", () =>
{
    expect(checked(fees("94080"), "zone")).toEqual(["very-tense"]);
    expect(fees("94080")).toContain("Vincennes : zone très tendue pour les frais d'agence");
});

test("the fees form ticks zone tendue for Massy and Barbizon, and the lowest zone for Fontainebleau", () =>
{
    expect(checked(fees("91377"), "zone")).toEqual(["tense"]);
    expect(checked(fees("77022"), "zone")).toEqual(["tense"]);
    expect(checked(fees("78043"), "zone")).toEqual(["very-tense"]);
    expect(checked(fees("77186"), "zone")).toEqual(["other"]);
});

// The lease's date decides: Alfortville entered zone A bis on 26 June 2026.
test("the date of the lease decides the zone, and a lease older than the lists leaves it to the tenant", () =>
{
    expect(checked(fees("94002", { signedOn: "2026-06-25" }), "zone")).toEqual(["tense"]);
    expect(checked(fees("94002", { signedOn: "2026-06-26" }), "zone")).toEqual(["very-tense"]);
    expect(checked(fees("91377", { signedOn: "2025-11-01" }), "zone")).toEqual([]);
    expect(fees("91377", { signedOn: "2025-11-01" })).toContain("Plafond n'a pas les listes de l'époque");
});

// The notice reads the list on the lease's signature or last renewal, which the form asks for first.
test("the notice form asks for the date of the lease before it answers for the commune", () =>
{
    expect(checked(notice("91027"), "tense")).toEqual([]);
    expect(notice("91027")).toContain('id="leaseOn"');
    expect(notice("91027")).toContain("Athis-Mons : indiquez la date de signature ou du dernier renouvellement du bail");
});

test("an answer the tenant already gave stays, whatever the commune says", () =>
{
    expect(checked(fees("94080", { zone: "tense" }), "zone")).toEqual(["tense"]);
    expect(checked(notice("94080", { tense: "unknown" }), "tense")).toEqual(["unknown"]);
});

test("without a commune, nothing is ticked and nothing is said about one", () =>
{
    const plain = renderToStaticMarkup(<FeesFormStep fields={feesStart.fields} errors={{}} />);

    expect(checked(plain, "zone")).toEqual([]);
    expect(plain).not.toContain("Vous pouvez corriger ce choix");
    expect(renderToStaticMarkup(<NoticeFormStep fields={noticeStart.fields} errors={{}} />)).not.toContain('id="leaseOn"');
});
