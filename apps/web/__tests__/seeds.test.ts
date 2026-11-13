/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { seedsFrom } from "@plafond/import";

const files = import.meta.glob("../../../db/seed/*", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const sources = import.meta.glob(["../app/**/*.tsx", "../components/**/*.tsx", "../lib/**/*.ts", "../scripts/**/*.ts"], {
    query: "?raw",
    import: "default",
    eager: true,
}) as Record<string, string>;

test("the site names no rate table itself, so its pages and its check read the same ones", () =>
{
    const named: string[] = [];
    seedsFrom((name) =>
    {
        named.push(name);

        return files[`../../../db/seed/${name}`]!;
    });
    const elsewhere = Object.entries(sources).flatMap(([path, code]) => named.filter((name) => code.includes(name)).map((name) => `${path} names ${name}`));

    expect(named).toContain("lyon-decrees.json");
    expect(elsewhere).toEqual([]);
});
