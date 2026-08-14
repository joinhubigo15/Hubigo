import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/json-ld";

// Only 3 justified Disallow rules, per the crawl audit: /admin/ (already redirect-protected by
// middleware.ts, this just saves wasted crawl attempts), /business-dashboard/ (private, has no
// server-side protection today — this is a real gap being closed here), and /api/ (Next.js route
// handlers, pure JSON, zero HTML/SEO value). Everything else — including the pSEO 1-15 noindex
// band, /search, business/category/city/area pages — stays crawlable: robots.txt can't do
// per-page logic and would also block crawling/link-equity flow if used for that. Page-level
// indexability is handled entirely via each page's own `robots` metadata (see
// app/lib/pseo-thresholds.ts's pseoRobotsMeta), not here.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/business-dashboard/", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
