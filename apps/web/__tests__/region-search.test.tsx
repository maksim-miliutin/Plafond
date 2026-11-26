// @vitest-environment jsdom
/// <reference types="vite/client" />
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { metropoleOf } from "@plafond/import";

import { RegionSearch } from "../components/RegionSearch";
import { packRegion } from "../lib/region";
import { regionCommunes } from "./zone-seeds";

import list from "../../../db/seed/grand-paris-communes.csv?raw";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const metropole = metropoleOf(list);
const capped = metropole.filter((commune) => commune.territory !== null).map((commune) => commune.code);
const hosts: HTMLElement[] = [];

afterEach(() => hosts.splice(0).forEach((host) => host.remove()));

async function search(typed: string): Promise<HTMLElement>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<RegionSearch communes={packRegion(regionCommunes, metropole)} capped={capped} />);
    });
    const field = host.querySelector<HTMLInputElement>("#commune")!;
    await act(async () =>
    {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(field, typed);
        field.dispatchEvent(new Event("input", { bubbles: true }));
    });

    return host;
}

const links = (host: HTMLElement) => [...host.querySelectorAll<HTMLAnchorElement>(".region-results a")].map((link) => link.getAttribute("href"));

test("Massy offers the notice, the fees and the reletting rent, each with its code", async () =>
{
    expect(links(await search("Massy"))).toEqual(["../preavis/?commune=91377", "../frais-agence/?commune=91377", "../relocation/?commune=91377"]);
});

test("Barbizon, outside part 1 of the list, offers no reletting check; Montreuil adds the rent cap", async () =>
{
    expect(links(await search("Barbizon"))).toEqual(["../preavis/?commune=77022", "../frais-agence/?commune=77022"]);
    expect(links(await search("Montreuil"))[0]).toBe("../loyer/");
});

test("a short search lists twenty communes at most and asks for more letters", async () =>
{
    const host = await search("saint");

    expect(host.querySelectorAll(".region-results > li")).toHaveLength(20);
    expect(host.querySelector("#commune-count")?.textContent).toMatch(/^\d+ communes : les 20 premières/);
});
