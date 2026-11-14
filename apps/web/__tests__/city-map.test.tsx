// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";

import { CityMap } from "../components/CityMap";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A tab left open across a deploy asks for a chunk the new site no longer has, and the map stayed a blank box.
vi.mock("leaflet", () =>
{
    throw new Error("the map chunk did not load");
});

test("when the map cannot load, the page says so and sends the tenant to the list below", async () =>
{
    const host = document.createElement("div");
    document.body.append(host);
    await act(async () =>
    {
        createRoot(host).render(<CityMap outlines={[]} label="Plan de Paris" />);
    });

    await vi.waitFor(() => expect(host.querySelector('[role="status"]')?.textContent).toBe("Le plan n'a pas pu s'afficher. Rechargez la page, ou passez par la liste plus bas."));
    expect(host.querySelector(".city-map")).toBeNull();
    host.remove();
});
