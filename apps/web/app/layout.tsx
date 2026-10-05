import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@fontsource/atkinson-hyperlegible/400.css";
import "@fontsource/atkinson-hyperlegible/700.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "./globals.css";

import { navy } from "../lib/brand";

export const metadata: Metadata = {
    title: "Plafond",
    description: "Vérifiez si votre loyer à Paris dépasse le plafond légal.",
    appleWebApp: { capable: true, title: "Plafond", statusBarStyle: "default" },
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    themeColor: navy,
};

export default function RootLayout({ children }: { children: ReactNode })
{
    return (
        <html lang="fr">
            <body>
                {children}
            </body>
        </html>
    );
}
