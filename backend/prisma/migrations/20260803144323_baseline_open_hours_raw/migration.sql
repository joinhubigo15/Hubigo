-- Baseline migration: records a column that was already added to the live
-- database outside of migration history (open_hours_raw on businesses).
-- Marked as applied via `prisma migrate resolve`, not executed, since the
-- column already exists in production.
ALTER TABLE "businesses" ADD COLUMN "open_hours_raw" TEXT;
