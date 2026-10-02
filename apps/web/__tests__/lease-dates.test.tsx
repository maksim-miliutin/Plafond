// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";

import { LeaseStep } from "../components/LeaseStep";
import { questions, type LeaseFields } from "../lib/lease";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const blank = Object.fromEntries(Object.keys(questions).map((key) => [key, ""])) as unknown as LeaseFields;

test("a date is spelled out as soon as it is picked", async () =>
{
    const host = document.createElement("div");
    document.body.append(host);
    await act(async () =>
    {
        createRoot(host).render(<LeaseStep fields={blank} errors={{}} />);
    });

    const field = host.querySelector<HTMLInputElement>("#signedOn")!;
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () =>
    {
        setValue.call(field, "2025-01-09");
        field.dispatchEvent(new Event("input", { bubbles: true }));
    });

    expect(host.querySelector("#signedOn-read")?.textContent).toBe("Soit le 9 janvier 2025.");
    host.remove();
});
