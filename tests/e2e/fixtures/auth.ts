import { test as base } from "@playwright/test";

/**
 * Reusable fixture pattern for role-scoped authenticated tests — ready to extend once dedicated
 * test accounts exist for customer / business_owner / admin. Nothing in the current suite needs
 * auth (business/category/city pages are public), so nothing is wired up yet; this file exists so
 * future auth-dependent specs plug into one place instead of each reinventing login.
 *
 * When adding a role, follow this shape:
 *
 *   type Fixtures = { customerPage: Page };
 *
 *   export const test = base.extend<Fixtures>({
 *     customerPage: async ({ browser }, use) => {
 *       const email = process.env.E2E_CUSTOMER_EMAIL;
 *       const password = process.env.E2E_CUSTOMER_PASSWORD;
 *       if (!email || !password) test.skip(true, "E2E_CUSTOMER_EMAIL/PASSWORD not set");
 *       const page = await browser.newPage();
 *       await page.goto("/login");
 *       // ...fill + submit the real login form, or reuse a cached storageState...
 *       await use(page);
 *       await page.close();
 *     },
 *   });
 *
 * Credentials must always come from env vars (E2E_CUSTOMER_EMAIL/PASSWORD,
 * E2E_BUSINESS_OWNER_EMAIL/PASSWORD, E2E_ADMIN_EMAIL/PASSWORD) — never hardcoded here or
 * committed. Prefer Playwright's storageState caching (playwright.config.ts `use.storageState` or
 * a per-project setup file) once a role is added, so login isn't repeated for every test.
 */
export const test = base;
export { expect } from "@playwright/test";
