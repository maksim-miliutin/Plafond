// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { Decompte } from "../components/Decompte";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const hosts: HTMLElement[] = [];

afterEach(() =>
{
    hosts.splice(0).forEach((host) => host.remove());
});

async function press(host: HTMLElement, label: string): Promise<void>
{
    const button = [...host.querySelectorAll("button")].find((candidate) => candidate.textContent?.includes(label));
    expect(button, label).toBeDefined();
    await act(async () =>
    {
        button!.click();
    });
}

test("a statement typed in leads to what was charged wrongly, the letter and back", async () =>
{
    const host = document.createElement("div");
    document.body.append(host);
    hosts.push(host);
    await act(async () =>
    {
        createRoot(host).render(<Decompte needs={{ now: () => new Date("2026-03-01T10:00:00Z") }} />);
    });

    const values: [string, string][] = [
        ["address", "12 Rue des Lilas 69003 Lyon"],
        ["year", "2024"],
        ["receivedOn", "2026-02-10"],
        ["provisions", "900"],
        ["amount-water", "300"],
        ["amount-insurance", "150"],
        ["amount-manager-fees", "200"],
        ["amount-caretaker", "400"],
        ["amount-waste-tax", "180"],
    ];
    for (const [id, value] of values)
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value;
    }

    host.querySelector<HTMLInputElement>('input[name="caretaker"][value="one"]')!.checked = true;
    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
    expect(host.querySelector("h1")?.textContent).toContain("facturés à tort");
    expect(host.querySelector("h1")?.textContent).toContain("590,00");

    await press(host, "Préparer la lettre");
    expect(host.textContent).toContain("Lyon, le 1er mars 2026");

    await press(host, "Retour au résultat");
    await press(host, "Modifier les réponses");
    expect(host.querySelector<HTMLInputElement>("#amount-insurance")!.value).toBe("150");
});
