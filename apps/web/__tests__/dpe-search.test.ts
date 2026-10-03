import { expect, test } from "vitest";

import type { DpeSource, Listing } from "@plafond/ademe";
import type { Geocoder, Lookup } from "@plafond/address";

import { search } from "../lib/dpe-search";

const listing: Listing = {
    dpe: { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" },
    address: "7 Place du Panthéon 75005 Paris",
    surface: 7320,
    floor: 4,
    detail: null,
    electric: true,
};

function needs(lookup: Lookup = { kind: "located", id: "75105_7034_00007", label: "7 Place du Panthéon 75005 Paris", point: { lon: 2.346, lat: 48.846 } }): { asked: string[]; geocoder: Geocoder; source: DpeSource }
{
    const asked: string[] = [];

    return {
        asked,
        geocoder: { locate: async (text: string) => (asked.push(`locate ${text}`), lookup) },
        source: {
            byNumber: async (number: string) => (asked.push(`number ${number}`), [listing]),
            atAddress: async (id: string) => (asked.push(`address ${id}`), [listing]),
        },
    };
}

test("a diagnosis number goes straight to ADEME, without telling the geocoder anything", async () =>
{
    const given = needs();

    expect(await search(" 2375 E034 5814N ", given)).toEqual({ kind: "listed", listings: [listing] });
    expect(given.asked).toEqual(["number 2375 E034 5814N"]);
});

test("an address is located first, then its diagnoses are asked by the BAN identifier", async () =>
{
    const given = needs();

    expect(await search("7 place du Panthéon", given)).toEqual({ kind: "listed", listings: [listing] });
    expect(given.asked).toEqual(["locate 7 place du Panthéon", "address 75105_7034_00007"]);
});

test("whatever the geocoder or ADEME refuses comes back as the reason, and nothing more is asked", async () =>
{
    const overseas = needs({ kind: "overseas", label: "1 Rue de Paris 97400 Saint-Denis" });
    expect(await search("1 rue de Paris Saint-Denis", overseas)).toEqual({ kind: "refused", problem: "overseas" });
    expect(overseas.asked).toEqual(["locate 1 rue de Paris Saint-Denis"]);

    const offline = needs();
    offline.source.atAddress = async () => ({ kind: "unreachable" });
    expect(await search("7 place du Panthéon", offline)).toEqual({ kind: "refused", problem: "unreachable" });
});

test("an address with no diagnosis on file says so instead of an empty list", async () =>
{
    const empty = needs();
    empty.source.atAddress = async () => [];

    expect(await search("7 place du Panthéon", empty)).toEqual({ kind: "refused", problem: "no-diagnosis" });
});
