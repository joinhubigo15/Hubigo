import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { resolveImageUrl } from "../lib/storage/resolve-image-url";

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: {
      // Businesses are tagged with the subcategory (child), never the sector row itself — see
      // bootstrap-categories.ts — so a sector's real count is the sum of its children's counts,
      // not its own direct businessCategories (which is always 0 by taxonomy design).
      children: { orderBy: { name: "asc" }, include: { _count: { select: { businessCategories: true } } } },
      _count: { select: { businessCategories: true } },
    },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    businessCount: c._count.businessCategories + c.children.reduce((sum, child) => sum + child._count.businessCategories, 0),
    subcategories: c.children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      icon: child.icon,
      businessCount: child._count.businessCategories,
    })),
  }));
}

export async function listCities() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });

  // Real, already-scraped pincode coverage per city — used on the city detail page as a trust
  // metric ("N Areas Covered") that's actually true, rather than a made-up round number.
  const pincodeRows = await prisma.$queryRaw<{ city_id: string; count: bigint }[]>`
    SELECT city_id, COUNT(DISTINCT pincode) AS count
    FROM businesses
    WHERE pincode IS NOT NULL
    GROUP BY city_id
  `;
  const pincodeCountByCity = new Map(pincodeRows.map((r) => [r.city_id, Number(r.count)]));

  return cities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    state: c.state,
    lat: c.lat,
    lng: c.lng,
    businessCount: c._count.businesses,
    pincodeCount: pincodeCountByCity.get(c.id) ?? 0,
  }));
}

export async function listLocalitiesForCity(citySlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) return [];

  const localities = await prisma.locality.findMany({
    where: { cityId: city.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true } } },
  });

  return localities.map((l) => ({
    id: l.id,
    name: l.name,
    slug: l.slug,
    pincode: l.pincode,
    businessCount: l._count.businesses,
  }));
}

// Resolves a single pincode_areas row for Area-pSEO page rendering (title, breadcrumb, canonical).
// Scoped by cityId as well as slug — see business.repository.ts's areaSlug filter comment for why
// slug alone isn't a safe unique key (one real area name collides across two cities).
export async function getAreaBySlug(citySlug: string, areaSlug: string) {
  const city = await prisma.city.findUnique({ where: { slug: citySlug } });
  if (!city) return null;

  const area = await prisma.pincodeArea.findFirst({
    where: { cityId: city.id, slug: areaSlug },
  });
  if (!area) return null;

  return {
    name: area.name,
    slug: area.slug,
    citySlug: city.slug,
    cityName: city.name,
  };
}

export async function listAmenities() {
  const amenities = await prisma.amenity.findMany({ orderBy: { name: "asc" } });
  return amenities.map((a) => ({ id: a.id, name: a.name, slug: a.slug, icon: a.icon }));
}

export async function listActiveOffers(limit: number) {
  const offers = await prisma.offer.findMany({
    where: {
      OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      business: { status: "approved", deletedAt: null },
    },
    include: {
      business: {
        select: { slug: true, name: true, planTier: true, categories: { where: { isPrimary: true }, select: { category: { select: { name: true } } } } },
      },
    },
    // Paid-tier businesses' offers surface first — same "premium first" priority used elsewhere
    // (compare, competitor-lead routing) — then most-recently-created.
    orderBy: [{ business: { planTier: "desc" } }, { createdAt: "desc" }],
    take: limit,
  });

  return offers.map((o) => ({
    id: o.id,
    title: o.title,
    description: o.description,
    discountLabel: o.discountLabel,
    validUntil: o.endDate,
    businessSlug: o.business.slug,
    businessName: o.business.name,
    category: o.business.categories[0]?.category.name ?? null,
  }));
}

export async function getPlatformStats() {
  const [businessCount, userCount, cityCount, reviewCount, categoryCount, pincodeRows] = await Promise.all([
    prisma.business.count({ where: { status: "approved", deletedAt: null } }),
    prisma.user.count(),
    prisma.city.count(),
    prisma.review.count({ where: { status: "APPROVED" } }),
    prisma.category.count({ where: { parentId: null } }),
    // Real, platform-wide distinct-pincode coverage — used as the "areas covered" trust metric
    // wherever a per-category or per-city figure would look smaller than it actually is.
    prisma.$queryRaw<{ cnt: bigint }[]>`SELECT COUNT(DISTINCT pincode) AS cnt FROM businesses WHERE pincode IS NOT NULL`,
  ]);
  return { businessCount, userCount, cityCount, reviewCount, categoryCount, pincodeCount: Number(pincodeRows[0]?.cnt ?? 0) };
}

/**
 * Top 10 businesses per top-level category, ranked by a real quality signal (rating + profile
 * completeness + trust — same idea as compare.service.ts's Hubigo Score) rather than a fixed
 * hand-picked list. A small deterministic per-ISO-week jitter (seeded off business id + week
 * number, so it's identical for every visitor within the week and only ever nudges near-ties)
 * makes the lineup visibly refresh week to week without the ranking becoming arbitrary.
 */
export async function getPopularByCategory(limitPerCategory = 10) {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH primary_category AS (
      SELECT bc.business_id, c.id AS category_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    ),
    scored AS (
      SELECT
        b.id, b.slug, b.name, b.cover_image_url, b.plan_tier, b.is_verified, b.is_trusted,
        b.avg_rating, b.review_count,
        city.slug AS city_slug, city.name AS city_name,
        loc.slug AS locality_slug, loc.name AS locality_name,
        top.id AS top_category_id, top.slug AS top_category_slug, top.name AS top_category_name,
        sub.name AS primary_category_name,
        (
          (b.avg_rating / 5.0) * 55
          + CASE WHEN b.phone IS NOT NULL THEN 8 ELSE 0 END
          + CASE WHEN b.website IS NOT NULL THEN 6 ELSE 0 END
          + CASE WHEN (SELECT COUNT(*) FROM business_media m WHERE m.business_id = b.id AND m.type = 'image') >= 3 THEN 8 ELSE 0 END
          + CASE WHEN b.open_hours_raw IS NOT NULL AND b.open_hours_raw <> '{}' THEN 8 ELSE 0 END
          + CASE WHEN b.is_verified THEN 8 ELSE 0 END
          + CASE WHEN b.is_trusted THEN 4 ELSE 0 END
          + CASE b.plan_tier WHEN 'elite' THEN 3 WHEN 'premium' THEN 2 ELSE 0 END
          + (abs(('x' || substr(md5(b.id || to_char(now(), 'IYYY-IW')), 1, 8))::bit(32)::int) % 100) / 100.0 * 4
        ) AS score
      FROM businesses b
      JOIN cities city ON city.id = b.city_id
      LEFT JOIN localities loc ON loc.id = b.locality_id
      JOIN primary_category pc ON pc.business_id = b.id
      JOIN categories sub ON sub.id = pc.category_id
      JOIN categories top ON top.id = COALESCE(sub.parent_id, sub.id)
      WHERE b.status = 'approved' AND b.deleted_at IS NULL
    ),
    ranked AS (
      SELECT *, ROW_NUMBER() OVER (PARTITION BY top_category_id ORDER BY score DESC) AS rn
      FROM scored
    )
    SELECT * FROM ranked WHERE rn <= ${limitPerCategory} ORDER BY top_category_name ASC, rn ASC
  `);

  const groups = new Map<string, { categorySlug: string; categoryName: string; businesses: unknown[] }>();
  for (const r of rows) {
    const slug = r.top_category_slug as string;
    if (!groups.has(slug)) {
      groups.set(slug, { categorySlug: slug, categoryName: r.top_category_name as string, businesses: [] });
    }
    groups.get(slug)!.businesses.push({
      id: r.id,
      slug: r.slug,
      name: r.name,
      coverImageUrl: resolveImageUrl(r.cover_image_url as string | null),
      planTier: r.plan_tier,
      isVerified: r.is_verified,
      isTrusted: r.is_trusted,
      avgRating: r.avg_rating,
      reviewCount: r.review_count,
      citySlug: r.city_slug,
      cityName: r.city_name,
      localitySlug: r.locality_slug,
      localityName: r.locality_name,
      primaryCategoryName: r.primary_category_name,
    });
  }

  return [...groups.values()];
}

export interface ResolvedAddress {
  lat: number;
  lng: number;
  addressName: string;
  citySlug: string;
}

/**
 * Resolves free-text ("Koramangala", "HITEC City, Hyderabad") or a 6-digit pincode to real
 * coordinates using ONLY our own City/Locality data — no external geocoding provider. Only ever
 * returns a match within a currently-supported city (today: Bangalore, Chennai, Hyderabad), so an
 * address outside our coverage correctly returns null instead of silently snapping to a default
 * city's coordinates.
 */
export async function resolveLocalAddress(query: string): Promise<ResolvedAddress | null> {
  const q = query.trim();
  if (!q) return null;

  const pincodeMatch = q.match(/\b(\d{6})\b/);
  if (pincodeMatch) {
    const locality = await prisma.locality.findFirst({
      where: { pincode: pincodeMatch[1] },
      include: { city: true },
    });
    if (locality) {
      const lat = locality.lat ?? locality.city.lat;
      const lng = locality.lng ?? locality.city.lng;
      if (lat != null && lng != null) {
        return { lat, lng, addressName: `${locality.name}, ${locality.city.name}`, citySlug: locality.city.slug };
      }
    }
  }

  // Prefer the most specific match: a locality name found inside the query beats a city name
  // found inside the query, so "Koramangala, Bangalore" resolves to Koramangala's coordinates,
  // not just Bangalore's city center.
  const localities = await prisma.locality.findMany({
    where: { lat: { not: null }, lng: { not: null } },
    include: { city: true },
  });
  const localityMatch = localities.find((l) => q.toLowerCase().includes(l.name.toLowerCase()));
  if (localityMatch && localityMatch.lat != null && localityMatch.lng != null) {
    return {
      lat: localityMatch.lat,
      lng: localityMatch.lng,
      addressName: `${localityMatch.name}, ${localityMatch.city.name}`,
      citySlug: localityMatch.city.slug,
    };
  }

  const cities = await prisma.city.findMany({ where: { lat: { not: null }, lng: { not: null } } });
  const cityMatch = cities.find((c) => q.toLowerCase().includes(c.name.toLowerCase()));
  if (cityMatch && cityMatch.lat != null && cityMatch.lng != null) {
    return { lat: cityMatch.lat, lng: cityMatch.lng, addressName: cityMatch.name, citySlug: cityMatch.slug };
  }

  return null;
}
