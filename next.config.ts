import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
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
};

// Without SENTRY_AUTH_TOKEN (an org-level CI/build credential, separate from the DSN — not set up
// yet), this plugin silently skips the source-map upload step and the build behaves exactly like
// vanilla next.config.ts. Stack traces will show minified code in Sentry until that token is added.
export default withSentryConfig(nextConfig, {
  silent: true,
});
