import type { MetadataRoute } from "next";

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
        background_color: "#F3F4F1",
        theme_color: "#F3F4F1",
        icons: [
            { src: "icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}
