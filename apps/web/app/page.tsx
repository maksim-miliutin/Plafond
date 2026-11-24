import { Home } from "../components/Home";
import { outlinesFromDisk } from "../lib/disk";
import { silhouette } from "../lib/map";
import { pageMetadata, siteUrl } from "../lib/site";

export const metadata = pageMetadata("");

export default function Start()
{
    const outlines = outlinesFromDisk();

    const site = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Plafond",
        url: `${siteUrl}/`,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site).replace(/</g, "\\u003c") }} />
            <Home shapes={{ paris: silhouette(outlines.paris, 32), lyon: silhouette(outlines.lyon, 32) }} />
        </>
    );
}
