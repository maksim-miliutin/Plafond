// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import type { Listing } from "@plafond/ademe";

import { Energie, type EnergyNeeds } from "../components/Energie";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const g: Listing = {
    dpe: { number: "2375E0345814N", label: "G", establishedOn: "2023-02-02", validUntil: "2033-02-01" },
    address: "7 Place du Panthéon 75005 Paris",
    surface: 7320,
    floor: 4,
    detail: null,
    electric: true,
};

function needs(change: Partial<EnergyNeeds> = {}): EnergyNeeds
{
    return {
        geocoder: { locate: async () => ({ kind: "located", id: "75105_7034_00007", label: g.address, point: { lon: 2.346, lat: 48.846 } }) },
        source: { byNumber: async () => [g], atAddress: async () => [g] },
        now: () => new Date("2026-10-03T10:00:00Z"),
        ...change,
    };
}

const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
});

async function open(given: EnergyNeeds): Promise<HTMLElement>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<Energie needs={given} />);
    });

    return host;
}

async function act_(work: () => void): Promise<void>
{
    await act(async () =>
    {
        work();
    });
}

const heading = (host: HTMLElement) => host.querySelector("h1")?.textContent ?? "";

test("an address leads to its diagnoses, the lease, the findings and the letter", async () =>
{
    const host = await open(needs());

    host.querySelector<HTMLInputElement>("#dpe-search")!.value = "7 place du Panthéon";
    await act_(() => host.querySelector("form")!.requestSubmit());
    expect(heading(host)).toBe("Lequel est votre logement ?");

    await act_(() => host.querySelector<HTMLButtonElement>("button.listing")!.click());
    expect(heading(host)).toBe("Ce que dit votre bail");

    host.querySelector<HTMLInputElement>("#signedOn")!.value = "2023-03-01";
    host.querySelector<HTMLInputElement>('input[name="furnished"][value="no"]')!.checked = true;
    host.querySelector<HTMLInputElement>('input[name="landlord"][value="person"]')!.checked = true;
    host.querySelector<HTMLInputElement>('input[name="raised"][value="yes"]')!.checked = true;
    host.querySelector<HTMLInputElement>("#raisedOn")!.value = "2024-03-01";
    await act_(() => host.querySelector("form")!.requestSubmit());
    expect(heading(host)).toContain("Logement classé G");

    const write = [...host.querySelectorAll("button")].find((button) => button.textContent?.includes("Préparer la lettre"))!;
    await act_(() => write.click());
    expect(heading(host)).toBe("Votre lettre au propriétaire");
    expect(host.textContent).toContain("je vous mets en demeure de renoncer à l'augmentation de loyer");
});

test("a search that finds nothing stays on the first screen and says why", async () =>
{
    const host = await open(needs({ source: { byNumber: async () => [], atAddress: async () => [] } }));

    host.querySelector<HTMLInputElement>("#dpe-search")!.value = "7 place du Panthéon";
    await act_(() => host.querySelector("form")!.requestSubmit());

    expect(host.querySelector("#dpe-search-error")?.textContent).toContain("Aucun DPE");
});
