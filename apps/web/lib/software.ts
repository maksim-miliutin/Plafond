export interface Software
{
    name: string;
    licence: string;
    files: readonly string[];  // licence texts inside node_modules, copied whole into the licence file
}

// Read off the browser source maps and the media of a production build: the code and fonts other people wrote that the site ships.
export const software: readonly Software[] = [
    { name: "Next.js", licence: "MIT", files: ["next/license.md"] },
    {
        name: "React, React DOM, React Server DOM et Scheduler, livrés avec Next.js",
        licence: "MIT",
        files: [
            "next/dist/compiled/react/LICENSE",
            "next/dist/compiled/react-dom/LICENSE",
            "next/dist/compiled/react-server-dom-turbopack/LICENSE",
            "next/dist/compiled/scheduler/LICENSE",
        ],
    },
    { name: "process, livré avec Next.js", licence: "MIT", files: ["next/dist/compiled/process/LICENSE"] },
    { name: "@swc/helpers", licence: "Apache 2.0", files: ["@swc/helpers/LICENSE"] },
    { name: "Leaflet", licence: "BSD à 2 clauses", files: ["leaflet/LICENSE"] },
    { name: "Atkinson Hyperlegible", licence: "SIL Open Font License 1.1", files: ["@fontsource/atkinson-hyperlegible/LICENSE"] },
    { name: "Barlow Condensed", licence: "SIL Open Font License 1.1", files: ["@fontsource/barlow-condensed/LICENSE"] },
    { name: "Source Serif 4", licence: "SIL Open Font License 1.1", files: ["@fontsource/source-serif-4/LICENSE"] },
];

export const licencesFile = "licences.txt";

export function licencesText(read: (file: string) => string): string
{
    return software
        .flatMap((item) => item.files.map((file) => `${item.name}\n${file}\n\n${read(file).trim()}\n`))
        .join(`\n${"=".repeat(72)}\n\n`);
}
