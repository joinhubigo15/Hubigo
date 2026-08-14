import { env, googleOAuthEnabled, emailEnabled, r2Enabled, adminAuthEnabled } from "../../config/env";

// Parses the `connection_limit` query param out of DATABASE_URL without ever returning the
// raw URL itself (it contains the DB password).
function poolLimitFromDatabaseUrl(url: string): number | null {
  try {
    const parsed = new URL(url);
    const limit = parsed.searchParams.get("connection_limit");
    return limit ? Number(limit) : null;
  } catch {
    return null;
  }
}

export function getAdminSettings() {
  return {
    environment: env.NODE_ENV,
    backendUrl: env.BACKEND_URL,
    frontendUrl: env.FRONTEND_URL,
    database: {
      provider: "PostgreSQL (Railway)",
      poolLimit: poolLimitFromDatabaseUrl(env.DATABASE_URL),
    },
    storage: {
      r2Enabled,
      bucket: env.R2_BUSINESS_BUCKET ?? null,
      publicUrl: env.R2_BUSINESS_BUCKET_URL ?? null,
    },
    email: { enabled: emailEnabled, from: env.EMAIL_FROM },
    featureFlags: { googleOAuthEnabled, adminAuthEnabled },
  };
}
