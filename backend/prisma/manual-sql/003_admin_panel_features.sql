-- Admin Panel: Advertisements, Bulk Imports, Review moderation, City tiers
-- Generated via `prisma migrate diff` and hand-reviewed:
--   - Removed 6 false-positive DROP INDEX statements for the pg_trgm search indexes
--     (businesses_description_trgm_idx, businesses_keywords_gin_idx, businesses_name_trgm_idx,
--     categories_name_trgm_idx, cities_name_trgm_idx, localities_name_trgm_idx) — those were
--     applied out-of-band via manual-sql/001_search_trigram_indexes.sql and are untracked in
--     Prisma's migration history, so the raw diff always misreads them as deletions. Same
--     situation documented in manual-sql/002_business_dashboard_features.sql.
--   - Rewrote the reviews.status column change from a DROP COLUMN + ADD COLUMN (which would
--     silently discard any live review data) into a type-preserving ALTER COLUMN ... USING
--     cast. Every existing ApprovalStatus value (PENDING/APPROVED/REJECTED) is a valid member
--     of the new ReviewStatus enum, so the cast is safe.

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'FLAGGED', 'SPAM', 'REJECTED');

-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('HOME_BANNER', 'CATEGORY_TOP', 'SEARCH_SPONSORED');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ENDED');

-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- AlterTable: cities.tier
ALTER TABLE "cities" ADD COLUMN "tier" TEXT;

-- AlterTable: reviews.flagged_reason + status type change (data-preserving cast)
ALTER TABLE "reviews" ADD COLUMN "flagged_reason" TEXT;
ALTER TABLE "reviews" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "reviews" ALTER COLUMN "status" TYPE "ReviewStatus" USING ("status"::text::"ReviewStatus");
ALTER TABLE "reviews" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "target_city_id" TEXT,
    "placement" "AdPlacement" NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'ACTIVE',
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "stored_path" TEXT NOT NULL,
    "sector" TEXT,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "processed_rows" INTEGER NOT NULL DEFAULT 0,
    "inserted_rows" INTEGER NOT NULL DEFAULT 0,
    "duplicate_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "created_by" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "advertisements_target_city_id_idx" ON "advertisements"("target_city_id");

-- CreateIndex
CREATE INDEX "advertisements_status_idx" ON "advertisements"("status");

-- CreateIndex
CREATE INDEX "import_jobs_status_idx" ON "import_jobs"("status");

-- CreateIndex
CREATE INDEX "import_jobs_created_at_idx" ON "import_jobs"("created_at");

-- CreateIndex
CREATE INDEX "reviews_status_idx" ON "reviews"("status");
