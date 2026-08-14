-- Pincode -> area-name lookup for Area-level pSEO (see Hubigo_PinToArea.xlsx, backfilled via
-- scripts/backfill-pincode-areas.ts). This table already exists live (applied via `prisma db push`
-- on 2026-08-13) -- this migration file exists only to bring Prisma's tracked migration history
-- back in sync with the real schema. It is registered via `prisma migrate resolve --applied`,
-- not executed, since the DDL below is already live.

-- CreateTable
CREATE TABLE "pincode_areas" (
    "id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pincode_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pincode_areas_city_id_idx" ON "pincode_areas"("city_id");

-- CreateIndex
CREATE INDEX "pincode_areas_pincode_idx" ON "pincode_areas"("pincode");

-- CreateIndex
CREATE INDEX "pincode_areas_slug_idx" ON "pincode_areas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "pincode_areas_pincode_slug_key" ON "pincode_areas"("pincode", "slug");

-- AddForeignKey
ALTER TABLE "pincode_areas" ADD CONSTRAINT "pincode_areas_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
