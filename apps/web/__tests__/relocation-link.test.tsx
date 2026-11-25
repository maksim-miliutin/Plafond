// @vitest-environment jsdom
/// <reference types="vite/client" />
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { indexOf, relocationRulesOf, zoneListsOf, zonesOf } from "@plafond/import";

import { Relocation } from "../components/Relocation";
import type { RelocationWorld } from "../lib/relocation-flow";

import table from "../../../db/seed/commune-zones.csv?raw";
import sources from "../../../db/seed/zone-lists.json?raw";
import rules from "../../../db/seed/relocation-rules.json?raw";
import irl from "../../../db/seed/irl.json?raw";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const world: RelocationWorld = {
    communes: zonesOf(table).filter((row) => ["94080", "93066"].includes(row.code)),
    lists: zoneListsOf(JSON.parse(sources)),
    capped: ["93066"],
    periods: relocationRulesOf(JSON.parse(rules)),
    index: indexOf(JSON.parse(irl)).rows,
};
const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
    window.history.replaceState(null, "", "/");
});

async function open(search: string): Promise<HTMLElement>
{
    window.history.replaceState(null, "", `/relocation/${search}`);
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<Relocation world={world} />);
    });

    return host;
}

const chosen = (host: HTMLElement) => host.querySelector<HTMLSelectElement>("#commune")!.value;

test("a link naming Saint-Denis chooses it, and a code the list does not hold leaves the choice to the tenant", async () =>
{
    expect(chosen(await open("?commune=93066"))).toBe("93066");
    expect(chosen(await open("?commune=99999"))).toBe("");
});

test("ticking a first letting takes away the questions on the last rent, and an F or G dwelling those on the decree", async () =>
{
    const host = await open("?commune=94080");
    const tick = async (name: string, value: string) =>
    {
        await act(async () =>
        {
            host.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.click();
        });
    };

    await tick("first", "yes");
    expect(host.querySelector('input[name="dpe"]')).toBeNull();

    await tick("first", "no");
    await tick("dpe", "F");
    expect(host.querySelector("#lastRent")).not.toBeNull();
    expect(host.querySelector('input[name="vacancy"]')).toBeNull();
});
