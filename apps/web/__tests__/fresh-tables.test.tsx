// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";

import { Plafond } from "../components/Plafond";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// The bug this guards: after the 2026 rents went out, a phone kept last year's table for ten minutes and refused a July lease.
test("every opening asks the server whether the tables changed, instead of trusting the browser's copy", async () =>
{
    const asked: [string, RequestInit | undefined][] = [];
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) =>
    {
        asked.push([url, init]);

        return { ok: false, status: 503, json: async () => ({}) };
    });

    const host = document.createElement("div");
    document.body.append(host);
    await act(async () =>
    {
        createRoot(host).render(<Plafond />);
    });

    expect(asked).toEqual(expect.arrayContaining([["rates.json", { cache: "no-cache" }], ["quartiers.json", { cache: "no-cache" }]]));
    vi.unstubAllGlobals();
    host.remove();
});
