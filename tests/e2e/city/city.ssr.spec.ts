import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { fetchRawHtml } from "../helpers/ssr";

const { city } = TEST_DATA;

/**
 * Written ahead of the SSR implementation — expected to fail until city/[slug]/page.tsx is
 * converted to a server shell (see ssr.md). See business.ssr.spec.ts for the full rationale.
 */
test.describe("City page — SSR (pre-implementation, expected to fail until SSR ships)", () => {
  test("initial HTML contains the city name before any client JS runs", async ({ request }) => {
    const { status, body } = await fetchRawHtml(request, `/city/${city.slug}`);
    expect(status).toBe(200);
    expect(body).toContain(city.name);
  });

  test("initial HTML contains at least one real business listing link", async ({ request }) => {
    const { body } = await fetchRawHtml(request, `/city/${city.slug}`);
    expect(body).toMatch(/href="\/business\//);
  });

  test("nonexistent city returns a real HTTP 404", async ({ request }) => {
    const { status } = await fetchRawHtml(request, `/city/${TEST_DATA.nonexistentCitySlug}`);
    expect(status).toBe(404);
  });
});
