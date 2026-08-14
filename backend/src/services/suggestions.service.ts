import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface Suggestion {
  type: "business" | "category" | "locality" | "city";
  label: string;
  sublabel: string | null;
  slug: string;
  citySlug: string | null;
}

// A handful of sensible defaults shown before there's any real search-log traffic to learn
// popularity from — replaced automatically once SearchLog has data (see getPopularSearches).
const FALLBACK_POPULAR_SEARCHES = [
  "Restaurants near me",
  "Best gyms",
  "24 hour pharmacy",
  "AC repair service",
  "Wedding photographers",
  "Dental clinic",
];

export async function getSuggestions(q: string, limit: number): Promise<Suggestion[]> {
  // Categories and places are reserved slots, not pure rank-blended with businesses: for a short
  // query like "ho", individual business names ("Home", "Hof") routinely out-score the "Hotel"
  // category on raw trigram similarity alone (short strings are noisy), which was crowding
  // category/locality/city matches out of the results entirely — even though those are the more
  // useful, discovery-oriented suggestions (they help a user find the right search, not just spell
  // a specific business name they may not know exists). Categories get first claim on slots,
  // then localities/cities, and businesses fill whatever's left.
  const categoryLimit = Math.min(3, limit);
  const placeLimit = Math.min(2, limit);

  const rows = await prisma.$queryRaw<
    { type: Suggestion["type"]; label: string; sublabel: string | null; slug: string; city_slug: string | null }[]
  >(Prisma.sql`
    (
      SELECT 'category' AS type, c.name AS label, NULL AS sublabel, c.slug AS slug, NULL AS city_slug,
        similarity(c.name, ${q}) AS rank, 0 AS type_priority
      FROM categories c
      WHERE c.name ILIKE '%' || ${q} || '%'
      ORDER BY rank DESC
      LIMIT ${categoryLimit}
    )
    UNION ALL
    (
      SELECT 'locality' AS type, l.name AS label, city.name AS sublabel, l.slug AS slug, city.slug AS city_slug,
        similarity(l.name, ${q}) AS rank, 1 AS type_priority
      FROM localities l
      JOIN cities city ON city.id = l.city_id
      WHERE l.name ILIKE '%' || ${q} || '%'
      ORDER BY rank DESC
      LIMIT ${placeLimit}
    )
    UNION ALL
    (
      SELECT 'city' AS type, city.name AS label, city.state AS sublabel, city.slug AS slug, city.slug AS city_slug,
        similarity(city.name, ${q}) AS rank, 1 AS type_priority
      FROM cities city
      WHERE city.name ILIKE '%' || ${q} || '%'
      ORDER BY rank DESC
      LIMIT ${placeLimit}
    )
    UNION ALL
    (
      SELECT 'business' AS type, b.name AS label, city.name AS sublabel, b.slug AS slug, city.slug AS city_slug,
        similarity(b.name, ${q}) AS rank, 2 AS type_priority
      FROM businesses b
      JOIN cities city ON city.id = b.city_id
      WHERE b.deleted_at IS NULL AND b.status = 'approved' AND b.name ILIKE '%' || ${q} || '%'
      ORDER BY rank DESC
      LIMIT ${limit}
    )
    ORDER BY type_priority ASC, rank DESC
    LIMIT ${limit}
  `);

  return rows.map((r) => ({
    type: r.type,
    label: r.label,
    sublabel: r.sublabel,
    slug: r.slug,
    citySlug: r.city_slug,
  }));
}

export async function getPopularSearches(limit: number): Promise<string[]> {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const rows = await prisma.searchLog.groupBy({
    by: ["query"],
    where: { query: { not: null }, createdAt: { gte: since } },
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: limit,
  });

  const popular = rows.map((r) => r.query).filter((q): q is string => Boolean(q));
  return popular.length > 0 ? popular : FALLBACK_POPULAR_SEARCHES.slice(0, limit);
}
