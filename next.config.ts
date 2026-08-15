import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
      },
      {
        // Cloudflare R2 "business" bucket (backend/.env's R2_BUSINESS_BUCKET_URL) — hosts every
        // business cover/gallery/logo image and the static city hero images.
        protocol: "https",
        hostname: "pub-7ff0fd1aef1643d39fabab82a94d5d66.r2.dev",
      },
      {
        // Cloudflare R2 "profile-pics" bucket (backend/.env's R2_PROFILE_PICS_BUCKET_URL) —
        // hosts the homepage hero artwork alongside user avatars.
        protocol: "https",
        hostname: "pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev",
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
