import type { Page } from "@playwright/test";

/**
 * Attaches a listener before navigation and returns a getter for every request URL whose path
 * contains `urlSubstring` — used to assert a given API endpoint is only hit once during a full
 * page load (the "no redundant client fetch on top of server-rendered data" regression guard).
 * Must be called before `page.goto()` so the initial request isn't missed.
 */
export function trackRequestsTo(page: Page, urlSubstring: string) {
  const urls: string[] = [];
  page.on("request", (req) => {
    if (req.url().includes(urlSubstring)) urls.push(req.url());
  });
  return () => urls;
}
