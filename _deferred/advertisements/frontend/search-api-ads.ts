// Originally lived in app/lib/search-api.ts — pulled out here alongside the rest of the deferred
// advertisements feature. Restore by pasting back into search-api.ts (needs that file's own
// `request`, `buildQueryString`, `SearchFilters`, and `PlanTier` already in scope there).

export interface AdBusiness {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  phone: string;
  planTier: PlanTier;
  distanceKm: number | null;
}

/** Featured-ads carousel for the search page — only meaningful with a category/subcategory
 * filter active; returns [] otherwise (caller should just not render the carousel then). */
export function getFeaturedAds(filters: Pick<SearchFilters, "category" | "subcategory" | "city" | "lat" | "lng">) {
  const qs = buildQueryString(filters);
  return request<AdBusiness[]>(`/api/v1/search/ads${qs ? `?${qs}` : ""}`);
}
