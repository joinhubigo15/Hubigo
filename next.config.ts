import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/_next/image",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
        ],
      },
    ];
  },
};

// Without SENTRY_AUTH_TOKEN (an org-level CI/build credential, separate from the DSN — not set up
// yet), this plugin silently skips the source-map upload step and the build behaves exactly like
// vanilla next.config.ts. Stack traces will show minified code in Sentry until that token is added.
export default withSentryConfig(nextConfig, {
  silent: true,
});
