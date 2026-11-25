/// <reference types="vite/client" />
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { zoneListsOf } from "@plafond/import";

import { FeesFormStep } from "../components/FeesFormStep";
import { NoticeFormStep } from "../components/NoticeFormStep";
import { feesStart, type FeesFields } from "../lib/fees-flow";
import { noticeStart, type NoticeFields } from "../lib/notice-flow";

import sources from "../../../db/seed/zone-lists.json?raw";
import { seededZones } from "./zone-seeds";

const lists = zoneListsOf(JSON.parse(sources));
const known = (code: string) => ({ commune: seededZones.find((row) => row.code === code)!, lists });
const checked = (html: string, name: string) => (html.match(/<input[^>]*>/g) ?? [])
    .filter((input) => input.includes(`name="${name}"`) && input.includes('checked=""'))
    .map((input) => /value="([^"]+)"/.exec(input)?.[1]);

function fees(code: string, fields: Partial<FeesFields> = {}): string
{
    return renderToStaticMarkup(<FeesFormStep fields={{ ...feesStart.fields, ...fields }} errors={{}} commune={known(code)} today="2026-11-24" />).replaceAll("&#x27;", "'");
}

function notice(code: string, fields: Partial<NoticeFields> = {}): string
{
    return renderToStaticMarkup(<NoticeFormStep fields={{ ...noticeStart.fields, ...fields }} errors={{}} commune={known(code)} today="2026-11-24" />).replaceAll("&#x27;", "'");
}

test("opened from Vincennes, the fees form ticks zone très tendue and says where it comes from", () =>
{
    expect(checked(fees("94080"), "zone")).toEqual(["very-tense"]);
    expect(fees("94080")).toContain("Vincennes : zone très tendue, d'après la liste en vigueur depuis le 26 juin 2026. Vous pouvez corriger ce choix.");
});

test("opened from Athis-Mons, the fees form ticks zone tendue and the notice form ticks the tense zone", () =>
{
    expect(checked(fees("91027"), "zone")).toEqual(["tense"]);
    expect(checked(notice("91027"), "tense")).toEqual(["yes"]);
});

// The lease's date decides: Alfortville entered zone A bis on 26 June 2026.
test("for a lease signed before the list it holds took effect, the form ticks nothing and asks", () =>
{
    expect(checked(fees("94002", { signedOn: "2026-06-25" }), "zone")).toEqual([]);
    expect(fees("94002", { signedOn: "2026-06-25" })).toContain("pour un bail signé avant le 26 juin 2026, Plafond n'a pas la liste de l'époque.");
    expect(checked(fees("94002", { signedOn: "2026-06-26" }), "zone")).toEqual(["very-tense"]);
    expect(checked(notice("91027", { receivedOn: "2025-12-01" }), "tense")).toEqual([]);
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
});
