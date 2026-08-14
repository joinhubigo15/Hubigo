import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { trackPageErrors } from "../helpers/errors";

const { category } = TEST_DATA;

test.describe("Category page — content and interaction", () => {
  test("valid category page loads and shows initial listings", async ({ page }) => {
    const getErrors = trackPageErrors(page);

    const response = await page.goto(`/category/${category.slug}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: category.name })).toBeVisible();

    // At least one real business link in the featured grid — proves listings actually loaded,
    // not just the page chrome.
    await expect(page.locator('a[href^="/business/"]').first()).toBeVisible();

    expect(getErrors()).toEqual([]);
  });

  test("subcategory pill (representative interaction) filters the listings", async ({ page }) => {
    await page.goto(`/category/${category.slug}`);
    await expect(page.getByRole("heading", { level: 1, name: category.name })).toBeVisible();

    const subcategoryRequest = page.waitForRequest((req) =>
      req.url().includes("/api/v1/search") && req.url().includes(`subcategory=${category.subcategory.slug}`)
    );

    // The same subcategory name also appears as its own row in the "Subcategories" list column
    // below the pills bar (both call the same setActiveSubcategory — intentional duplicate
    // controls, not a bug), so exact:true alone is still ambiguous between the two. The pills bar
    // renders first in the DOM, so .first() reliably isolates the pill.
    await page.getByRole("button", { name: category.subcategory.name, exact: true }).first().click();

    // The real effect of the click: a fresh, filtered fetch — a much more robust signal than
    // asserting on the pill's Tailwind active-state classes.
    await subcategoryRequest;
  });
});
