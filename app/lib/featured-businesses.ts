import type { BusinessSummary } from "@/app/lib/search-api";

export const FEATURED_COUNT = 8;

/** Picks the highest-rated business per distinct primary category (so the featured slots don't
 * end up as several of the same category) — fed a larger rating-sorted pool so there's enough
 * category variety to pick from. Pure, so it can run on both the server (homepage) and client
 * (FeaturedBusinessesSection's own fallback fetch). */
export function pickDistinctCategories(pool: BusinessSummary[], count: number): BusinessSummary[] {
  const seenCategories = new Set<string>();
  const picked: BusinessSummary[] = [];

  for (const b of pool) {
    const key = b.primaryCategorySlug ?? b.id;
    if (seenCategories.has(key)) continue;
    seenCategories.add(key);
    picked.push(b);
    if (picked.length >= count) break;
  }

  // Not enough distinct categories in the pool (small city catalog) — pad with whatever's left,
  // still highest-rated first, rather than showing fewer than requested.
  if (picked.length < count) {
    for (const b of pool) {
      if (picked.length >= count) break;
      if (!picked.includes(b)) picked.push(b);
    }
  }

  return picked;
}
