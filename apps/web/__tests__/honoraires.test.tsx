// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import type { FeeCaps } from "@plafond/domain";

import { Honoraires } from "../components/Honoraires";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const caps: FeeCaps[] = [
    {
        from: "2026-01-01",
        until: "2027-01-01",
        letting: { "very-tense": 1210, tense: 1009, other: 807 },
        inspection: 303,
        title: "Arrêté du 17 juillet 2025",
        url: "https://example.org/caps",
    },
];
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
        createRoot(host).render(<Honoraires caps={caps} needs={{ now: () => new Date("2026-10-11T10:00:00Z") }} />);
    });

    return host;
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

const heading = (host: HTMLElement) => host.querySelector("h1")?.textContent ?? "";

test("a filled form leads to the sum over the caps, the letter to the agency, and back", async () =>
{
    const host = await open();

    for (const [id, value] of [["address", "4 Place du Louvre 75001 Paris"], ["surface", "42,5"], ["signedOn", "2026-03-01"], ["letting", "800"], ["inspection", "150"]])
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value!;
    }

    host.querySelector<HTMLInputElement>('input[name="zone"][value="very-tense"]')!.checked = true;
    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
    expect(heading(host)).toContain("306,97");

    await press(host, "Préparer la lettre à l'agence");
    expect(heading(host)).toBe("Votre lettre à l'agence");
    expect(host.querySelector("article")?.getAttribute("aria-label")).toBe("Lettre à l'agence");
    expect(host.textContent).toContain("Paris, le 11 octobre 2026");
    expect(host.textContent).toContain("[Nom de l'agence]");

    await press(host, "Retour au résultat");
    await press(host, "Modifier les réponses");
    expect(host.querySelector<HTMLInputElement>("#letting")!.value).toBe("800");
});
