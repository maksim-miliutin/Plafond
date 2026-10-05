import type { MetadataRoute } from "next";

import { pages, siteUrl } from "../lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap
{
    return pages.map((page) => ({ url: `${siteUrl}/${page.path}` }));
}
