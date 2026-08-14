-- AlterTable
-- Drops the backfill-only default added in the prior migration; Prisma's
-- @updatedAt sets this column explicitly on every write, so no default is needed.
ALTER TABLE "reviews" ALTER COLUMN "updated_at" DROP DEFAULT;

-- CreateTable
CREATE TABLE "business_description_templates" (
    "id" TEXT NOT NULL,
    "subcategory_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_description_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "business_description_templates_subcategory_id_idx" ON "business_description_templates"("subcategory_id");

-- AddForeignKey
ALTER TABLE "business_description_templates" ADD CONSTRAINT "business_description_templates_subcategory_id_fkey" FOREIGN KEY ("subcategory_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
