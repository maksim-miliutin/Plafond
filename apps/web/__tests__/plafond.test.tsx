// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import type { Quartier } from "@plafond/domain";
import type { Lookup } from "@plafond/address";

import { Plafond, type Needs } from "../components/Plafond";
import { rate } from "./fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const side = 0.005;
const square = (number: number, name: string, west: number): Quartier => ({
    number,
    name,
    rings: [[[west, 48.86], [west + side, 48.86], [west + side, 48.865], [west, 48.865], [west, 48.86]]],
});

const found: Lookup = { kind: "located", id: "75101_5925_00004", label: "4 Place du Louvre 75001 Paris", point: { lon: 2.3425, lat: 48.8625 } };

function needs(change: Partial<Needs> = {}, lookup: Lookup = found): Needs
{
    return {
        geocoder: { locate: async () => lookup },
        tables: async () => ({ rates: [rate], quartiers: [square(1, "Saint-Germain-l'Auxerrois", 2.34), square(2, "Halles", 2.345)] }),
        now: () => new Date("2026-09-29T10:00:00Z"),
        ...change,
    };
}

const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
});

async function open(given: Needs): Promise<HTMLElement>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<Plafond needs={given} />);
    });

    return host;
}

async function search(host: HTMLElement, typed: string): Promise<void>
{
    host.querySelector<HTMLInputElement>("#address")!.value = typed;
    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
}

async function press(host: HTMLElement, label: string): Promise<void>
{
    const button = [...host.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(label));
    expect(button, label).toBeDefined();
    await act(async () =>
    {
        button!.click();
    });
}

async function answer(host: HTMLElement): Promise<void>
{
    for (const [name, value] of [["rooms", "3"], ["period", "1946-1970"], ["furnished", "yes"], ["stated", "yes"]])
    {
        host.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked = true;
    }

    for (const [id, value] of [["surface", "40"], ["rent", "1 500"], ["signedOn", "2025-09-01"], ["startsOn", "2025-09-01"]])
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value!;
    }

    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
}

const heading = (host: HTMLElement) => host.querySelector("h1")?.textContent ?? "";

test("an address leads to its quartier, the lease, the result and the letter", async () =>
{
    const host = await open(needs());

    await search(host, "4 place du louvre");
    expect(heading(host)).toContain("Saint-Germain-l'Auxerrois");

    await press(host, "C'est bien ça");
    expect(heading(host)).toBe("Ce que dit votre bail");

    await answer(host);
    expect(heading(host)).toContain("220,00");

    await press(host, "Préparer la lettre");
    expect(heading(host)).toBe("Votre lettre au propriétaire");
    expect(host.textContent).toContain("4 Place du Louvre 75001 Paris");
});

test("going back from the letter retraces every step to the address, still typed", async () =>
{
    const host = await open(needs());

    await search(host, "4 place du louvre");
    await press(host, "C'est bien ça");
    await answer(host);
    await press(host, "Préparer la lettre");
    await press(host, "Retour au résultat");
    expect(heading(host)).toContain("220,00");

    await press(host, "Modifier le bail");
    expect(host.querySelector<HTMLInputElement>("#rent")!.value).toBe("1 500");

    await press(host, "Retour au quartier");
    await press(host, "Corriger l'adresse");
    expect(host.querySelector<HTMLInputElement>("#address")!.value).toBe("4 place du louvre");
});

test("a search the geocoder cannot answer stays on the address and says why", async () =>
{
    const host = await open(needs({}, { kind: "unreachable" }));

    await search(host, "4 place du louvre");

    expect(host.querySelector("#address-error")?.textContent).toContain("géocodage ne répond pas");
});

test("tables that do not load are said so instead of leaving a screen that cannot work", async () =>
{
    const host = await open(needs({ tables: async () => ({ kind: "unreachable" }) }));

    expect(heading(host)).toContain("indisponible");
});

test("the check is made on the day it is in Paris by the clock given", async () =>
{
    const host = await open(needs({ now: () => new Date("2026-09-28T22:30:00Z") }));

    await search(host, "4 place du louvre");
    await press(host, "C'est bien ça");
    await answer(host);
    await press(host, "Préparer la lettre");

    expect(host.textContent).toContain("Paris, le 29 septembre 2026");
});

test("free help opens from the result and leads back to it", async () =>
{
    const host = await open(needs());

    await search(host, "4 place du louvre");
    await press(host, "C'est bien ça");
    await answer(host);
    await press(host, "Trouver une aide gratuite");
    expect(heading(host)).toBe("Trouver une aide gratuite");
    expect(host.textContent).toContain("01 42 79 50 49");

    await press(host, "Retour au résultat");
    expect(heading(host)).toContain("220,00");
});
