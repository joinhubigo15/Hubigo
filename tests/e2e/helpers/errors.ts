import type { Page } from "@playwright/test";

/**
 * Attaches a listener before navigation and returns a getter for any uncaught exceptions thrown
 * in the page during the test — the strongest "did the page actually crash" signal, deliberately
 * narrower than asserting on every console.error (which would also catch benign framework/dev
 * warnings and make the test brittle).
 */
export function trackPageErrors(page: Page) {
  const errors: Error[] = [];
  page.on("pageerror", (err) => errors.push(err));
  return () => errors;
}
