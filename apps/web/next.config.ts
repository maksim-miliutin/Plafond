import type { NextConfig } from "next";

// GitHub Pages serves a project under /<repository>; the deploy passes that prefix, local runs leave it empty.
const config: NextConfig = {
    output: "export",
    basePath: process.env.PAGES_BASE_PATH ?? "",
    trailingSlash: true,
    env: { NEXT_PUBLIC_SITE_ROOT: process.env.PAGES_BASE_PATH ?? "", NEXT_PUBLIC_SITE_URL: process.env.PAGES_BASE_URL ?? "http://localhost:3000" },
};

export default config;
