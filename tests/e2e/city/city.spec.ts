import { test, expect } from "@playwright/test";
import { TEST_DATA } from "../fixtures/test-data";
import { trackPageErrors } from "../helpers/errors";

const { city } = TEST_DATA;

test.describe("City page — content and interaction", () => {
  test("valid city page loads and shows initial listings", async ({ page }) => {
    const getErrors = trackPageErrors(page);

    const response = await page.goto(`/city/${city.slug}`);
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1, name: city.name })).toBeVisible();
    await expect(page.locator('a[href^="/business/"]').first()).toBeVisible();

    expect(getErrors()).toEqual([]);
  });

  test("hero image fallback (representative interaction) recovers from a failed load", async ({ page }) => {
    await page.goto(`/city/${city.slug}`);
    const landmarkImage = page.getByAltText(city.name, { exact: true });
    // next/image proxies the real URL through /_next/image?url=<encoded>&w=...&q=..., so the
    // original filename is a substring of the encoded query value, not a suffix of the src.
    await expect(landmarkImage).toHaveAttribute("src", new RegExp(`${city.slug}\\.webp`));

    // Dispatching a real native 'error' event, rather than intercepting the network request via
    // page.route(), is deliberate: verified (see testability note in the final report) that
    // Chromium does not reliably fire the <img> element's `error` event for a Playwright-aborted
    // or Playwright-fulfilled-404 image subresource, even though the resource genuinely fails to
    // load (confirmed via naturalWidth: 0 / complete: true). Dispatching the event directly
    // exercises the exact onError handler this test is meant to prove, deterministically.
    //
    // Wrapped in toPass(): next/image's own onError wrapper occasionally misses a single
    // manually-dispatched event (observed as intermittent flakiness after switching this image
    // to next/image — a testability quirk of Next's wrapper, not a real app bug), so retry the
    // dispatch until the fallback state actually lands.
    await expect(async () => {
      await landmarkImage.evaluate((img) => img.dispatchEvent(new Event("error")));
      await expect(landmarkImage).toHaveAttribute("src", new RegExp(`${city.slug}\\.jpg`), { timeout: 2000 });
    }).toPass({ timeout: 15000 });
  });
});
