import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { resolveImageUrl, resolveMediaUrl } from "../lib/storage/resolve-image-url";

const PLAN_TIER_RANK: Record<string, number> = { elite: 3, premium: 2, basic: 1 };
const PLAN_TIER_SCORE: Record<string, number> = { basic: 0, premium: 2, elite: 3 };

function hasRealOpenHours(raw: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    return Object.values(parsed).some((hours) => Array.isArray(hours) && hours.length > 0);
  } catch {
    return false;
  }
}

/**
 * A single 0-100 "Hubigo Score" per business for at-a-glance comparison, built only from fields
 * that actually vary across the real dataset today (checked via a DB query before writing this:
 * isVerified/isTrusted/premium tiers are 100% false/basic right now, so they're weighted low and
 * contribute 0 for everyone currently — they activate automatically once verification/paid plans
 * launch, no formula change needed then).
 *   - Rating (0-55): (avgRating / 5) * 55 — the dominant, most-populated real signal.
 *   - Profile completeness (0-30): phone (+8), website (+6), 3+ real photos (+8), listed hours (+8).
 *   - Trust bonus (0-15): verified (+8), trusted (+4), premium/elite plan (+2/+3).
 */
function computeHubigoScore(b: CompareRow): number {
  const ratingScore = (b.avgRating / 5) * 55;

  let completeness = 0;
  if (b.phone) completeness += 8;
  if (b.website) completeness += 6;
  if (b.media.filter((m) => m.type === "image").length >= 3) completeness += 8;
  if (hasRealOpenHours(b.openHoursRaw)) completeness += 8;

  let trust = 0;
  if (b.isVerified) trust += 8;
  if (b.isTrusted) trust += 4;
  trust += PLAN_TIER_SCORE[b.planTier] ?? 0;

  return Math.round(ratingScore + completeness + trust);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const COMPARE_INCLUDE = {
  city: true,
  locality: true,
  categories: { include: { category: true }, where: { isPrimary: true } },
  amenities: { include: { amenity: true } },
  hours: true,
  media: { orderBy: { sortOrder: "asc" as const } },
  offers: { where: { OR: [{ endDate: null }, { endDate: { gte: new Date() } }] } },
} satisfies Prisma.BusinessInclude;

type CompareRow = Prisma.BusinessGetPayload<{ include: typeof COMPARE_INCLUDE }>;

function mapForCompare(b: CompareRow, distanceKm: number | null) {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    description: b.description,
    coverImageUrl: resolveImageUrl(b.coverImageUrl),
    logoUrl: resolveImageUrl(b.logoUrl),
    planTier: b.planTier,
    isVerified: b.isVerified,
    isTrusted: b.isTrusted,
    avgRating: b.avgRating,
    reviewCount: b.reviewCount,
    priceRange: b.priceRange,
    address: b.address,
    city: b.city.name,
    locality: b.locality?.name ?? null,
    phone: b.phone,
    whatsappPhone: b.whatsappPhone,
    website: b.website,
    openHoursRaw: b.openHoursRaw,
    distanceKm: distanceKm != null ? Math.round(distanceKm * 10) / 10 : null,
    primaryCategory: b.categories[0]?.category.name ?? null,
    amenities: b.amenities.map((ba) => ba.amenity.name),
    hours: b.hours.map((h) => ({
      day: h.day,
      openTime: h.openTime,
      closeTime: h.closeTime,
      isClosed: h.isClosed,
    })),
    photos: b.media.filter((m) => m.type === "image").map((m) => resolveMediaUrl(m)).filter((u): u is string => Boolean(u)),
    hasActiveOffer: b.offers.length > 0,
    hubigoScore: computeHubigoScore(b),
  };
}

export async function compareBusinesses(slugs: string[], userLat?: number, userLng?: number) {
  const businesses = await prisma.business.findMany({
    where: { slug: { in: slugs }, deletedAt: null, status: "approved" },
    include: COMPARE_INCLUDE,
  });

  if (businesses.length === 0) {
    throw ApiError.notFound("None of the requested businesses were found");
  }

  const sorted = [...businesses].sort((a, b) => {
    const tierDiff = PLAN_TIER_RANK[b.planTier] - PLAN_TIER_RANK[a.planTier];
    if (tierDiff !== 0) return tierDiff;
    return b.avgRating - a.avgRating;
  });

  return sorted.map((b) =>
    mapForCompare(
      b,
      userLat != null && userLng != null && b.lat != null && b.lng != null
        ? haversineKm(userLat, userLng, b.lat, b.lng)
        : null,
    ),
  );
}

/**
 * Auto-picks the top N businesses to compare within one subcategory, ranked nearest-first today
 * (every business is on the "basic" plan). Once premium/elite listings exist, the same SQL ORDER
 * BY (tier_rank DESC, distance ASC) surfaces them first without any code change — this is the
 * same "premium first, then nearest" priority compareBusinesses() already applies, just computed
 * in SQL so it scales to a subcategory with thousands of candidates instead of loading them all
 * into JS first (mirrors the nearest-competitor query in competitor-leads.service.ts).
 */
export async function compareNearbyBusinesses(
  categorySlug: string,
  userLat: number,
  userLng: number,
  limit = 5,
) {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { id: true, children: { select: { id: true } } },
  });
  if (!category) throw ApiError.notFound("Category not found");

  // A business's primary category is always the leaf subcategory, never the parent sector — so a
  // parent-level slug (e.g. "automotive-services") must match against all of its children too, or
  // it silently returns zero results despite thousands of businesses existing underneath it.
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];

  const ranked = await prisma.$queryRaw<{ id: string; distance_km: number }[]>(Prisma.sql`
    SELECT b.id,
      6371 * acos(LEAST(1, GREATEST(-1,
        cos(radians(${userLat}::float8)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(${userLng}::float8))
        + sin(radians(${userLat}::float8)) * sin(radians(b.lat))
      ))) AS distance_km
    FROM businesses b
    JOIN business_categories bc ON bc.business_id = b.id AND bc.category_id IN (${Prisma.join(categoryIds)}) AND bc.is_primary = true
    WHERE b.status = 'approved'::"BusinessStatus"
      AND b.deleted_at IS NULL
      AND b.lat IS NOT NULL AND b.lng IS NOT NULL
    ORDER BY (CASE b.plan_tier WHEN 'elite' THEN 3 WHEN 'premium' THEN 2 ELSE 1 END) DESC,
      distance_km ASC,
      b.avg_rating DESC,
      b.id ASC
    LIMIT ${limit}
  `);

  if (ranked.length === 0) return [];

  const ids = ranked.map((r) => r.id);
  const businesses = await prisma.business.findMany({ where: { id: { in: ids } }, include: COMPARE_INCLUDE });
  const distanceById = new Map(ranked.map((r) => [r.id, r.distance_km]));
  const byId = new Map(businesses.map((b) => [b.id, b]));

  // Re-apply the SQL-determined order — findMany({ id: { in } }) doesn't preserve input order.
  return ids
    .map((id) => byId.get(id))
    .filter((b): b is CompareRow => Boolean(b))
    .map((b) => mapForCompare(b, distanceById.get(b.id) ?? null));
}
