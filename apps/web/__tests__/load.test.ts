import { expect, test } from "vitest";

import { PackedError, pack, packQuartiers, type Quartier, type Rate } from "@plafond/domain";
import type { Fetcher } from "@plafond/address";

import { loadQuartiers, loadRates, loadTables } from "../lib/load";

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
// The address is relative, so the app works under the project path GitHub Pages gives it.
test("the whole table arrives in one request that says nothing about the flat", async () =>
{
    const asked: string[] = [];

    expect(await loadRates(serving(pack(rates), asked))).toEqual(rates);
    expect(asked).toEqual(["rates.json"]);
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

test("the quartier outlines arrive the same way, whole and in one request", async () =>
{
    const asked: string[] = [];
    const quartiers: Quartier[] = [{ number: 1, name: "Saint-Germain-l'Auxerrois", rings: [[[2.34, 48.86], [2.345, 48.86], [2.34, 48.863], [2.34, 48.86]]] }];

    expect(await loadQuartiers(serving(packQuartiers(quartiers), asked))).toEqual(quartiers);
    expect(asked).toEqual(["quartiers.json"]);
    expect(await loadQuartiers(serving(packQuartiers(quartiers), [], false))).toEqual({ kind: "unreachable" });
});

test("the app gets both tables or neither", async () =>
{
    const quartiers: Quartier[] = [{ number: 1, name: "Halles", rings: [[[2.34, 48.86], [2.345, 48.86], [2.34, 48.863], [2.34, 48.86]]] }];
    const both: Fetcher = async (url) => ({ ok: true, status: 200, json: async () => (url.includes("rates") ? pack(rates) : packQuartiers(quartiers)) });
    const halfway: Fetcher = async (url) => ({ ok: url.includes("rates"), status: url.includes("rates") ? 200 : 503, json: async () => pack(rates) });

    expect(await loadTables(both)).toEqual({ rates, quartiers });
    expect(await loadTables(halfway)).toEqual({ kind: "unreachable" });
});
