import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/json-ld";

export default function robots(): MetadataRoute.Robots {
  const disallowedPaths = [
    "/admin/",
    "/business-dashboard/",
    "/api/",
    "/login",
    "/register",
    "/verify-email",
    "/account-suspended",
    "/messages",
    "/saved",
    "/profile",
    "/compare",
    "/oauth/",
    "/_next/image",
    "/_next/data/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: disallowedPaths,
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "Google-Extended",
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

