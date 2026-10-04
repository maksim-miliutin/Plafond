// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { Caution } from "../components/Caution";

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
        createRoot(host).render(<Caution needs={{ now: () => new Date("2026-10-03T10:00:00Z") }} />);
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

test("a filled form leads to what is owed, the letter and back", async () =>
{
    const host = await open();

    for (const [id, value] of [["address", "12 Rue des Lilas 69003 Lyon"], ["rent", "1 200"], ["paid", "1 200"], ["keysOn", "2026-07-01"]])
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value!;
    }

    for (const [name, value] of [["furnished", "no"], ["conforming", "yes"], ["addressGiven", "yes"]])
    {
        host.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked = true;
    }

    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
    expect(heading(host)).toContain("vous sont dus");
    expect(heading(host)).toContain("1\u202F560,00");

    await press(host, "Préparer la lettre");
    expect(heading(host)).toBe("Votre lettre au propriétaire");
    expect(host.textContent).toContain("Lyon, le 3 octobre 2026");

    await press(host, "Retour au résultat");
    await press(host, "Modifier les réponses");
    expect(host.querySelector<HTMLInputElement>("#rent")!.value).toBe("1 200");
});
