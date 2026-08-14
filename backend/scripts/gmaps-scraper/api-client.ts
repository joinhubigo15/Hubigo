import type { SearchMode } from "./types";

const BASE_URL = "https://gmapsscraper.io/api/v1";

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * "Too many concurrent jobs (max 10)" is an ACCOUNT-WIDE cap (confirmed by probing a never-used
 * key while the limit was hit — it got the identical error), not a per-key thing. Rotating keys
 * against it is pure waste: every key shares the same 10-job ceiling, so the fix is to wait for
 * an in-flight job to finish, not to hop to a different key.
 */
export class ConcurrencyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConcurrencyLimitError";
  }
}

/**
 * The genuine per-key daily cap (confirmed via direct probe: a key returned exactly
 * "Daily request limit exceeded (1000/day for your plan)" after ~495 logged successful queries).
 * Distinguished from RateLimitError (which covers everything else 429 — most of which is actually
 * the account-wide concurrency cap misfiring on an otherwise-healthy key, NOT a real daily-cap
 * hit) so genuinely-exhausted keys can be recorded and skipped on a later pass instead of being
 * retried pointlessly, while keys that just got caught in account-wide congestion are NOT
 * wrongly written off — they keep their full untouched daily budget for the next attempt.
 */
export class DailyLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DailyLimitError";
  }
}

/**
 * A key that's actually invalid/revoked (HTTP 401, "Invalid or revoked API key") — permanently
 * bad, not a transient rate/concurrency/daily thing. Unlike DailyLimitError this never expires on
 * its own, so it's recorded separately and skipped on every future run until someone replaces the
 * key in .env.
 */
export class InvalidKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidKeyError";
  }
}

export class GmapsScraperApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "GmapsScraperApiError";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retries transient failures (network errors, 5xx) with exponential backoff + jitter.
 * 429 splits into two genuinely different situations that need opposite handling:
 *  - Per-key daily cap: with hundreds of keys available, a dead/capped key is far cheaper to
 *    abandon and rotate away from than to wait out — one quick retry then surface RateLimitError
 *    so the caller rotates. Waiting 30-90s per dead key across a long stretch of capped keys was
 *    costing many minutes for no benefit — the daily cap doesn't clear that fast anyway.
 *  - Account-wide "Too many concurrent jobs (max 10)": confirmed via direct probe that a
 *    never-used key gets the identical error while the cap is hit — this is NOT per-key, so
 *    rotating keys against it is pure waste. The right move is to wait (a running job will finish
 *    and free a slot) and retry the SAME key, distinguished here by sniffing the response body.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxRetries429 = 1,
    baseDelay429Ms = 3000,
    // Was 60 (~5min/key), then 6 (~30s/key). cli.ts now rotates off a ConcurrencyLimitError
    // (instead of only retrying the same key), so this only needs to smooth a genuinely
    // momentary blip — the block-abandon logic in cli.ts (checks ~7 distinct keys, then bails)
    // is what actually handles a truly capped block, not this per-key wait.
    maxRetriesConcurrency = 2,
    concurrencyRetryDelayMs = 5000,
  }: {
    maxRetries?: number;
    baseDelayMs?: number;
    maxRetries429?: number;
    baseDelay429Ms?: number;
    maxRetriesConcurrency?: number;
    concurrencyRetryDelayMs?: number;
  } = {},
): Promise<Response> {
  let lastErr: unknown;
  let concurrencyAttempts = 0;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, init);

      if (res.status === 429) {
        const body = await res.clone().text().catch(() => "");
        if (body.includes("Too many concurrent jobs")) {
          concurrencyAttempts += 1;
          if (concurrencyAttempts > maxRetriesConcurrency) {
            throw new ConcurrencyLimitError(
              `Account-wide concurrent-job limit (max 10) did not clear after ${maxRetriesConcurrency} waits.`,
            );
          }
          await sleep(concurrencyRetryDelayMs);
          attempt -= 1; // doesn't count against the generic maxRetries budget
          continue;
        }

        if (body.includes("Daily request limit exceeded")) {
          throw new DailyLimitError(body);
        }

        if (attempt >= maxRetries429) {
          throw new RateLimitError(
            "Received 429 (rate limited). Rotating to the next key rather than waiting it out — already-completed queries are safely recorded and won't be redone.",
          );
        }
        const retryAfterHeader = res.headers.get("Retry-After");
        const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : null;
        const waitMs = retryAfterMs && !Number.isNaN(retryAfterMs) ? Math.min(retryAfterMs, baseDelay429Ms) : baseDelay429Ms;
        await sleep(waitMs);
        continue;
      }

      // 409 shows up under concurrent load ("Credit deduction conflict. Please retry.") — the
      // provider's own backend racing on the credit-deduction step, not a daily cap. Short
      // backoff and retry, same as 5xx.
      if (res.status >= 500 || res.status === 409) {
        if (attempt === maxRetries) return res;
        await sleep(baseDelayMs * 2 ** attempt + Math.random() * 250);
        continue;
      }

      return res;
    } catch (err) {
      lastErr = err;
      if (attempt === maxRetries) throw err;
      await sleep(baseDelayMs * 2 ** attempt + Math.random() * 250);
    }
  }

  throw lastErr;
}

async function assertOk(res: Response, context: string): Promise<Response> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    // A sustained Cloudflare edge block can surface as a real error status (503 seen in practice),
    // not just the 200-with-HTML case handled below — retrying the same key against it is
    // pointless, so treat it as a RateLimitError to trigger rotation like everything else does.
    if (looksLikeCloudflareBlock(body)) {
      throw new RateLimitError(`${context}: Cloudflare edge block (HTTP ${res.status}) — rotating key.`);
    }
    if (res.status === 401) {
      throw new InvalidKeyError(`${context}: ${body}`);
    }
    throw new GmapsScraperApiError(`${context} failed: HTTP ${res.status} ${body}`, res.status);
  }
  return res;
}

/**
 * Occasionally under concurrent load the response body arrives truncated ("Unexpected end of
 * JSON input") — a fresh request usually succeeds, so this retries the whole fetch+parse cycle
 * rather than just re-parsing the same (broken) body.
 */
function looksLikeCloudflareBlock(text: string): boolean {
  return text.includes("cf-error") || text.includes("__CF$cv$params") || text.includes("Attention Required") || text.includes("cf-wrapper");
}

async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  context: string,
  attempts = 3,
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetchWithRetry(url, init);
    await assertOk(res, context);
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      // A Cloudflare edge challenge under sustained concurrent load returns HTML (often with a
      // 200 status, so assertOk doesn't catch it) instead of the expected JSON body. Retrying
      // the same key just gets the same block again — surfaced as RateLimitError so the caller's
      // existing rotate-on-429 logic switches keys instead of burning all `attempts` for nothing.
      if (looksLikeCloudflareBlock(text)) {
        throw new RateLimitError(`${context}: Cloudflare edge block (non-JSON HTML response) — rotating key.`);
      }
      await sleep(500 + Math.random() * 500);
    }
  }
  throw new GmapsScraperApiError(`${context}: response body was not valid JSON after ${attempts} attempts`, 0);
}

export function authHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function getCredits(apiKey: string): Promise<number> {
  const body = await fetchJsonWithRetry<{ credits: number }>(
    `${BASE_URL}/credits`,
    { headers: authHeaders(apiKey) },
    "GET /credits",
  );
  return body.credits;
}

export interface SubmitScrapeParams {
  keyword: string;
  mode: SearchMode;
  /** Search depth, 1-3 per the docs (default 2) — same range on every plan, no "level 5" exists. */
  depth?: number;
}

export interface SubmitScrapeResult {
  jobId: string;
  creditsRemaining: number;
}

/**
 * `area: true` for Area Search mode is inferred from the published docs (not yet exercised
 * against the live API — only plain mode was probed during the build). Verify the response
 * shape on the first real Area Search invocation before relying on it for a large run.
 */
export async function submitScrape(apiKey: string, params: SubmitScrapeParams): Promise<SubmitScrapeResult> {
  const body: Record<string, unknown> = { keywords: [params.keyword] };
  if (params.mode === "area") {
    body.area = true;
  }
  if (params.depth !== undefined) {
    body.depth = params.depth;
  }

  // Retrying on a truncated response here could in theory double-submit if the first request
  // actually succeeded server-side — accepted tradeoff given the credit pool is orders of
  // magnitude larger than what any run needs; worst case is a few duplicate staged rows.
  const parsed = await fetchJsonWithRetry<{ id: string; credits_remaining: number }>(
    `${BASE_URL}/scrape`,
    {
      method: "POST",
      headers: { ...authHeaders(apiKey), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "POST /scrape",
  );
  return { jobId: parsed.id, creditsRemaining: parsed.credits_remaining };
}

export interface JobStatus {
  id: string;
  status: "running" | "complete" | "failed";
  name: string;
}

export async function getJobStatus(apiKey: string, jobId: string): Promise<JobStatus> {
  return fetchJsonWithRetry<JobStatus>(`${BASE_URL}/jobs/${jobId}`, { headers: authHeaders(apiKey) }, `GET /jobs/${jobId}`);
}

export async function downloadJobCsv(apiKey: string, jobId: string): Promise<string> {
  const res = await fetchWithRetry(`${BASE_URL}/jobs/${jobId}/download`, { headers: authHeaders(apiKey) });
  await assertOk(res, `GET /jobs/${jobId}/download`);
  const text = await res.text();
  // A Cloudflare edge challenge here returns HTTP 200 with an HTML body, so assertOk doesn't
  // catch it — without this check the HTML gets fed to the CSV parser as if it were real data.
  if (looksLikeCloudflareBlock(text)) {
    throw new RateLimitError(`GET /jobs/${jobId}/download: Cloudflare edge block (non-JSON HTML response) — rotating key.`);
  }
  return text;
}

/** Polls until the job leaves "running", checking every `intervalMs`, up to `timeoutMs` total. */
export async function pollUntilComplete(
  apiKey: string,
  jobId: string,
  { intervalMs = 4000, timeoutMs = 5 * 60 * 1000 }: { intervalMs?: number; timeoutMs?: number } = {},
): Promise<JobStatus> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const status = await getJobStatus(apiKey, jobId);
    if (status.status !== "running") return status;
    await sleep(intervalMs);
  }
  throw new Error(`Job ${jobId} did not complete within ${timeoutMs}ms`);
}
