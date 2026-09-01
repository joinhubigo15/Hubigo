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
const CANDIDATE_FLOOR = 1;

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

export async function getAllBusinessSlugsForSitemap() {
  const rows = await prisma.business.findMany({
    where: { status: "approved", deletedAt: null },
    select: { slug: true, updatedAt: true },
    orderBy: { avgRating: "desc" },
  });
  return rows.map((r) => ({
    slug: r.slug,
    lastmod: r.updatedAt ? r.updatedAt.toISOString() : null,
  }));
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
//
// Cached: this scans the whole businesses table twice (city-level, area-level) and is now called
// not just by the hourly sitemap build but also by resolveTopSearchQuery() below on every "top X
// in Y" search — without caching, that would mean a full-table aggregation on every such search.
let pseoCandidatesCache: PseoCandidate[] | null = null;
let pseoCandidatesCacheLoadedAt = 0;
const PSEO_CANDIDATES_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getPseoCandidates(): Promise<PseoCandidate[]> {
  const now = Date.now();
  if (pseoCandidatesCache && now - pseoCandidatesCacheLoadedAt < PSEO_CANDIDATES_CACHE_TTL_MS) {
    return pseoCandidatesCache;
  }
  const [cityCombos, areaCombos] = await Promise.all([
    getCityCategoryCombos(),
    getAreaCategoryCombos(),
  ]);
  pseoCandidatesCache = [...cityCombos, ...areaCombos];
  pseoCandidatesCacheLoadedAt = now;
  return pseoCandidatesCache;
}

// ── "Top X in Y" search-bar shortcut ──────────────────────────────────────────
// Lets typing e.g. "top hotels in whitefield" straight into any search bar jump directly to the
// matching pSEO page, instead of only being reachable by browsing category/city links. Deliberately
// narrow: only the literal "top {category} in {location}" phrasing triggers this — anything else
// (a plain keyword search, "restaurants near me", etc.) falls through to normal search untouched.

interface CategoryNameCandidate {
  name: string;
  nameLower: string;
  slug: string;
}

interface PseoLocationCandidate {
  name: string;
  nameLower: string;
  citySlug: string;
  areaSlug: string | null;
}

let categoryNameCache: CategoryNameCandidate[] | null = null;
let locationNameCache: PseoLocationCandidate[] | null = null;
let taxonomyCacheLoadedAt = 0;
const TAXONOMY_CACHE_TTL_MS = 5 * 60 * 1000;

async function getTaxonomyCandidates(): Promise<{ categories: CategoryNameCandidate[]; locations: PseoLocationCandidate[] }> {
  const now = Date.now();
  if (categoryNameCache && locationNameCache && now - taxonomyCacheLoadedAt < TAXONOMY_CACHE_TTL_MS) {
    return { categories: categoryNameCache, locations: locationNameCache };
  }

  const [categories, cities, areas] = await Promise.all([
    prisma.category.findMany({ select: { name: true, slug: true } }),
    prisma.city.findMany({ select: { name: true, slug: true } }),
    prisma.pincodeArea.findMany({
      select: { name: true, slug: true, city: { select: { slug: true } } },
      distinct: ["slug", "cityId"],
    }),
  ]);

  categoryNameCache = categories.map((c) => ({ name: c.name, nameLower: c.name.toLowerCase(), slug: c.slug }));
  locationNameCache = [
    ...cities.map((c) => ({ name: c.name, nameLower: c.name.toLowerCase(), citySlug: c.slug, areaSlug: null as string | null })),
    ...areas.map((a) => ({ name: a.name, nameLower: a.name.toLowerCase(), citySlug: a.city.slug, areaSlug: a.slug })),
  ];
  taxonomyCacheLoadedAt = now;
  return { categories: categoryNameCache, locations: locationNameCache };
}

/** Picks the best (longest, i.e. most specific) name whose text appears in — or contains — the
 * given phrase, matching either direction so "hotel" matches a stored "Hotels" and vice versa. */
function findBestNameMatch<T extends { nameLower: string }>(phrase: string, candidates: T[]): T | null {
  const phraseLower = phrase.toLowerCase();
  const matches = candidates.filter((c) => phraseLower.includes(c.nameLower) || c.nameLower.includes(phraseLower));
  if (matches.length === 0) return null;
  matches.sort((a, b) => b.nameLower.length - a.nameLower.length);
  return matches[0];
}

const TOP_X_IN_Y_PATTERN = /^(?:top|best)\s+(.+?)\s+in\s+(.+)$/i;

/** Returns the matching pSEO page path for a "top {category} in {location}" or "best {category}
 * in {location}" query, or null if the query doesn't match that phrasing, or resolves to a
 * category/location pair with no qualifying (gate-passing) pSEO page — callers should fall back
 * to normal search in either case. */
export async function resolveTopSearchQuery(rawQuery: string): Promise<string | null> {
  const match = TOP_X_IN_Y_PATTERN.exec(rawQuery.trim());
  if (!match) return null;

  const [, categoryText, locationText] = match;
  const [{ categories, locations }, candidates] = await Promise.all([
    getTaxonomyCandidates(),
    getPseoCandidates(),
  ]);

  const category = findBestNameMatch(categoryText, categories);
  const location = findBestNameMatch(locationText, locations);
  if (!category || !location) return null;

  // An area-level combo (e.g. "saree store" x "Halasuru") frequently has too few businesses to
  // clear the indexable gate even when the category and location both resolve fine — Halasuru
  // might only have 10 saree stores against a 16-business floor, say, while Bangalore overall has
  // hundreds. Rather than give up and dump the user into a fuzzy keyword search that ignores half
  // their query, fall back to the city-wide page for the same category, which almost always does
  // qualify. Only city-level queries (no areaSlug) have no further fallback to try.
  const areaPath = location.areaSlug ? `/category/${category.slug}/${location.citySlug}/${location.areaSlug}` : null;
  if (areaPath && candidates.some((c) => c.path === areaPath)) return areaPath;

  const cityPath = `/category/${category.slug}/${location.citySlug}`;
  return candidates.some((c) => c.path === cityPath) ? cityPath : null;
}
