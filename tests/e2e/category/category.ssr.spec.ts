import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { fetchRawHtml } from "../helpers/ssr";

const { category } = TEST_DATA;

/**
 * Written ahead of the SSR implementation — expected to fail until category/[slug]/page.tsx is
 * converted to a server shell (see ssr.md). See business.ssr.spec.ts for the full rationale.
 */
test.describe("Category page — SSR (pre-implementation, expected to fail until SSR ships)", () => {
  test("initial HTML contains the category name before any client JS runs", async ({ request }) => {
    const { status, body } = await fetchRawHtml(request, `/category/${category.slug}`);
    expect(status).toBe(200);
    expect(body).toContain(category.name);
  });

  test("initial HTML contains at least one real business listing link", async ({ request }) => {
    const { body } = await fetchRawHtml(request, `/category/${category.slug}`);
    expect(body).toMatch(/href="\/business\//);
  });

  test("nonexistent category returns a real HTTP 404", async ({ request }) => {
    const { status } = await fetchRawHtml(request, `/category/${TEST_DATA.nonexistentCategorySlug}`);
    expect(status).toBe(404);
  });
});
