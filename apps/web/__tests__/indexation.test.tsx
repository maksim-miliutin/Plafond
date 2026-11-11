// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import type { IndexRow } from "@plafond/domain";

import { Indexation } from "../components/Indexation";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const index: IndexRow[] = [
    { year: 2025, quarter: 2, value: 14668, publishedOn: "2025-07-11" },
    { year: 2026, quarter: 2, value: 14837, publishedOn: "2026-07-10" },
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
        createRoot(host).render(<Indexation index={index} needs={{ now: () => new Date("2026-10-12T10:00:00Z") }} />);
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

test("a filled form leads to what is too much each month, the letter, and back", async () =>
{
    const host = await open();

    for (const [id, value] of [["address", "12 Rue des Lilas 69003 Lyon"], ["signedOn", "2025-07-20"], ["revisedOn", "2026-07-20"], ["rent", "600"], ["asked", "620"], ["askedOn", "2026-08-03"]])
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value!;
    }

    for (const [name, value] of [["clause", "yes"], ["quarter", "2"]])
    {
        host.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked = true;
    }

    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
    expect(heading(host)).toContain("13,09");

    await press(host, "Préparer la lettre au propriétaire");
    expect(heading(host)).toBe("Votre lettre au propriétaire");
    expect(host.textContent).toContain("Lyon, le 12 octobre 2026");
    expect(host.textContent).toContain("contestation de la révision du loyer");

    await press(host, "Retour au résultat");
    await press(host, "Modifier les réponses");
    expect(host.querySelector<HTMLInputElement>("#asked")!.value).toBe("620");
});
