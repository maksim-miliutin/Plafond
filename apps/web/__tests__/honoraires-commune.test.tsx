// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import type { FeeCaps } from "@plafond/domain";

import { Honoraires } from "../components/Honoraires";
import { packedRegion as communes, seededLists as lists } from "./zone-seeds";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const caps: FeeCaps[] = [
    { from: "2026-01-01", until: "2027-01-01", letting: { "very-tense": 1210, tense: 1009, other: 807 }, inspection: 303, title: "Arrêté", url: "https://example.org/caps" },
];
const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
    window.history.replaceState(null, "", "/");
});

async function open(search: string): Promise<HTMLElement>
{
    window.history.replaceState(null, "", `/frais-agence/${search}`);
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<Honoraires caps={caps} zones={{ communes, lists }} needs={{ now: () => new Date("2026-10-11T10:00:00Z") }} />);
    });

    return host;
}

const ticked = (host: HTMLElement) => host.querySelector<HTMLInputElement>('input[name="zone"]:checked')?.value ?? null;

async function type(host: HTMLElement, id: string, value: string): Promise<void>
{
    const field = host.querySelector<HTMLInputElement>(`#${id}`)!;
    await act(async () =>
    {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, value);
        field.dispatchEvent(new Event("input", { bubbles: true }));
    });
}

test("a link naming Vincennes ticks zone très tendue, and an unknown code leaves the zone to the tenant", async () =>
{
    expect(ticked(await open("?commune=94080"))).toBe("very-tense");
    expect(ticked(await open("?commune=12345"))).toBeNull();
});

test("the date of the lease decides: Alfortville is tense on 25 June 2026, very tense from 26 June, unknown in 2025", async () =>
{
    const host = await open("?commune=94002");
    await type(host, "signedOn", "2026-06-25");
    expect(ticked(host)).toBe("tense");

    await type(host, "signedOn", "2026-06-26");
    expect(ticked(host)).toBe("very-tense");

    await type(host, "signedOn", "2025-11-01");
    expect(ticked(host)).toBeNull();
    expect(host.textContent).toContain("Plafond n'a pas les listes de l'époque");
});

test("a zone the tenant picks stays theirs when the date changes", async () =>
{
    const host = await open("?commune=94080");
    const tense = host.querySelector<HTMLInputElement>('input[name="zone"][value="tense"]')!;
    await act(async () =>
    {
        tense.click();
    });
    await type(host, "signedOn", "2026-03-01");

    expect(ticked(host)).toBe("tense");
});
