import { expect, test } from "vitest";

import robots from "../app/robots";
import { siteUrl } from "../lib/site";

// robots.txt counts only at the root of a host: on leplafond.org it is the one crawlers read, and it points them to the sitemap.
test("robots.txt lets every page be crawled and names the sitemap at the site's own address", () =>
{
    expect(robots()).toEqual({ rules: { userAgent: "*", allow: "/" }, sitemap: `${siteUrl}/sitemap.xml` });
});
