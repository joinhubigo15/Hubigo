import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { trackPageErrors } from "../helpers/errors";

const { business } = TEST_DATA;

test.describe("Business detail page — content and interaction", () => {
  test("valid business page loads and shows the important content", async ({ page }) => {
    const getErrors = trackPageErrors(page);

    const response = await page.goto(`/business/${business.slug}`);
    expect(response?.status(), "business page should respond with 200").toBe(200);

    // Name, in the page's actual <h1> — not just "somewhere on the page".
    await expect(page.getByRole("heading", { level: 1, name: business.name })).toBeVisible();

    // Address text is real, business-specific content — proves this isn't a generic skeleton.
    await expect(page.getByText(/Bengaluru|Bangalore/i).first()).toBeVisible();

    expect(getErrors(), "no uncaught page errors during load").toEqual([]);
  });

  test("nonexistent business does not crash — shows a not-found state", async ({ page }) => {
    const getErrors = trackPageErrors(page);
    await page.goto(`/business/${TEST_DATA.nonexistentBusinessSlug}`);

    await expect(page.getByText(/not found|doesn't exist/i).first()).toBeVisible();
    expect(getErrors()).toEqual([]);
  });

  test("services accordion (representative interaction) expands and shows real content", async ({ page }) => {
    // The accordion under test is mobile-only (`lg:hidden` in BusinessDetailClient) — force a
    // mobile viewport so it's the visible, testable element rather than the always-open desktop
    // "Services & Offerings" block.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/business/${business.slug}`);

    // Scoped to the mobile accordion section specifically (id="section-services-mobile" in
    // BusinessDetailClient) throughout — the desktop "Services & Offerings" block
    // (id="section-services") renders the same service names unconditionally (just CSS-hidden,
    // not unmounted, on this viewport), so an unscoped getByText query is ambiguous between the
    // two once business data has loaded.
    const mobileSection = page.locator("#section-services-mobile");
    const serviceText = mobileSection.getByText(business.serviceName);
    await expect(serviceText).toHaveCount(0); // collapsed by default — not just hidden, unmounted

    await mobileSection.getByRole("button", { name: /Services/i }).click();

    await expect(serviceText).toBeVisible();
  });
});
