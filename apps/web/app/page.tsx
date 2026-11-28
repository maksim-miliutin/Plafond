import { Home } from "../components/Home";
import { homeMapsFromDisk, regionFromDisk } from "../lib/disk";
import { departmentCounts } from "../lib/region";
import { pageMetadata, siteUrl } from "../lib/site";

export const metadata = pageMetadata("");

export default function Start()
{
    const { grandParis, lyon } = homeMapsFromDisk(0.7);

    const site = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Plafond",
        url: `${siteUrl}/`,
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site).replace(/</g, "\\u003c") }} />
            <Home maps={{ "grand-paris": grandParis, lyon }} departments={departmentCounts(regionFromDisk())} />
        </>
    );
}
