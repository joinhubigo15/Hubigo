import * as Sentry from "@sentry/node";
import { env } from "../config/env";

// Must be called before any other imports that should be instrumented — see the very top of
// server.ts. Stays fully inert (no network calls, no overhead) while SENTRY_DSN is unset.
export function initSentry() {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Errors matter far more than trace volume for a launch-week monitoring setup — keep this
    // low so we don't burn through the free-tier event quota on routine request tracing.
    tracesSampleRate: 0.1,
  });
}

export { Sentry };
