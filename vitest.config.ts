import { defaultClientConditions } from "vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
    resolve: {
        conditions: ["source", ...defaultClientConditions],
    },
    ssr: {
        resolve: {
            conditions: ["source"],
        },
    },
});
