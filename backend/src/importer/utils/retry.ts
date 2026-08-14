import { Prisma } from "@prisma/client";

/** Prisma error codes that represent a transient connectivity problem, not a data problem. */
const RETRYABLE_PRISMA_CODES = new Set([
  "P1001", // Can't reach database server
  "P1002", // Database server was reached but timed out
  "P1008", // Operations timed out
  "P1017", // Server has closed the connection
  "P2024", // Timed out fetching a connection from the pool
]);

const RETRYABLE_ERROR_NAME_PATTERNS = [/ECONNRESET/i, /ETIMEDOUT/i, /ECONNREFUSED/i, /socket hang up/i];

function isRetryableError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return RETRYABLE_PRISMA_CODES.has(err.code);
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  return RETRYABLE_ERROR_NAME_PATTERNS.some((pattern) => pattern.test(message));
}

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  onRetry?: (attempt: number, err: unknown) => void;
}

/**
 * Retries `fn` with exponential backoff + jitter, but ONLY for transient connectivity errors
 * (dropped connections, timeouts, pool exhaustion) — never for data errors (unique constraint
 * violations, validation failures, etc.), which fail immediately since retrying them is
 * pointless and could mask a real bug. Each attempt calls the write fresh — since business
 * writes here are single atomic `create` calls, a retried attempt either fully succeeds or
 * fails again, never leaves a partial row (Prisma wraps a nested create in one transaction).
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!isRetryableError(err) || attempt === opts.attempts) throw err;
      opts.onRetry?.(attempt, err);
      const backoff = opts.baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * backoff * 0.3;
      await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    }
  }
  throw lastErr;
}
