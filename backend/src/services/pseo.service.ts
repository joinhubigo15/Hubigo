import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

// Mirrors the effective-category matching logic in business.repository.ts's searchBusinesses()
// "category" filter (a single ?category= slug covers both top-level and subcategory pages): a
// subcategory page counts only businesses whose PRIMARY category is exactly that subcategory; a
// top-level category page counts businesses primary-tagged with the category itself PLUS any of
// its subcategories.
//
// This candidates list is consumed only by the sitemap builder (app/sitemap.ts), which only ever
// wants the indexable tier. The floor below is a performance pre-filter, not the indexability
// decision itself — it must stay <= app/lib/pseo-thresholds.ts's MIN_INDEXABLE (currently 16, i.e.
// "more than 15") so it never excludes a genuinely indexable combo. The actual exist/indexable/
// tier decision is made once, in that frontend module, via evaluatePseoGate() against the exact
// counts returned here — this file never duplicates that decision.
const CANDIDATE_FLOOR = 16;

interface CityComboRow {
  city_slug: string;
  category_slug: string;
  count: bigint;
  lastmod: Date | null;
}

interface AreaComboRow {
  city_slug: string;
  area_slug: string;
  category_slug: string;
  count: bigint;
  lastmod: Date | null;
}

export interface PseoCandidate {
  path: string;
  count: number;
  /** Real data-derived signal (MAX of the group's business rows' updatedAt) — never a fabricated
   * "now". Null only if Postgres somehow returns no rows for a non-empty group (shouldn't happen). */
  lastmod: string | null;
}

async function getCityCategoryCombos(): Promise<PseoCandidate[]> {
  const rows = await prisma.$queryRaw<CityComboRow[]>(Prisma.sql`
    WITH primary_cat AS (
      SELECT c.id AS cat_id, c.slug AS cat_slug, c.parent_id, b.city_id, b.updated_at
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      JOIN businesses b ON b.id = bc.business_id
      WHERE bc.is_primary = true AND b.status = 'approved' AND b.deleted_at IS NULL
    ),
    subcat_counts AS (
      SELECT city_id, cat_slug AS category_slug, COUNT(*) AS cnt, MAX(updated_at) AS lastmod
      FROM primary_cat
      WHERE parent_id IS NOT NULL
      GROUP BY city_id, cat_slug
    ),
    top_counts AS (
      SELECT pc.city_id, COALESCE(parent.slug, pc.cat_slug) AS category_slug, COUNT(*) AS cnt, MAX(pc.updated_at) AS lastmod
      FROM primary_cat pc
      LEFT JOIN categories parent ON parent.id = pc.parent_id
      GROUP BY pc.city_id, COALESCE(parent.slug, pc.cat_slug)
    )
    SELECT city.slug AS city_slug, x.category_slug, x.cnt AS count, x.lastmod
    FROM (SELECT * FROM subcat_counts UNION ALL SELECT * FROM top_counts) x
    JOIN cities city ON city.id = x.city_id
    WHERE x.cnt >= ${CANDIDATE_FLOOR}
  `);

  return rows.map((r) => ({
    path: `/category/${r.category_slug}/${r.city_slug}`,
    count: Number(r.count),
    lastmod: r.lastmod ? new Date(r.lastmod).toISOString() : null,
  }));
}

async function getAreaCategoryCombos(): Promise<PseoCandidate[]> {
  const rows = await prisma.$queryRaw<AreaComboRow[]>(Prisma.sql`
    WITH primary_cat AS (
      SELECT c.id AS cat_id, c.slug AS cat_slug, c.parent_id, b.city_id, b.pincode, b.updated_at
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      JOIN businesses b ON b.id = bc.business_id
      WHERE bc.is_primary = true AND b.status = 'approved' AND b.deleted_at IS NULL AND b.pincode IS NOT NULL
    ),
    with_area AS (
      -- Fans a business out to BOTH rows when its pincode has a main + alternate area name —
      -- intentional: each real area name gets its own page per the source spreadsheet.
      SELECT pa.city_id, pa.slug AS area_slug, pc.cat_slug, pc.parent_id, pc.updated_at
      FROM primary_cat pc
      JOIN pincode_areas pa ON pa.pincode = pc.pincode AND pa.city_id = pc.city_id
    ),
    subcat_counts AS (
      SELECT city_id, area_slug, cat_slug AS category_slug, COUNT(*) AS cnt, MAX(updated_at) AS lastmod
      FROM with_area
      WHERE parent_id IS NOT NULL
      GROUP BY city_id, area_slug, cat_slug
    ),
    top_counts AS (
      SELECT wa.city_id, wa.area_slug, COALESCE(parent.slug, wa.cat_slug) AS category_slug, COUNT(*) AS cnt, MAX(wa.updated_at) AS lastmod
      FROM with_area wa
      LEFT JOIN categories parent ON parent.id = wa.parent_id
      GROUP BY wa.city_id, wa.area_slug, COALESCE(parent.slug, wa.cat_slug)
    )
    SELECT city.slug AS city_slug, x.area_slug, x.category_slug, x.cnt AS count, x.lastmod
    FROM (SELECT * FROM subcat_counts UNION ALL SELECT * FROM top_counts) x
    JOIN cities city ON city.id = x.city_id
    WHERE x.cnt >= ${CANDIDATE_FLOOR}
  `);

  return rows.map((r) => ({
    path: `/category/${r.category_slug}/${r.city_slug}/${r.area_slug}`,
    count: Number(r.count),
    lastmod: r.lastmod ? new Date(r.lastmod).toISOString() : null,
  }));
}

// All 4 pSEO templates (City x Category, City x Subcategory, Area x Category, Area x Subcategory)
// collapse into these 2 SQL shapes, since the route itself doesn't distinguish category vs
// subcategory level — see the comment on CANDIDATE_FLOOR above.
export async function getPseoCandidates(): Promise<PseoCandidate[]> {
  const [cityCombos, areaCombos] = await Promise.all([
    getCityCategoryCombos(),
    getAreaCategoryCombos(),
  ]);
  return [...cityCombos, ...areaCombos];
}
