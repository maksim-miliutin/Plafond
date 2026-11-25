// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";

import type { TileLayer } from "leaflet";

import { CityMap } from "../components/CityMap";
import type { CityMapArea } from "../lib/map";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const { layers } = vi.hoisted(() => ({ layers: [] as TileLayer[] }));

vi.mock("leaflet", async (importOriginal) =>
{
    const real = (await importOriginal<{ default: typeof import("leaflet") }>()).default;
    const tileLayer = (...given: Parameters<typeof real.tileLayer>) =>
    {
        const layer = real.tileLayer(...given);
        layers.push(layer);

        return layer;
    };

    return { default: { ...real, tileLayer } };
});

const paris: CityMapArea[] = [
    { rings: [[[2.34, 48.86], [2.345, 48.86], [2.345, 48.865], [2.34, 48.865], [2.34, 48.86]]], territory: "paris" },
];
const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
    layers.splice(0);
});

async function drawn(): Promise<{ host: HTMLElement; tiles: TileLayer }>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<CityMap areas={paris} label="Plan de Paris" />);
    });
    await vi.waitFor(() => expect(layers).toHaveLength(1));

    return { host, tiles: layers[0]! };
}

// The IGN server can fail while Leaflet itself loads, and the plan then showed bare outlines with no word of why.
test("when the IGN plan sends no tile, the outlines stay and the page sends the tenant to the list below", async () =>
{
    const { host, tiles } = await drawn();

    await act(async () =>
    {
        tiles.fire("tileerror");
        tiles.fire("load");
    });

    expect(host.querySelector('[role="status"]')?.textContent).toBe("Le fond de plan IGN ne s'est pas chargé : seuls les contours s'affichent. Rechargez la page, ou passez par la liste plus bas.");
    expect(host.querySelector(".city-map")).not.toBeNull();
});

test("a plan whose tiles arrive, even after a failed one, adds no warning", async () =>
{
    const { host, tiles } = await drawn();

    await act(async () =>
    {
        tiles.fire("tileerror");
        tiles.fire("tileload");
        tiles.fire("load");
    });

    expect(host.querySelector('[role="status"]')).toBeNull();
    expect(host.querySelector(".city-map")).not.toBeNull();
});
