/// <reference types="vite/client" />
import { expect, test } from "vitest";

import stylesheet from "../app/globals.css?raw";

// The bug this guards: the badge of the DPE class took the name .label, already the class of every form label, and turned
// each label and question into a 48 pixel square whose text spilled over the choices around it and took their taps.
test("no class is given two rules at the top of the stylesheet, so one component cannot restyle another", () =>
{
    const selectors = [...stylesheet.matchAll(/(?:^|\n)([^\s{}@][^{}]*?)\n\{/g)].map((rule) => rule[1]!.trim());
    const names = selectors.filter((selector) => /^\.[\w-]+$/.test(selector));
    const twice = names.filter((name, index) => names.indexOf(name) !== index);

    expect(names.length).toBeGreaterThan(20);
    expect(twice).toEqual([]);
});
