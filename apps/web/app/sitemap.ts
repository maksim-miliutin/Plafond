import type { MetadataRoute } from "next";

import { fromDisk } from "../lib/disk";
import { pages, siteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap
{
    return [
        ...pages.map((page) => ({ url: `${siteUrl}/${page.path}` })),
        ...fromDisk().districts.map((district) => ({ url: `${siteUrl}/arrondissements/${district.slug}/` })),
        ...fromDisk().places.map((place) => ({ url: `${siteUrl}/quartiers/${place.slug}/` })),
    ];
}
