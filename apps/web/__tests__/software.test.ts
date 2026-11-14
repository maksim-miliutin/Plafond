/// <reference types="vite/client" />
import { expect, test } from "vitest";

import { licencesText, software } from "../lib/software";

const texts = import.meta.glob(
    [
        "../../../node_modules/next/license.md",
        "../../../node_modules/next/dist/compiled/{react,react-dom,react-server-dom-turbopack,scheduler,process}/LICENSE",
        "../../../node_modules/@swc/helpers/LICENSE",
        "../../../node_modules/leaflet/LICENSE",
        "../../../node_modules/@fontsource/{atkinson-hyperlegible,barlow-condensed,source-serif-4}/LICENSE",
    ],
    { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const grants: Record<string, RegExp> = {
    "MIT": /\bMIT License\b/,
    "Apache 2.0": /Apache License\s+Version 2\.0/,
    "BSD à 2 clauses": /BSD 2-Clause License/,
    "SIL Open Font License 1.1": /SIL Open Font License, Version 1\.1/,
};

test("each licence the page names is the one its own text grants", () =>
{
    for (const item of software)
    {
        for (const file of item.files)
        {
            const text = texts[`../../../node_modules/${file}`];

            expect(text, file).toBeDefined();
            expect(text, file).toMatch(grants[item.licence]!);
        }
    }
});

test("the licence file copies every text whole, under the name of what it covers", () =>
{
    const whole = licencesText((file) => `text of ${file}`);

    for (const item of software)
    {
        for (const file of item.files)
        {
            expect(whole).toContain(`${item.name}\n${file}\n\ntext of ${file}\n`);
        }
    }
});
