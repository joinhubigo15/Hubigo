import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { SearchParams, SortOption } from "../types/search.types";
import { NATIVE_RATING_ACTIVATION_THRESHOLD } from "../config/rating-thresholds";

interface LocationMatch {
  matchedCityId: string | null;
  matchedLocalityId: string | null;
  matchedAreaPincodes: string[] | null;
  matchedName: string | null;
  phaseSubQuery: string | null;
  remainingQuery: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Filler words that commonly surround a place name in colloquial search phrasing ("gyms IN
// koramangala", "salons NEAR me") but carry no matching signal of their own. Left in, they
// pollute the text-relevance filter/scoring below — e.g. "pool in" no longer ILIKE-matches
// "Pool Hall", starving a genuinely relevant business of its text-match score and letting an
// unrelated business with high non-text bonuses (verified/elite/rating) outrank it instead.
const LOCATION_STOPWORDS = ["near me", "nearby", "near", "around", "in", "at"];

function stripLocationStopwords(text: string): string {
  let result = text;
  for (const phrase of LOCATION_STOPWORDS) {
    result = result.replace(new RegExp(`\\b${phrase}\\b`, "gi"), " ");
  }
  return result.replace(/\s+/g, " ").trim();
}

interface CachedLocationName {
  id: string;
  name: string;
  nameLower: string;
  kind: "city" | "locality" | "area";
  cityId: string | null;
}

// `trimmed ILIKE '%' || name || '%'` can never use an index — the wildcard pattern is built
// per-row from `name`, not a static literal, so Postgres has no choice but to sequentially scan
// localities/cities/pincode_areas on EVERY search request. pincode_areas in particular is large
// (backfilled per-pincode across all seeded cities), so this was a real, request-visible slowdown
// in production, not just a dev-mode artifact. Caching the (small, slow-changing) set of distinct
// location names in memory and matching in JS removes the DB round-trip from the hot path entirely.
let locationNameCache: CachedLocationName[] | null = null;
let locationNameCacheLoadedAt = 0;
const LOCATION_NAME_CACHE_TTL_MS = 5 * 60 * 1000;

async function getLocationNameCache(): Promise<CachedLocationName[]> {
  const now = Date.now();
  if (locationNameCache && now - locationNameCacheLoadedAt < LOCATION_NAME_CACHE_TTL_MS) {
    return locationNameCache;
  }

  const rows = await prisma.$queryRaw<
    { id: string; name: string; kind: "city" | "locality" | "area"; city_id: string | null }[]
  >(Prisma.sql`
    SELECT id, name, 'locality' AS kind, city_id FROM localities
    UNION ALL
    SELECT id, name, 'city' AS kind, NULL AS city_id FROM cities
    UNION ALL
    SELECT id, name, 'area' AS kind, city_id FROM pincode_areas
  `);

  locationNameCache = rows.map((r) => ({ id: r.id, name: r.name, nameLower: r.name.toLowerCase(), kind: r.kind, cityId: r.city_id }));
  locationNameCacheLoadedAt = now;
  return locationNameCache;
}

/**
 * Free-text queries like "Gym Koramangala" mix a keyword with a place name. This pulls out
 * the longest known city/locality name that appears in the query (if any) so it can drive a
 * location-match score boost, and returns what's left over for the text-relevance side of
 * the score. Explicit filters (citySlug/localitySlug from the filter sidebar) are handled
 * separately as hard WHERE clauses — this is only for signal buried inside free text.
 */
async function resolveLocationFromQuery(q: string): Promise<LocationMatch> {
  const trimmed = q.trim();
  if (!trimmed) {
    return { matchedCityId: null, matchedLocalityId: null, matchedAreaPincodes: null, matchedName: null, phaseSubQuery: null, remainingQuery: "" };
  }

  const trimmedLower = trimmed.toLowerCase();
  const names = await getLocationNameCache();
  const candidates = names.filter((n) => trimmedLower.includes(n.nameLower));
  candidates.sort((a, b) => b.name.length - a.name.length || (b.kind === "area" ? 1 : 0) - (a.kind === "area" ? 1 : 0));

  const match = candidates[0];
  const phaseMatch = trimmed.match(/(?:phase|block|stage|sector|layout|zone)\s*\d+|\d+(?:st|nd|rd|th)?\s*(?:phase|block|stage|sector|layout|zone)/i);
  const phaseSubQuery = phaseMatch ? phaseMatch[0] : null;

  let withoutLocation = trimmed;
  if (match) {
    withoutLocation = withoutLocation.replace(new RegExp(escapeRegExp(match.name), "i"), "");
  }
  if (phaseSubQuery) {
    withoutLocation = withoutLocation.replace(new RegExp(escapeRegExp(phaseSubQuery), "i"), "");
  }

  if (!match && !phaseSubQuery) {
    return { matchedCityId: null, matchedLocalityId: null, matchedAreaPincodes: null, matchedName: null, phaseSubQuery: null, remainingQuery: stripLocationStopwords(trimmed) };
  }

  let matchedAreaPincodes: string[] | null = null;
  if (match && match.kind === "area") {
    const pincodeRows = await prisma.$queryRaw<{ pincode: string }[]>(
      Prisma.sql`SELECT DISTINCT pincode FROM pincode_areas WHERE name = ${match.name}`
    );
    matchedAreaPincodes = pincodeRows.map((r) => r.pincode);
  }

  return {
    matchedCityId: match ? (match.kind === "city" ? match.id : match.cityId) : null,
    matchedLocalityId: match ? (match.kind === "locality" ? match.id : null) : null,
    matchedAreaPincodes,
    matchedName: match ? match.name : null,
    phaseSubQuery,
    remainingQuery: stripLocationStopwords(withoutLocation),
  };
}

function getCurrentIstDayAndTime() {
  const now = new Date();
  const day = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Kolkata", weekday: "long" })
    .format(now)
    .toLowerCase();
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  return { day, time };
}

function buildOrderBy(sort: SortOption, hasCoordinates: boolean): Prisma.Sql {
  const tieBreak = (() => {
    switch (sort) {
      case "distance":
        return hasCoordinates
          ? Prisma.sql`distance_km ASC NULLS LAST, score DESC`
          : Prisma.sql`score DESC`;
      case "rating":
        return Prisma.sql`avg_rating DESC, review_count DESC, plan_tier_rank DESC`;
      case "reviews":
        return Prisma.sql`review_count DESC, avg_rating DESC, plan_tier_rank DESC`;
      case "newest":
        return Prisma.sql`created_at DESC, plan_tier_rank DESC`;
      case "alphabetical":
        return Prisma.sql`name ASC`;
      case "best_match":
      default:
        // A search that resolves to many essentially-interchangeable results — a category/
        // subcategory name match ("medical shops"), or several businesses sharing the same/near-
        // identical name (chain branches, or just a common name like "Udupi Hotel") — should default
        // to nearest-first, since relevance can't meaningfully distinguish between them. A search
        // that resolves to one specific, uniquely-named business is unaffected: this CASE evaluates
        // to NULL for it, so it falls straight through to relevance (score) ranking as before.
        return hasCoordinates
          ? Prisma.sql`CASE WHEN category_match_tier > 0 OR name_match_count > 1 THEN distance_km END ASC NULLS LAST, score DESC, distance_km ASC NULLS LAST, review_count DESC`
          : Prisma.sql`score DESC, review_count DESC`;
    }
  })();

  // Three ordering tiers, each a no-op (0/equal for every row) when not applicable:
  //   1. exact_category_match — an explicit ?subcategory= filter's exact tag always beats a
  //      same-parent "related" sibling.
  //   2. category_match_tier — for free-text queries that happen to match a category NAME (e.g.
  //      "Schools" ILIKE-matching both "Play School" and "Sports School"), an exact/prefix name
  //      match outranks a loose substring one.
  //   3. primary_category_slug — ONLY among rows that actually matched the query's category name
  //      (tier > 0) — clusters them into one contiguous block per category instead of interleaving
  //      two matching categories row-by-row on near-tied score, so a user sees every relevant
  //      "Play School" before any "Sports School" rather than alternating. Every row where the
  //      tier is 0 (no category-name match — the common case, e.g. a name search) gets NULL here,
  //      so they all tie and fall through to score-based ordering exactly as before; clustering
  //      by slug must never apply outside a real category-name match, or irrelevant categories
  //      would dominate the page purely by alphabetical accident.
  const categoryCluster = Prisma.sql`CASE WHEN category_match_tier > 0 THEN primary_category_slug END ASC NULLS LAST`;
  return Prisma.sql`ORDER BY exact_category_match DESC, category_match_tier DESC, ${categoryCluster}, ${tieBreak}`;
}

export async function searchBusinesses(params: SearchParams) {
  const rawQuery = (params.q ?? "").trim();
  const location = await resolveLocationFromQuery(rawQuery);
  const textQuery = location.remainingQuery;
  // Tolerates a plural query ("Schools") against our taxonomy's singular category names ("Play
  // School") — without this, ILIKE substring matching against the category name fails outright
  // and category-name relevance silently falls back to raw name-similarity scoring instead.
  const textQuerySingular =
    textQuery.length > 3 && /[a-z]s$/i.test(textQuery) && !/ss$/i.test(textQuery)
      ? textQuery.slice(0, -1)
      : textQuery;
  const { day: currentDay, time: currentTime } = getCurrentIstDayAndTime();

  const baseFilters: Prisma.Sql[] = [
    Prisma.sql`b.deleted_at IS NULL`,
    Prisma.sql`b.status = 'approved'`,
  ];

  if (location.matchedLocalityId) {
    const mName = location.matchedName || "";
    const withSpaces = mName.replace(/([A-Z])([A-Z])/g, "$1 $2");
    const withDots = mName.replace(/([A-Z])([A-Z])/g, "$1. $2.");
    const withDotNoSpace = mName.replace(/([A-Z])([A-Z])/g, "$1.$2.");
    baseFilters.push(Prisma.sql`(
      b.locality_id = ${location.matchedLocalityId}
      OR b.address ILIKE '%' || ${mName} || '%'
      OR b.address ILIKE '%' || ${withSpaces} || '%'
      OR b.address ILIKE '%' || ${withDots} || '%'
      OR b.address ILIKE '%' || ${withDotNoSpace} || '%'
      OR (loc.name IS NOT NULL AND loc.name ILIKE '%' || ${mName} || '%')
    )`);
  } else if (location.matchedName) {
    const mName = location.matchedName;
    const withSpaces = mName.replace(/([A-Z])([A-Z])/g, "$1 $2");
    const withDots = mName.replace(/([A-Z])([A-Z])/g, "$1. $2.");
    const withDotNoSpace = mName.replace(/([A-Z])([A-Z])/g, "$1.$2.");
    baseFilters.push(Prisma.sql`(
      b.address ILIKE '%' || ${mName} || '%'
      OR b.address ILIKE '%' || ${withSpaces} || '%'
      OR b.address ILIKE '%' || ${withDots} || '%'
      OR b.address ILIKE '%' || ${withDotNoSpace} || '%'
      OR (loc.name IS NOT NULL AND loc.name ILIKE '%' || ${mName} || '%')
      ${location.matchedAreaPincodes && location.matchedAreaPincodes.length > 0
        ? Prisma.sql`OR b.pincode IN (${Prisma.join(location.matchedAreaPincodes)})`
        : Prisma.sql``}
    )`);
  }

  if (location.phaseSubQuery) {
    const num = location.phaseSubQuery.match(/\d+/)?.[0] || "";
    if (num) {
      baseFilters.push(Prisma.sql`(
        b.address ILIKE '%' || ${num} || '%'
        OR b.address ILIKE '%' || ${location.phaseSubQuery} || '%'
      )`);
    }
  }

  if (params.citySlug) {
    baseFilters.push(Prisma.sql`city.slug = ${params.citySlug}`);
  }
  if (params.localitySlug) {
    baseFilters.push(Prisma.sql`loc.slug = ${params.localitySlug}`);
  }
  if (params.areaSlug) {
    // Scoped by city.id as well as pincode/slug — one real area name ("Milk Colony") collides
    // across two different cities in the source data, so slug alone isn't a safe unique key.
    baseFilters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM pincode_areas pa
      WHERE pa.pincode = b.pincode AND pa.slug = ${params.areaSlug} AND pa.city_id = city.id
    )`);
  }
  if (params.pincode) {
    baseFilters.push(Prisma.sql`b.pincode = ${params.pincode}`);
  }
  if (params.verifiedOnly) {
    baseFilters.push(Prisma.sql`b.is_verified = true`);
  }
  if (typeof params.minRating === "number") {
    baseFilters.push(Prisma.sql`b.avg_rating >= ${params.minRating}`);
  }
  if (params.priceRanges && params.priceRanges.length > 0) {
    baseFilters.push(
      Prisma.sql`b.price_range IN (${Prisma.join(params.priceRanges.map((p) => Prisma.sql`${p}::"PriceRange"`))})`
    );
  }
  if (params.planTiers && params.planTiers.length > 0) {
    baseFilters.push(
      Prisma.sql`b.plan_tier IN (${Prisma.join(params.planTiers.map((p) => Prisma.sql`${p}::"PlanTier"`))})`
    );
  }
  // Matching is scoped to each business's real PRIMARY category only (via the `pc` CTE joined
  // below), never any secondary tag — secondary tags on imported data are frequently unrelated
  // noise from the scraper's duplicate-merge step (e.g. a CA firm also carrying "restaurant",
  // "hotel", "hall" tags from a bad phone/geo match), and matching against them surfaced
  // completely unrelated businesses in subcategory search results.
  const categoryConditions: Prisma.Sql[] = [];
  if (params.subcategorySlug) {
    categoryConditions.push(Prisma.sql`(
      EXISTS (
        SELECT 1 FROM business_categories bc_sub
        JOIN categories c_sub ON c_sub.id = bc_sub.category_id
        WHERE bc_sub.business_id = b.id AND (
          c_sub.slug = ${params.subcategorySlug}
          OR c_sub.parent_id = (SELECT parent_id FROM categories WHERE slug = ${params.subcategorySlug})
          OR c_sub.parent_id = (SELECT id FROM categories WHERE slug = ${params.subcategorySlug})
        )
      )
    )`);
  } else if (params.categorySlug) {
    categoryConditions.push(Prisma.sql`(
      EXISTS (
        SELECT 1 FROM business_categories bc_cat
        JOIN categories c_cat ON c_cat.id = bc_cat.category_id
        WHERE bc_cat.business_id = b.id AND (
          c_cat.slug = ${params.categorySlug}
          OR c_cat.parent_id = (SELECT id FROM categories WHERE slug = ${params.categorySlug})
        )
      )
    )`);
  }

  if (categoryConditions.length > 0) {
    baseFilters.push(Prisma.sql`(${Prisma.join(categoryConditions, " OR ")})`);
  }

  if (textQuery) {
    const textMatchConditions: Prisma.Sql[] = [
      Prisma.sql`b.name % ${textQuery}`,
      Prisma.sql`b.name ILIKE '%' || ${textQuery} || '%'`,
      Prisma.sql`b.description ILIKE '%' || ${textQuery} || '%'`,
      Prisma.sql`b.address ILIKE '%' || ${textQuery} || '%'`,
      Prisma.sql`pc.category_name ILIKE '%' || ${textQuery} || '%'`,
      Prisma.sql`EXISTS (
        SELECT 1 FROM business_categories bc2
        JOIN categories c2 ON c2.id = bc2.category_id
        WHERE bc2.business_id = b.id AND (c2.name ILIKE '%' || ${textQuery} || '%' OR c2.slug ILIKE '%' || ${textQuery} || '%')
      )`,
      Prisma.sql`EXISTS (SELECT 1 FROM unnest(b.keywords) k WHERE k ILIKE '%' || ${textQuery} || '%')`,
      Prisma.sql`EXISTS (SELECT 1 FROM business_services bs WHERE bs.business_id = b.id AND bs.name ILIKE '%' || ${textQuery} || '%')`
    ];
    // Healthcare Category Synonym Mappings (e.g. "medical", "chemist", "medical store" -> Pharmacies & Chemists)
    const lowerTQ = textQuery.toLowerCase().trim();

    if (/^(medical|medicals|medical store|medical shop|chemist|chemist shop|pharmacy|pharmacies)$/i.test(lowerTQ)) {
      textMatchConditions.push(
        Prisma.sql`b.name ILIKE '%pharmacy%' OR b.name ILIKE '%chemist%' OR b.name ILIKE '%medical%'`,
        Prisma.sql`EXISTS (
          SELECT 1 FROM business_categories bc_p
          JOIN categories c_p ON c_p.id = bc_p.category_id
          WHERE bc_p.business_id = b.id AND c_p.slug IN ('pharmacies', '24-7-pharmacy', 'hospitals')
        )`
      );
    } else if (/^(lab|pathology|blood test|diagnostic|scan|x-ray|mri|ct scan)$/i.test(lowerTQ)) {
      textMatchConditions.push(
        Prisma.sql`b.name ILIKE '%lab%' OR b.name ILIKE '%diagnostic%' OR b.name ILIKE '%pathology%'`,
        Prisma.sql`EXISTS (
          SELECT 1 FROM business_categories bc_d
          JOIN categories c_d ON c_d.id = bc_d.category_id
          WHERE bc_d.business_id = b.id AND c_d.slug IN ('diagnostic-labs', 'pathology-lab')
        )`
      );
    } else if (/^(doctor|opd|clinic|physician|specialist)$/i.test(lowerTQ)) {
      textMatchConditions.push(
        Prisma.sql`b.name ILIKE '%clinic%' OR b.name ILIKE '%dr%' OR b.name ILIKE '%doctor%'`,
        Prisma.sql`EXISTS (
          SELECT 1 FROM business_categories bc_doc
          JOIN categories c_doc ON c_doc.id = bc_doc.category_id
          WHERE bc_doc.business_id = b.id AND c_doc.slug IN ('doctors-clinics', 'general-physician')
        )`
      );
    }

    if (textQuerySingular !== textQuery) {
      textMatchConditions.push(
        Prisma.sql`b.name ILIKE '%' || ${textQuerySingular} || '%'`,
        Prisma.sql`pc.category_name ILIKE '%' || ${textQuerySingular} || '%'`,
        Prisma.sql`EXISTS (
          SELECT 1 FROM business_categories bc2
          JOIN categories c2 ON c2.id = bc2.category_id
          WHERE bc2.business_id = b.id AND (c2.name ILIKE '%' || ${textQuerySingular} || '%' OR c2.slug ILIKE '%' || ${textQuerySingular} || '%')
        )`
      );
    }
    baseFilters.push(Prisma.sql`(${Prisma.join(textMatchConditions, " OR ")})`);
  }
  if (params.amenitySlugs && params.amenitySlugs.length > 0) {
    // Business must have ALL selected amenities (narrowing filter, not "any of").
    baseFilters.push(Prisma.sql`(
      SELECT COUNT(DISTINCT a.slug) FROM business_amenities ba
      JOIN amenities a ON a.id = ba.amenity_id
      WHERE ba.business_id = b.id AND a.slug IN (${Prisma.join(params.amenitySlugs)})
    ) = ${params.amenitySlugs.length}`);
  }

  const hasCoordinates = typeof params.lat === "number" && !isNaN(params.lat) && typeof params.lng === "number" && !isNaN(params.lng);
  const userLat = hasCoordinates ? params.lat! : null;
  const userLng = hasCoordinates ? params.lng! : null;

  const postFilters: Prisma.Sql[] = [];
  if (params.openNow) {
    postFilters.push(Prisma.sql`is_open_now = true`);
  }
  if (params.hasOffers) {
    postFilters.push(Prisma.sql`has_active_offer = true`);
  }
  if (hasCoordinates && params.radiusKm) {
    // We're inside hasCoordinates, so a NULL distance_km here only ever means the BUSINESS is
    // missing lat/lng (not the user) — exclude it rather than letting it leak into every radius
    // search regardless of location, which an "IS NULL OR" would do.
    postFilters.push(Prisma.sql`distance_km <= ${params.radiusKm}`);
  }

  const whereClause =
    baseFilters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(baseFilters, " AND ")}` : Prisma.empty;
  const havingClause =
    postFilters.length > 0 ? Prisma.sql`WHERE ${Prisma.join(postFilters, " AND ")}` : Prisma.empty;

  const offset = (params.page - 1) * params.limit;
  const orderBy = buildOrderBy(params.sort, hasCoordinates);

  // Shared so distance only has to be computed once per row and reused both as the displayed
  // distance_km column and as a proximity term folded into score (see below).
  const distanceExpr = Prisma.sql`CASE WHEN ${userLat}::float8 IS NOT NULL AND ${userLng}::float8 IS NOT NULL AND b.lat IS NOT NULL AND b.lng IS NOT NULL THEN
    6371 * acos(LEAST(1, GREATEST(-1,
      cos(radians(${userLat}::float8)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(${userLng}::float8))
      + sin(radians(${userLat}::float8)) * sin(radians(b.lat))
    )))
  ELSE NULL END`;

  // A business imported with 0 reviews has no imported rating to protect — once it earns enough
  // native, APPROVED reviews (nr.native_count), its badge switches from "no rating yet" to a live
  // average of those. A business imported WITH a real rating (b.review_count > 0) keeps that
  // frozen snapshot untouched. See rating-thresholds.ts. Shared so both the displayed rating
  // columns and the score formula below use the same effective value, consistently.
  const effectiveAvgRatingExpr = Prisma.sql`CASE
    WHEN b.review_count > 0 THEN b.avg_rating
    WHEN nr.native_count >= ${NATIVE_RATING_ACTIVATION_THRESHOLD} THEN nr.native_avg
    ELSE 0
  END`;
  const effectiveReviewCountExpr = Prisma.sql`CASE
    WHEN b.review_count > 0 THEN b.review_count
    WHEN nr.native_count >= ${NATIVE_RATING_ACTIVATION_THRESHOLD} THEN nr.native_count
    ELSE 0
  END`;

  // Cheap COUNT decoupled from the expensive row-fetch pipeline below — see base_candidates'
  // comment for why the row pipeline is capped, which would otherwise make total_count wrong for
  // a broad search. Doesn't account for openNow/hasOffers postFilters (those require the expensive
  // per-row computation this split is specifically avoiding) — an accepted minor imprecision (the
  // count can slightly overstate results when either toggle is on) in exchange for the fix below.
  const countPromise = prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    WITH primary_category AS (
      SELECT bc.business_id, c.name AS category_name, c.slug AS category_slug, c.parent_id AS category_parent_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    )
    SELECT COUNT(*) AS count
    FROM businesses b
    JOIN cities city ON city.id = b.city_id
    LEFT JOIN localities loc ON loc.id = b.locality_id
    LEFT JOIN primary_category pc ON pc.business_id = b.id
    ${whereClause}
  `);

  // A broad/unfiltered search's baseFilters barely narrow the ~300k+ approved-businesses table at
  // all, but the per-row work below (reviews aggregate, area lookup, is_open_now, has_active_offer
  // — each a correlated subquery) used to run for the WHOLE matched set before ORDER BY + LIMIT
  // trimmed it to a page, which is exactly why every search was taking 3-4s+ in production
  // regardless of filters. base_candidates filters + cheap-sorts + caps to a generous but bounded
  // pool FIRST, so the expensive per-row work below only ever runs against <= CANDIDATE_POOL_SIZE
  // rows. A real text query already narrows baseFilters tightly on its own (rarely near this cap);
  // this only meaningfully engages for broad, filter-less browsing, where a large top-N by a cheap
  // heuristic (paid tier, then stored rating) before full scoring is a standard, safe trade-off —
  // the alternative (scoring literally everything) is what was actually slow.
  const CANDIDATE_POOL_SIZE = 400;

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    WITH primary_category AS (
      SELECT bc.business_id, c.name AS category_name, c.slug AS category_slug, c.parent_id AS category_parent_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    ),
    base_candidates AS (
      SELECT b.*, city.slug AS city_slug, city.name AS city_name,
        loc.slug AS locality_slug, loc.name AS locality_name,
        pc.category_name AS primary_category_name, pc.category_slug AS primary_category_slug
      FROM businesses b
      JOIN cities city ON city.id = b.city_id
      LEFT JOIN localities loc ON loc.id = b.locality_id
      LEFT JOIN primary_category pc ON pc.business_id = b.id
      ${whereClause}
      ORDER BY (b.plan_tier != 'basic') DESC, b.avg_rating DESC NULLS LAST
      LIMIT ${CANDIDATE_POOL_SIZE}
    ),
    scored AS (
      SELECT
        b.id, b.slug, b.name, b.description, b.cover_image_url, b.logo_url, b.open_hours_raw, b.plan_tier,
        b.is_verified, b.is_trusted,
        ${effectiveAvgRatingExpr} AS avg_rating, ${effectiveReviewCountExpr} AS review_count,
        b.price_range,
        b.address, b.lat, b.lng, b.phone, b.whatsapp_phone, b.created_at,
        CASE b.plan_tier WHEN 'elite' THEN 3 WHEN 'premium' THEN 2 ELSE 1 END AS plan_tier_rank,
        b.city_slug, b.city_name, b.locality_slug, b.locality_name,
        COALESCE(
          b.locality_name,
          (CASE
            WHEN b.address ILIKE '%JP Nagar%' OR b.address ILIKE '%J. P. Nagar%' OR b.address ILIKE '%J.P. Nagar%' THEN 'JP Nagar'
            WHEN b.address ILIKE '%Indiranagar%' THEN 'Indiranagar'
            WHEN b.address ILIKE '%Whitefield%' THEN 'Whitefield'
            WHEN b.address ILIKE '%HSR Layout%' THEN 'HSR Layout'
            WHEN b.address ILIKE '%Koramangala%' THEN 'Koramangala'
            WHEN b.address ILIKE '%Rajajinagar%' THEN 'Rajajinagar'
            WHEN b.address ILIKE '%Jayanagar%' THEN 'Jayanagar'
            WHEN b.address ILIKE '%Hebbal%' THEN 'Hebbal'
            WHEN b.address ILIKE '%Electronic City%' THEN 'Electronic City'
            WHEN b.address ILIKE '%Banashankari%' THEN 'Banashankari'
            WHEN b.address ILIKE '%BTM Layout%' THEN 'BTM Layout'
            WHEN b.address ILIKE '%Marathahalli%' THEN 'Marathahalli'
            WHEN b.address ILIKE '%Yelahanka%' THEN 'Yelahanka'
            WHEN b.address ILIKE '%Malleshwaram%' THEN 'Malleshwaram'
            WHEN b.address ILIKE '%Sarjapur%' THEN 'Sarjapur'
            WHEN b.address ILIKE '%Bellandur%' THEN 'Bellandur'
            ELSE area.name
          END),
          'Bangalore'
        ) AS area_name,
        COALESCE(area.slug, 'bangalore') AS area_slug,
        b.primary_category_name, b.primary_category_slug,
        CASE WHEN ${params.subcategorySlug ?? null}::text IS NOT NULL
          AND b.primary_category_slug = ${params.subcategorySlug ?? null}::text
          THEN 1 ELSE 0 END AS exact_category_match,
        CASE
          WHEN ${textQuery} = '' OR b.primary_category_name IS NULL THEN 0
          WHEN lower(b.primary_category_name) IN (lower(${textQuery}), lower(${textQuerySingular})) THEN 3
          WHEN b.primary_category_name ILIKE ${textQuery} || '%' OR b.primary_category_name ILIKE ${textQuerySingular} || '%' THEN 2
          WHEN b.primary_category_name ILIKE '%' || ${textQuery} || '%' OR b.primary_category_name ILIKE '%' || ${textQuerySingular} || '%' THEN 1
          ELSE 0
        END AS category_match_tier,
        -- How many other candidates in THIS result set share the same business name (case-
        -- insensitive) — catches chain branches and repeated common names (e.g. "Udupi Hotel")
        -- even when the query didn't match a category name at all. See buildOrderBy's best_match.
        COUNT(*) OVER (PARTITION BY lower(b.name)) AS name_match_count,
        -- No dashboard UI currently lets a business create an Offer (the backend endpoint exists
        -- but is unreachable in practice), so this was a guaranteed-false EXISTS subquery running
        -- on every row for nothing. Hardcoded until the feature actually ships.
        FALSE AS has_active_offer,
        -- NULL when the business has no structured hours at all (status unknown/unavailable),
        -- distinct from FALSE (has hours, just not open right now) — business_hours is the single
        -- source of truth here, never a fallback to the scraper's raw text (see business-hours.ts).
        CASE
          WHEN NOT EXISTS (SELECT 1 FROM business_hours bh0 WHERE bh0.business_id = b.id) THEN NULL
          WHEN EXISTS (
            SELECT 1 FROM business_hours bh WHERE bh.business_id = b.id
            AND bh.day::text = ${currentDay} AND bh.is_closed = false
            AND bh.open_time IS NOT NULL AND bh.close_time IS NOT NULL
            AND bh.open_time <= ${currentTime} AND bh.close_time >= ${currentTime}
          ) THEN TRUE
          ELSE FALSE
        END AS is_open_now,
        ${distanceExpr} AS distance_km,
        (
          COALESCE(GREATEST(
            similarity(b.name, ${textQuery}) * 100,
            CASE WHEN ${textQuery} <> '' AND b.name ILIKE '%' || ${textQuery} || '%' THEN 60 ELSE 0 END,
            CASE WHEN ${textQuery} <> '' AND (b.primary_category_name ILIKE '%' || ${textQuery} || '%' OR b.primary_category_name ILIKE '%' || ${textQuerySingular} || '%') THEN 55 ELSE 0 END,
            CASE WHEN ${textQuery} <> '' AND EXISTS (
              SELECT 1 FROM unnest(b.keywords) k WHERE k ILIKE '%' || ${textQuery} || '%'
            ) THEN 45 ELSE 0 END,
            CASE WHEN ${textQuery} <> '' AND EXISTS (
              SELECT 1 FROM business_services bs WHERE bs.business_id = b.id AND bs.name ILIKE '%' || ${textQuery} || '%'
            ) THEN 40 ELSE 0 END,
            CASE WHEN ${textQuery} = '' THEN 30 ELSE 0 END
          ), 0)
          + CASE
              -- Area names (Whitefield, Koramangala, ...) live in pincode_areas and are matched via
              -- Business.pincode, not a locality FK — see PincodeArea's model comment for why. Scored
              -- above locality since it's the more specific, most-recently-populated location signal.
              WHEN ${location.matchedAreaPincodes}::text[] IS NOT NULL AND b.pincode = ANY(${location.matchedAreaPincodes}::text[]) THEN 90
              WHEN ${location.matchedLocalityId}::text IS NOT NULL AND b.locality_id = ${location.matchedLocalityId}::text THEN 80
              WHEN ${location.matchedCityId}::text IS NOT NULL AND b.city_id = ${location.matchedCityId}::text THEN 55
              ELSE 0
            END
          -- Proximity is a modest bonus (0-15pts, decaying to 0 by 15km), not a filter: it's enough
          -- to break ties between equally-relevant matches (e.g. several branches of the same chain
          -- all matching the query name — nearest branch wins) without letting a nearby-but-irrelevant
          -- business outrank a genuinely matching one further away.
          + COALESCE(GREATEST(0, 15 - LEAST(${distanceExpr}, 15)), 0)
          + CASE b.plan_tier WHEN 'elite' THEN 12 WHEN 'premium' THEN 6 ELSE 0 END
          + CASE WHEN b.is_verified THEN 5 ELSE 0 END
          + CASE WHEN b.is_trusted THEN 3 ELSE 0 END
          + (${effectiveAvgRatingExpr} / 5.0) * 10
          + LN(1 + ${effectiveReviewCountExpr}) * 2
          + (
              (CASE WHEN b.description IS NOT NULL AND length(b.description) > 20 THEN 1 ELSE 0 END) +
              (CASE WHEN b.cover_image_url IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN b.logo_url IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN b.website IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN b.phone IS NOT NULL THEN 1 ELSE 0 END) +
              (CASE WHEN array_length(b.keywords, 1) > 0 THEN 1 ELSE 0 END)
            ) * 1.5
          + LN(1 + b.view_count) * 2
        ) AS score
      FROM base_candidates b
      LEFT JOIN LATERAL (
        SELECT COUNT(*) AS native_count, AVG(r.rating) AS native_avg
        FROM reviews r WHERE r.business_id = b.id AND r.status = 'APPROVED'
      ) nr ON true
      LEFT JOIN LATERAL (
        SELECT pa.name, pa.slug
        FROM pincode_areas pa
        WHERE pa.pincode = b.pincode AND pa.city_id = b.city_id AND pa.is_primary = true
        LIMIT 1
      ) area ON true
    )
    SELECT *
    FROM scored
    ${havingClause}
    ${orderBy}
    LIMIT ${params.limit} OFFSET ${offset}
  `);

  const countRows = await countPromise;
  const total = Number(countRows[0]?.count ?? 0);

  return { rows, total };
}

const AD_CAROUSEL_LIMIT = 5;

interface AdCarouselParams {
  categorySlug?: string;
  subcategorySlug?: string;
  lat?: number;
  lng?: number;
}

/**
 * Featured-ads carousel for the search results page: businesses in the searched category,
 * paid-plan (premium/elite) ones first, nearest-first within each group — falls back to basic
 * businesses to fill remaining slots (up to AD_CAROUSEL_LIMIT) rather than showing nothing when
 * too few paid businesses exist in the category. Requires a phone number (the ad card displays
 * it) and at least one category filter — there's no "ads for everything" mode.
 */
export async function getAdCarouselBusinesses(params: AdCarouselParams) {
  if (!params.categorySlug && !params.subcategorySlug) return [];

  const categoryFilter = params.subcategorySlug
    ? Prisma.sql`EXISTS (
        SELECT 1 FROM business_categories bc2
        JOIN categories c2 ON c2.id = bc2.category_id
        WHERE bc2.business_id = b.id AND c2.slug = ${params.subcategorySlug}
      )`
    : Prisma.sql`EXISTS (
        SELECT 1 FROM business_categories bc2
        JOIN categories c2 ON c2.id = bc2.category_id
        WHERE bc2.business_id = b.id
          AND (c2.slug = ${params.categorySlug} OR c2.parent_id = (SELECT id FROM categories WHERE slug = ${params.categorySlug}))
      )`;

  const hasCoordinates = typeof params.lat === "number" && typeof params.lng === "number";
  const userLat = hasCoordinates ? params.lat! : null;
  const userLng = hasCoordinates ? params.lng! : null;

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
    SELECT b.id, b.slug, b.name, b.cover_image_url, b.phone, b.plan_tier,
      CASE WHEN ${userLat}::float8 IS NOT NULL AND ${userLng}::float8 IS NOT NULL AND b.lat IS NOT NULL AND b.lng IS NOT NULL THEN
        6371 * acos(LEAST(1, GREATEST(-1,
          cos(radians(${userLat}::float8)) * cos(radians(b.lat)) * cos(radians(b.lng) - radians(${userLng}::float8))
          + sin(radians(${userLat}::float8)) * sin(radians(b.lat))
        )))
      ELSE NULL END AS distance_km
    FROM businesses b
    WHERE b.deleted_at IS NULL
      AND b.status = 'approved'
      AND b.phone IS NOT NULL
      AND ${categoryFilter}
    ORDER BY (b.plan_tier != 'basic') DESC, distance_km ASC NULLS LAST, b.avg_rating DESC
    LIMIT ${AD_CAROUSEL_LIMIT}
  `);

  return rows;
}

/**
 * Cheap existence check for "are there ANY verified businesses matching the current
 * category/city/rating filters" — independent of whether the verified filter itself is on, so the
 * frontend can decide whether to enable/disable the "Verified Businesses Only" checkbox instead of
 * always showing it clickable even when it would zero out the results. Deliberately ignores
 * openNow/amenities/radius (those are post-filters on the full scored query) — this only needs a
 * yes/no signal about whether the checkbox is worth offering, not exact post-filter counts.
 */
export async function hasVerifiedMatches(params: Pick<SearchParams, "citySlug" | "localitySlug" | "areaSlug" | "pincode" | "categorySlug" | "subcategorySlug" | "minRating" | "priceRanges" | "planTiers">): Promise<boolean> {
  const filters: Prisma.Sql[] = [
    Prisma.sql`b.deleted_at IS NULL`,
    Prisma.sql`b.status = 'approved'`,
    Prisma.sql`b.is_verified = true`,
  ];

  if (params.citySlug) filters.push(Prisma.sql`city.slug = ${params.citySlug}`);
  if (params.localitySlug) filters.push(Prisma.sql`loc.slug = ${params.localitySlug}`);
  if (params.areaSlug) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM pincode_areas pa
      WHERE pa.pincode = b.pincode AND pa.slug = ${params.areaSlug} AND pa.city_id = city.id
    )`);
  }
  if (params.pincode) filters.push(Prisma.sql`b.pincode = ${params.pincode}`);
  if (typeof params.minRating === "number") filters.push(Prisma.sql`b.avg_rating >= ${params.minRating}`);
  if (params.priceRanges && params.priceRanges.length > 0) {
    filters.push(Prisma.sql`b.price_range IN (${Prisma.join(params.priceRanges.map((p) => Prisma.sql`${p}::"PriceRange"`))})`);
  }
  if (params.planTiers && params.planTiers.length > 0) {
    filters.push(Prisma.sql`b.plan_tier IN (${Prisma.join(params.planTiers.map((p) => Prisma.sql`${p}::"PlanTier"`))})`);
  }
  if (params.subcategorySlug) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM business_categories bc2 JOIN categories c2 ON c2.id = bc2.category_id
      WHERE bc2.business_id = b.id AND bc2.is_primary = true
        AND (c2.slug = ${params.subcategorySlug} OR c2.parent_id = (SELECT parent_id FROM categories WHERE slug = ${params.subcategorySlug}))
    )`);
  } else if (params.categorySlug) {
    filters.push(Prisma.sql`EXISTS (
      SELECT 1 FROM business_categories bc2 JOIN categories c2 ON c2.id = bc2.category_id
      WHERE bc2.business_id = b.id AND bc2.is_primary = true
        AND (c2.slug = ${params.categorySlug} OR c2.parent_id = (SELECT id FROM categories WHERE slug = ${params.categorySlug}))
    )`);
  }

  const rows = await prisma.$queryRaw<{ exists: boolean }[]>(Prisma.sql`
    SELECT EXISTS (
      SELECT 1 FROM businesses b
      JOIN cities city ON city.id = b.city_id
      LEFT JOIN localities loc ON loc.id = b.locality_id
      WHERE ${Prisma.join(filters, " AND ")}
    ) AS exists
  `);

  return rows[0]?.exists ?? false;
}

export async function incrementViewCount(businessId: string) {
  await prisma.business.update({
    where: { id: businessId },
    data: { viewCount: { increment: 1 } },
  });
}
