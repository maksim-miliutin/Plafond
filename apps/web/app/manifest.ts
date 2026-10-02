import type { MetadataRoute } from "next";

import { navy } from "../lib/brand";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest
{
    return {
        name: "Plafond",
        short_name: "Plafond",
        description: "Vérifiez si votre loyer à Paris dépasse le plafond légal.",
        lang: "fr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: navy,
        theme_color: navy,
        icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}
