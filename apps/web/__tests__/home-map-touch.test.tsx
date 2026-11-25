// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { HomeMap } from "../components/HomeMap";
import { homeMaps } from "./fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
});

async function open(): Promise<HTMLElement>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<HomeMap maps={homeMaps} />);
    });

    return host;
}

async function touch(host: HTMLElement, name: string): Promise<void>
{
    const shape = [...host.querySelectorAll("path[data-shape]")].find((path) => path.querySelector("title")?.textContent === name);
    expect(shape, name).toBeDefined();
    await act(async () =>
    {
        shape!.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
}

const card = (host: HTMLElement) => host.querySelector(".map-card")!;
const links = (host: HTMLElement) => [...card(host).querySelectorAll("a")].map((link) => [link.getAttribute("href"), link.textContent]);

test("a commune without reference rents tells its zone and leads to the six checks", async () =>
{
    const host = await open();
    await touch(host, "Vincennes");

    expect(card(host).querySelector("strong")?.textContent).toBe("Vincennes");
    expect(card(host).textContent).toContain("Pas de loyer de référence dans cette commune.");
    expect(card(host).textContent).toContain("Zone très tendue");
    expect(links(host)).toEqual([["ailleurs/", "Les six vérifications"], ["grand-paris/", "Le Grand Paris commune par commune"]]);
    expect(host.querySelector(".picked title")?.textContent).toBe("Vincennes");
});

test("an arrondissement leads to the rent check and to its own reference rents", async () =>
{
    const host = await open();
    await touch(host, "Paris 11e");

    expect(card(host).textContent).toContain("Le loyer est encadré dans tout Paris.");
    expect(links(host)).toEqual([["loyer/", "Vérifier mon loyer"], ["arrondissements/paris-11e/", "Les loyers de référence de Paris 11e"]]);
});

test("the Lyon tab shows Lyon, forgets the touch made in Paris, and leads from an arrondissement to its page", async () =>
{
    const host = await open();
    await touch(host, "Montreuil");
    expect(links(host)[1]).toEqual(["grand-paris/est-ensemble/", "La page d'Est Ensemble"]);

    const tab = host.querySelector<HTMLButtonElement>("#map-tab-lyon")!;
    await act(async () =>
    {
        tab.click();
    });

    expect(tab.getAttribute("aria-selected")).toBe("true");
    expect(host.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby")).toBe("map-tab-lyon");
    expect(card(host).textContent).toContain("Touchez votre arrondissement, Villeurbanne ou votre commune");

    await touch(host, "Lyon 3e");
    expect(links(host)).toEqual([["loyer/", "Vérifier mon loyer"], ["lyon/lyon-3e-arrondissement/", "Les loyers de référence de Lyon 3e"]]);
});
