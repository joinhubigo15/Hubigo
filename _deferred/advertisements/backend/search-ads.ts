// Extracted from backend/src/controllers/search.controller.ts and backend/src/services/search.service.ts
// (the customer-facing "GET /api/v1/search/ads" endpoint powering the search page's AdCarousel).
// getAdCarouselBusinesses() was left in place in backend/src/repositories/business.repository.ts
// since it's just a query helper — restoring this feature only needs these two pieces pasted back.

// ── controller (search.controller.ts) ──────────────────────────────────────
//
// import { z } from "zod";
// import { getFeaturedAds } from "../services/search.service";
//
// const adsQuerySchema = z.object({
//   category: z.string().trim().optional(),
//   subcategory: z.string().trim().optional(),
//   city: z.string().trim().optional(),
//   lat: z.coerce.number().min(-90).max(90).optional(),
//   lng: z.coerce.number().min(-180).max(180).optional(),
// });
//
// export const getSearchAds = asyncHandler(async (req: Request, res: Response) => {
//   const input = adsQuerySchema.parse(req.query);
//   const ads = await getFeaturedAds(input);
//   return sendSuccess(res, 200, "Featured ads", ads);
// });
//
// and in search.routes.ts: router.get("/ads", getSearchAds);

// ── service (search.service.ts) ─────────────────────────────────────────────

import { prisma } from "../../../backend/src/lib/prisma";
import { getAdCarouselBusinesses } from "../../../backend/src/repositories/business.repository";
import { resolveImageUrl } from "../../../backend/src/lib/storage/resolve-image-url";

export interface AdBusiness {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  phone: string;
  planTier: string;
  distanceKm: number | null;
}

export interface AdsQueryInput {
  category?: string;
  subcategory?: string;
  city?: string;
  lat?: number;
  lng?: number;
}

export async function getFeaturedAds(input: AdsQueryInput): Promise<AdBusiness[]> {
  let lat = input.lat;
  let lng = input.lng;

  if ((lat == null || lng == null) && input.city) {
    const city = await prisma.city.findUnique({ where: { slug: input.city }, select: { lat: true, lng: true } });
    if (city?.lat != null && city?.lng != null) {
      lat = city.lat;
      lng = city.lng;
    }
  }

  const rows = await getAdCarouselBusinesses({
    categorySlug: input.category,
    subcategorySlug: input.subcategory,
    lat,
    lng,
  });

  return rows.map((row) => ({
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    coverImageUrl: resolveImageUrl(row.cover_image_url as string | null),
    phone: row.phone as string,
    planTier: row.plan_tier as string,
    distanceKm: row.distance_km != null ? Number(row.distance_km) : null,
  }));
}
