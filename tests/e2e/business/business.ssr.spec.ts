import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { fetchRawHtml } from "../helpers/ssr";
import { trackRequestsTo } from "../helpers/network";

const { business } = TEST_DATA;

/**
 * SSR acceptance tests for the business page — written AHEAD of the SSR implementation (see
 * ssr.md), so they currently fail. That's expected and correct: `business/[slug]/page.tsx` is
 * still `"use client"` today, so the raw server response is a near-empty shell and a missing
 * business currently returns HTTP 200 with a client-rendered "not found" message (a soft 404).
 * These tests turn green once the server-shell conversion lands, and from then on guard against
 * regressing back to client-only rendering.
 */
test.describe("Business detail page — SSR (pre-implementation, expected to fail until SSR ships)", () => {
  test("initial HTML contains the business name before any client JS runs", async ({ request }) => {
    const { status, body } = await fetchRawHtml(request, `/business/${business.slug}`);
    expect(status).toBe(200);
    expect(body).toContain(business.name);
  });

  test("initial HTML contains meaningful address/location content", async ({ request }) => {
    const { body } = await fetchRawHtml(request, `/business/${business.slug}`);
    expect(body).toMatch(/Bengaluru|Bangalore/i);
  });

  test("nonexistent business returns a real HTTP 404, not a soft 404", async ({ request }) => {
    const { status, body } = await fetchRawHtml(request, `/business/${TEST_DATA.nonexistentBusinessSlug}`);
    expect(status).toBe(404);
    // A soft-404 would return 200 with this same text — the status check above is the real
    // assertion; this just confirms the 404 page itself still communicates "not found".
    expect(body).toMatch(/not found|doesn't exist/i);
  });

  test("no duplicate client-side fetch for data already present in the server-rendered HTML", async ({ page }) => {
    const getBusinessRequests = trackRequestsTo(page, "/api/v1/businesses/");
    await page.goto(`/business/${business.slug}`);
    await page.waitForLoadState("networkidle");

    // Today (pre-SSR) this is expected to be exactly 1 — the single client-side fetch that
    // currently loads the page. Once SSR ships, the goal is that this stays at 0 or 1 (a
    // background revalidation is fine; a second *redundant* fetch of the same data is not).
    expect(getBusinessRequests().length).toBeLessThanOrEqual(1);
  });
});
