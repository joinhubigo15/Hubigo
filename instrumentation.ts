// Next.js instrumentation hook — runs once on server/edge startup, before any request handling.
// Sentry stays fully inert (no network calls, no overhead) until SENTRY_DSN is set in the
// environment, so this is safe to ship even before the DSN is configured.
export async function register() {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return;

  if (process.env.NEXT_RUNTIME === "nodejs" || process.env.NEXT_RUNTIME === "edge") {
    const Sentry = await import("@sentry/nextjs");
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      // Errors matter far more than trace volume for a launch-week monitoring setup — keep this
      // low so we don't burn through the free-tier event quota on routine request tracing.
      tracesSampleRate: 0.1,
    });
  }
}

export const onRequestError = async (...args: Parameters<NonNullable<typeof import("@sentry/nextjs").captureRequestError>>) => {
  if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
};
