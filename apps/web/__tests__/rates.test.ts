import { expect, test } from "vitest";

import { PackedError, pack, type Rate } from "@plafond/domain";
import type { Fetcher } from "@plafond/address";

import { loadRates } from "../lib/rates";

const rates: Rate[] = [
    {
        flat: { quartier: 1, rooms: 3, period: "1946-1970", furnished: true },
        reference: 2670,
        majored: 3200,
        minored: 1870,
        decree: { title: "Arrêté préfectoral n° 2025-06-16-00003", url: "https://example.org", from: "2025-07-01", until: "2026-07-01", contest: null },
    },
];

function serving(body: unknown, asked: string[] = [], ok = true): Fetcher
{
    return async (url) =>
    {
        asked.push(url);

        return { ok, status: ok ? 200 : 404, json: async () => body };
    };
}

// Asking for one quartier's rates would tell the server where the flat is; the whole table tells it nothing.
test("the whole table arrives in one request that says nothing about the flat", async () =>
{
    const asked: string[] = [];

    expect(await loadRates(serving(pack(rates), asked))).toEqual(rates);
    expect(asked).toEqual(["/rates.json"]);
});

test("a table that cannot be reached is told apart from a broken one", async () =>
{
    const offline: Fetcher = async () =>
    {
        throw new TypeError("Failed to fetch");
    };

    expect(await loadRates(offline)).toEqual({ kind: "unreachable" });
    expect(await loadRates(serving(pack(rates), [], false))).toEqual({ kind: "unreachable" });
    await expect(loadRates(serving({ version: 7 }))).rejects.toThrow(PackedError);
});
