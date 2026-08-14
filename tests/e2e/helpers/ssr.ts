import type { APIRequestContext } from "@playwright/test";

/**
 * Fetches a path with Playwright's `request` context, which never executes JS — this is the raw
 * HTTP response exactly as Googlebot's initial (non-rendering) fetch would see it, unlike
 * `page.goto()` which waits for and reflects client-side hydration. Use this for "is the content
 * actually in the server response" assertions; use `page.goto()` for interaction tests.
 */
export async function fetchRawHtml(request: APIRequestContext, path: string) {
  const response = await request.get(path);
  const body = await response.text();
  return { status: response.status(), body };
}
