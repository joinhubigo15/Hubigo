/**
 * One-off cleanup: strips secondary (non-primary) BusinessCategory tags that belong to a
 * different top-level sector than the business's real primary category — e.g. a business
 * primarily tagged "CA" (Chartered Accountant, under Education & Training) that also carries
 * "Restaurant"/"Hotel"/"Resort" tags (under Food & Beverage / Travel & Accommodation).
 *
 * Root cause: the importer's phone+coordinates dedup signature (tier 2, in
 * deduplicator/dedup-key.ts) isn't scoped to category, so co-located businesses sharing a
 * building's phone number and near-identical geocoded coordinates got silently merged into one
 * business record across totally unrelated sectors. That's fixed going forward in
 * dedup-index.ts; this script repairs data already written by earlier import runs.
 *
 * Never touches primary category tags or business rows themselves — only removes the polluted
 * secondary tags, which is safe because a business's real identity is its primary category.
 *
 * Usage: npx tsx scripts/cleanup-cross-sector-category-tags.ts [--dry-run]
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const preview = await prisma.$queryRaw<{ affected_businesses: bigint; tags_to_remove: bigint }[]>`
    WITH biz_sector AS (
      SELECT bc.business_id, COALESCE(c.parent_id, c.id) AS sector_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    ),
    bad_tags AS (
      SELECT bc.id, bc.business_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      JOIN biz_sector bs ON bs.business_id = bc.business_id
      WHERE bc.is_primary = false
        AND COALESCE(c.parent_id, c.id) <> bs.sector_id
    )
    SELECT COUNT(DISTINCT business_id) AS affected_businesses, COUNT(*) AS tags_to_remove FROM bad_tags
  `;

  const { affected_businesses, tags_to_remove } = preview[0];
  console.log(
    `Found ${tags_to_remove} cross-sector secondary category tags on ${affected_businesses} businesses.`,
  );

  if (dryRun) {
    console.log("--dry-run passed — no changes made.");
    return;
  }

  const result = await prisma.$executeRaw`
    WITH biz_sector AS (
      SELECT bc.business_id, COALESCE(c.parent_id, c.id) AS sector_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    )
    DELETE FROM business_categories bc
    USING categories c, biz_sector bs
    WHERE bc.category_id = c.id
      AND bc.business_id = bs.business_id
      AND bc.is_primary = false
      AND COALESCE(c.parent_id, c.id) <> bs.sector_id
  `;

  console.log(`Deleted ${result} cross-sector secondary category tags.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
