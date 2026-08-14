import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  BACKEND_URL: z.string().url().default("http://localhost:4000"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),

  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().default(30),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Hubigo <onboarding@resend.dev>"),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z
    .string()
    .default("http://localhost:4000/api/v1/auth/google/callback"),

  // ── Cloudflare R2 (business/badge image storage) ──────────────────────────
  // S3-compatible object storage. Without these set, the R2 storage adapter is unavailable
  // and the image bulk-uploader/enrichment scripts refuse to run (see src/lib/storage/r2.ts).
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_ENDPOINT: z.string().optional(),
  R2_BUSINESS_BUCKET: z.string().optional(),
  R2_BADGE_BUCKET: z.string().optional(),
  // Public URL for each bucket (r2.dev dev URL for now, swap for a custom CDN domain before
  // launch — see resolveUrl()). Each R2 bucket gets its own public hostname, so these are
  // per-bucket, not a shared base + path.
  R2_BUSINESS_BUCKET_URL: z.string().optional(),
  R2_BADGE_BUCKET_URL: z.string().optional(),
  // Business-claim ownership-proof documents (GST certs, trade licenses, etc) — kept in their
  // own bucket rather than the business-images bucket since these are private-ish compliance
  // documents, not public listing photos.
  R2_DOCS_BUCKET: z.string().optional(),
  R2_DOCS_BUCKET_URL: z.string().optional(),
  // User profile pictures / avatars.
  R2_PROFILE_PICS_BUCKET: z.string().optional(),
  R2_PROFILE_PICS_BUCKET_URL: z.string().optional(),

  // ── Admin console (separate auth system from consumer Users — see AdminUser/AdminSession
  // in schema.prisma) ────────────────────────────────────────────────────────
  // Comma-separated allowlist: only these emails can ever log into /admin, even if an AdminUser
  // row exists for a different address. Checked before the password/2FA check.
  ADMIN_ALLOWED_EMAILS: z.string().default(""),
  // Shared TOTP secret (base32) for the whole admin team's authenticator-app 2FA codes. Generate
  // with: node -e "console.log(require('crypto').randomBytes(20).toString('hex'))" then base32
  // it, or just run scripts/bootstrap-admin.ts which prints a ready-to-scan secret.
  ADMIN_2FA_SECRET: z.string().min(16, "ADMIN_2FA_SECRET must be set — see .env.example").optional(),
  // Signs admin session JWTs — deliberately separate from JWT_ACCESS_SECRET so admin sessions
  // can never be forged with a leaked consumer-auth secret (or vice versa). The frontend's
  // middleware.ts verifies these tokens too, so this value must be copied into the frontend's
  // .env.local under the same name.
  ADMIN_JWT_SECRET: z.string().min(32, "ADMIN_JWT_SECRET must be at least 32 characters").optional(),
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().default(12),

  // ── Web Push (browser push notifications) ──────────────────────────────────
  // VAPID key pair identifying this server to push services (generated once via
  // `npx web-push generate-vapid-keys`). Without these set, push sends are silently skipped —
  // in-app Notification rows are still created either way.
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default("mailto:admin@hubigo.in"),

  // Sentry error monitoring — not a secret (DSNs are designed to be embeddable), just unset by
  // default. Sentry stays fully inert until this is set — see lib/sentry.ts.
  SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — check backend/.env against .env.example");
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const googleOAuthEnabled = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const emailEnabled = Boolean(env.RESEND_API_KEY);
export const r2Enabled = Boolean(
  env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_ENDPOINT
);
export const r2DocsEnabled = Boolean(r2Enabled && env.R2_DOCS_BUCKET && env.R2_DOCS_BUCKET_URL);
export const r2AvatarsEnabled = Boolean(r2Enabled && env.R2_PROFILE_PICS_BUCKET && env.R2_PROFILE_PICS_BUCKET_URL);
export const adminAuthEnabled = Boolean(env.ADMIN_2FA_SECRET && env.ADMIN_JWT_SECRET && env.ADMIN_ALLOWED_EMAILS);
export const adminAllowedEmails = new Set(
  env.ADMIN_ALLOWED_EMAILS.split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
);
export const pushEnabled = Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
