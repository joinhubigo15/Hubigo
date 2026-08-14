import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { z } from "zod";
import { searchBusinesses } from "../repositories/business.repository";
import { prisma } from "../lib/prisma";
import { resolveImageUrl } from "../lib/storage/resolve-image-url";

const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().positive().max(200).optional(),
  radiusKm: z.coerce.number().positive().max(200).optional(),
  category: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  subcategory: z.string().trim().optional(),
  subcategoryId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  q: z.string().trim().optional(),
  openNow: z.coerce.boolean().optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  verified: z.coerce.boolean().optional(),
  offersOnly: z.coerce.boolean().optional(),
  offers: z.coerce.boolean().optional(),
  minRating: z.coerce.number().optional(),
  price: z.string().optional(),
  sort: z
    .enum(["distance", "rating", "reviews", "newest", "alphabetical", "best_match"])
    .default("distance"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export function formatDistance(distanceKm: number | null | undefined): string {
  if (distanceKm == null || isNaN(distanceKm)) return "Nearby";
  if (distanceKm < 1.0) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

export const getNearbyBusinesses = asyncHandler(async (req: Request, res: Response) => {
  const query = nearbyQuerySchema.parse(req.query);

  // Default fallback center (Bangalore center: 12.9716, 77.5946) if lat/lng missing
  const lat = query.lat ?? 12.9716;
  const lng = query.lng ?? 77.5946;
  const radiusKm = query.radiusKm ?? query.radius ?? 5.0;

  const searchQuery = query.search || query.q;
  const categorySlug = query.category || query.categoryId;
  const subcategorySlug = query.subcategory || query.subcategoryId;
  const openNow = query.openNow;
  const verifiedOnly = query.verifiedOnly ?? query.verified;
  const hasOffers = query.offersOnly ?? query.offers;

  const priceRanges = query.price
    ? (query.price.split(",").filter(Boolean) as any)
    : undefined;

  const { rows, total } = await searchBusinesses({
    q: searchQuery,
    categorySlug,
    subcategorySlug,
    lat,
    lng,
    radiusKm,
    openNow,
    verifiedOnly,
    hasOffers,
    minRating: query.minRating,
    priceRanges,
    sort: query.sort,
    page: query.page,
    limit: query.limit,
  });

  const formattedItems = rows.map((row) => {
    const distanceKm = row.distance_km != null ? Number(row.distance_km) : null;
    return {
      id: row.id as string,
      slug: row.slug as string,
      name: row.name as string,
      description: (row.description as string | null) ?? null,
      coverImageUrl: resolveImageUrl(row.cover_image_url as string | null),
      logoUrl: resolveImageUrl(row.logo_url as string | null),
      planTier: row.plan_tier as string,
      isVerified: Boolean(row.is_verified),
      isTrusted: Boolean(row.is_trusted),
      avgRating: Number(row.avg_rating),
      reviewCount: Number(row.review_count),
      priceRange: (row.price_range as string | null) ?? null,
      phone: (row.phone as string | null) ?? null,
      whatsappPhone: (row.whatsapp_phone as string | null) ?? null,
      address: row.address as string,
      cityName: row.city_name as string,
      localityName: (row.locality_name as string | null) ?? null,
      areaName: (row.area_name as string | null) ?? null,
      lat: row.lat != null ? Number(row.lat) : null,
      lng: row.lng != null ? Number(row.lng) : null,
      distanceKm,
      formattedDistance: formatDistance(distanceKm),
      primaryCategoryName: (row.primary_category_name as string | null) ?? "Service",
      primaryCategorySlug: (row.primary_category_slug as string | null) ?? "all",
      // business_hours (structured) is the single source of truth — NULL means no hours data
      // exists for this business, not "closed". See business.repository.ts's is_open_now CASE.
      isOpenNow: row.is_open_now as boolean | null,
      hasActiveOffer: Boolean(row.has_active_offer),
    };
  });

  // Calculate Smart Sections for AI / Highlights
  const trendingNearby = formattedItems.filter((i) => i.avgRating >= 4.5).slice(0, 4);
  const emergencyNearby = formattedItems.filter((i) =>
    ["healthcare", "hospitals", "pharmacy", "emergency", "repair"].some((k) =>
      (i.primaryCategorySlug || "").toLowerCase().includes(k)
    )
  ).slice(0, 4);

  return sendSuccess(res, 200, "Nearby businesses retrieved successfully", {
    items: formattedItems,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
    userLocation: {
      lat,
      lng,
      radiusKm,
    },
    smartSections: {
      trendingNearby,
      emergencyNearby,
    },
  });
});
