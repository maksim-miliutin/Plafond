/// <reference types="vite/client" />
import { expect, test } from "vitest";

import * as domain from "@plafond/domain";

const sources = import.meta.glob(["../app/**/*.tsx", "../components/**/*.tsx", "../lib/**/*.ts", "../scripts/**/*.ts"], {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

// The brief counts domain logic the app cannot reach as a mistake. Error classes are thrown rather than called.
test("every function the domain offers is called from the app", () =>
{
    const code = Object.values(sources).join("\n").replace(/^import[^;]*;/gm, "");
    const unused = Object.keys(domain).filter((name) => !name.endsWith("Error") && !new RegExp(`\\b${name}\\b`).test(code));

    expect(Object.keys(sources).length).toBeGreaterThan(10);
    expect(unused).toEqual([]);
});
