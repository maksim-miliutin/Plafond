// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { HomeMap } from "../components/HomeMap";
import type { Drawing } from "../lib/home-map";
import { homeMaps } from "./fixtures";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const region: Drawing = {
    width: 600,
    height: 500,
    shapes: [
        { name: "Massy", d: "M10,10L20,10L20,20Z", kind: "plain", group: "plain", page: "ailleurs/", code: "91377", zone: "tense", tense: true, department: "91", tinted: true },
        { name: "Barbizon", d: "M30,10L40,10L40,20Z", kind: "plain", group: "plain", page: "ailleurs/", code: "77022", zone: "tense", tense: false, department: "77" },
    ],
    borders: "",
    outline: "",
    city: "M0,0Z",
    labels: [],
    focus: { x: 240, y: 180, w: 120, h: 80 },
};
const hosts: HTMLElement[] = [];
const fetched: string[] = [];
const realFetch = globalThis.fetch;

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
    globalThis.fetch = realFetch;
    fetched.length = 0;
});

async function openRegion(answer: () => Promise<Response>): Promise<HTMLElement>
{
    globalThis.fetch = ((url: string) =>
    {
        fetched.push(url);
        return answer();
    }) as typeof fetch;
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<HomeMap maps={homeMaps} />);
    });
    await act(async () =>
    {
        host.querySelector<HTMLButtonElement>("#map-tab-ile-de-france")!.click();
    });

    return host;
}

async function touch(host: HTMLElement, name: string): Promise<void>
{
    const path = [...host.querySelectorAll("path.shape")].find((one) => one.querySelector("title")?.textContent === name)!;
    await act(async () =>
    {
        path.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
}

test("the plan of the region is fetched only when its tab opens, and a touch tells the commune's department and checks", async () =>
{
    const host = await openRegion(async () => new Response(JSON.stringify(region)));

    expect(fetched).toEqual(["ile-de-france-map.json"]);
    expect(host.querySelectorAll("path.shape")).toHaveLength(2);
    expect(host.querySelector("path.shape.tinted title")?.textContent).toBe("Massy");

    await touch(host, "Massy");
    expect(host.querySelector(".map-card")?.textContent).toContain("Essonne (91)");
    expect(host.querySelector<HTMLAnchorElement>('.map-card a[href="preavis/?commune=91377"]')).not.toBeNull();

    await touch(host, "Barbizon");
    expect(host.querySelector(".map-card")?.textContent).toContain("Hors zone tendue pour le préavis");
    expect(host.querySelector('.map-card a[href^="relocation/"]')).toBeNull();
});

test("when the plan cannot load, the panel says so and leads to the search by name", async () =>
{
    const host = await openRegion(async () => new Response("", { status: 404 }));

    expect(host.querySelector(".map-wait")?.textContent).toContain("Le plan n'a pas pu se charger.");
    expect(host.querySelector<HTMLAnchorElement>(".map-wait a")?.getAttribute("href")).toBe("ile-de-france/");
});

test("the Grand Paris button frames the middle of the region, and the whole region comes back", async () =>
{
    const host = await openRegion(async () => new Response(JSON.stringify(region)));
    const viewBox = () => host.querySelector("svg")!.getAttribute("viewBox");
    const button = (name: string) => [...host.querySelectorAll<HTMLButtonElement>(".map-zoom button")].find((one) => one.textContent === name || one.getAttribute("aria-label") === name)!;

    expect(viewBox()).toBe("0 0 600 500");
    expect(button("Toute la région").disabled).toBe(true);
    await act(async () => button("Grand Paris").click());
    expect(viewBox()).not.toBe("0 0 600 500");
    expect(host.querySelector("svg")!.getAttribute("class")).toBe("zoomed");

    await act(async () => button("Toute la région").click());
    expect(viewBox()).toBe("0 0 600 500");
    await act(async () => button("Agrandir").click());
    expect(viewBox()).toBe("150 125 300 250");
});
