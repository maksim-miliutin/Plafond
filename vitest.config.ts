import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        conditions: ["source", ...defaultClientConditions],
    },
    test: {
        // Without this vitest hands every stylesheet over as empty text, and the palette test would read nothing.
        css: { include: [/globals\.css/] },
    },
    ssr: {
        resolve: {
            conditions: ["source"],
        },
    },
});
