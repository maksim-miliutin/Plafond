// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import { Preavis } from "../components/Preavis";

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
        createRoot(host).render(<Preavis needs={{ now: () => new Date("2027-03-10T10:00:00Z") }} />);
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

test("a filled form leads to the notice, the letter dated today, and back", async () =>
{
    const host = await open();

    for (const [id, value] of [["address", "12 Rue des Lilas 69003 Lyon"], ["rent", "1 200"], ["receivedOn", "2027-03-15"]])
    {
        host.querySelector<HTMLInputElement>(`#${id}`)!.value = value!;
    }

    for (const [name, value] of [["furnished", "no"], ["tense", "yes"]])
    {
        host.querySelector<HTMLInputElement>(`input[name="${name}"][value="${value}"]`)!.checked = true;
    }

    await act(async () =>
    {
        host.querySelector("form")!.requestSubmit();
    });
    expect(heading(host)).toBe("Un mois de préavis");
    expect(host.textContent).toContain("prend fin le 15 avril 2027 à minuit, si le propriétaire reçoit votre lettre le 15 mars 2027");

    await press(host, "Préparer la lettre de congé");
    expect(heading(host)).toBe("Votre lettre au propriétaire");
    expect(host.textContent).toContain("Lyon, le 10 mars 2027");
    expect(host.textContent).toContain("congé du logement");

    await press(host, "Retour au résultat");
    await press(host, "Modifier les réponses");
    expect(host.querySelector<HTMLInputElement>("#rent")!.value).toBe("1 200");
});
