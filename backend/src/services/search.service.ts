import { prisma } from "../lib/prisma";
import { searchBusinesses, hasVerifiedMatches } from "../repositories/business.repository";
import { resolveImageUrl } from "../lib/storage/resolve-image-url";
import type { SearchQueryInput } from "../schemas/search.schema";
import type { BusinessSummary, PaginatedResult, SearchParams } from "../types/search.types";

function toSearchParams(input: SearchQueryInput): SearchParams {
  const hasCoords = typeof input.lat === "number" && typeof input.lng === "number";
  // Distance sort/radius only make sense with a real user location — fall back rather than 500.
  const sort = input.sort === "distance" && !hasCoords ? "best_match" : input.sort;

  return {
    q: input.q,
    categorySlug: input.category,
    subcategorySlug: input.subcategory,
    citySlug: input.city,
    localitySlug: input.locality,
    areaSlug: input.area,
    pincode: input.pincode,
    lat: hasCoords ? input.lat : undefined,
    lng: hasCoords ? input.lng : undefined,
    radiusKm: input.radiusKm,
    openNow: input.openNow,
    verifiedOnly: input.verified,
    minRating: input.minRating,
    priceRanges: input.price,
    amenitySlugs: input.amenities,
    hasOffers: input.offers,
    planTiers: input.tier,
    sort,
    page: input.page,
    limit: input.limit,
  };
}

function mapRow(row: Record<string, unknown>): BusinessSummary {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: (row.description as string | null) ?? null,
    coverImageUrl: resolveImageUrl(row.cover_image_url as string | null),
    planTier: row.plan_tier as string,
    isVerified: row.is_verified as boolean,
    isTrusted: row.is_trusted as boolean,
    avgRating: Number(row.avg_rating),
    reviewCount: Number(row.review_count),
    priceRange: (row.price_range as string | null) ?? null,
    address: row.address as string,
    citySlug: row.city_slug as string,
    cityName: row.city_name as string,
    localitySlug: (row.locality_slug as string | null) ?? null,
    localityName: (row.locality_name as string | null) ?? null,
    areaSlug: (row.area_slug as string | null) ?? null,
    areaName: (row.area_name as string | null) ?? null,
    lat: row.lat != null ? Number(row.lat) : null,
    lng: row.lng != null ? Number(row.lng) : null,
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
    primaryCategoryName: (row.primary_category_name as string | null) ?? null,
    primaryCategorySlug: (row.primary_category_slug as string | null) ?? null,
    // business_hours (structured) is the single source of truth — NULL means no hours data
    // exists for this business, not "closed". See business.repository.ts's is_open_now CASE.
    isOpenNow: row.is_open_now as boolean | null,
    hasActiveOffer: Boolean(row.has_active_offer),
    score: Number(row.score),
  };
}

function logSearchAsync(input: SearchQueryInput, resultCount: number) {
  if (!input.q && !input.category && !input.city) return;
  prisma.searchLog
    .create({
      data: {
        query: input.q ?? null,
        categorySlug: input.category ?? null,
        citySlug: input.city ?? null,
        resultCount,
      },
    })
    .catch((err) => console.error("[search] failed to log search query:", err));
}

export async function search(input: SearchQueryInput): Promise<PaginatedResult<BusinessSummary>> {
  const params = toSearchParams(input);
  const [{ rows, total }, verifiedAvailable] = await Promise.all([
    searchBusinesses(params),
    hasVerifiedMatches(params),
  ]);

  const items = rows.map(mapRow);
  logSearchAsync(input, total);

  return {
    items,
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
    hasVerifiedMatches: verifiedAvailable,
  };
}
