export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
}

/** Retries `fn` with exponential backoff + jitter. Throws the last error if all attempts fail. */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === opts.attempts) break;
      const backoff = opts.baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * backoff * 0.3;
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastErr;
}
