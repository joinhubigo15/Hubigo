import { defineConfig, devices } from "@playwright/test";

// Same base URL pattern as app/lib/api.ts, so pointing this suite at staging/production later is
// a single env var, not a config change: PLAYWRIGHT_BASE_URL=https://staging.hubigo.com npm run test:e2e
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// Only starts (and only waits on) a local dev server when targeting localhost — pointing at a
// deployed baseURL should never try to spawn `npm run dev` locally.
const isLocalTarget = baseURL.includes("localhost") || baseURL.includes("127.0.0.1");

export default defineConfig({
  testDir: "./tests/e2e",
  // Also bumped for the same real backend-latency reason as expect.timeout below.
  timeout: 45_000,
  // Bumped from a more typical 5-8s: the backend currently queries a remote (Railway) Postgres
  // instance with observed single-request latency over 7s even for a zero-review business (see
  // final report's "testability problems discovered") — this is a real, current backend/network
  // characteristic being measured honestly, not padding to hide flakiness.
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  // Kept low even locally: Next.js dev mode compiles each route on-demand on its first request
  // (can take well over 10s cold), and several workers each cold-hitting a different route at
  // once compounds that against a single shared dev server. A small worker count trades a bit of
  // wall-clock time for not timing out on first-ever navigation to a route. Not a concern against
  // a real staging/production build, where routes are already compiled/cached.
  workers: process.env.CI ? 4 : 2,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // A dedicated mobile project is deliberately not added yet — Hubigo is mobile-first, but this
    // is the initial framework + a small proving set of tests, not full cross-viewport coverage.
    // Mobile-only UI (e.g. the business page's collapsible services accordion) is instead covered
    // by setting a mobile viewport on that one test via test.use({ viewport: ... }). Add a
    // "Mobile Chrome" project (devices["Pixel 5"]) here when expanding into the full regression
    // suite post-SEO.
  ],

  ...(isLocalTarget
    ? {
        webServer: {
          command: "npm run dev",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120_000,
        },
      }
    : {}),
});
