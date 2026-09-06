import { prisma } from "@/app/lib/db";
import { resolveImageUrl } from "@/app/lib/utils";
import type { BusinessSummary, PaginatedResult, SearchFilters } from "@/app/lib/search-api";

const KNOWN_AREAS = [
  "JP Nagar", "Indiranagar", "Whitefield", "HSR Layout", "Koramangala",
  "Rajajinagar", "Jayanagar", "Hebbal", "Electronic City", "Banashankari",
  "BTM Layout", "Marathahalli", "Yelahanka", "Malleshwaram", "Sarjapur",
  "Bellandur", "Kammanahalli", "Brookefield", "Doddaballapura", "Hoskote",
  "Banjara Hills", "Jubilee Hills", "Gachibowli", "Hitec City", "Madhapur",
  "Kukatpally", "Secunderabad", "Kondapur", "Begumpet", "Ameerpet",
  "T Nagar", "Anna Nagar", "Adyar", "Velachery", "Mylapore", "Nungambakkam",
  "OMR", "Porur", "Vadapalani", "Tambaram"
];

const KEYWORD_ALIASES: Record<string, string[]> = {
  hospitals: ["hospital", "hospitals", "nursing home", "clinic"],
  hospital: ["hospital", "hospitals", "nursing home"],
  clinics: ["clinic", "clinics", "center", "centre"],
  clinic: ["clinic", "clinics", "center", "centre"],
  dentists: ["dentist", "dental", "dentistry", "teeth"],
  dentist: ["dentist", "dental", "dentistry", "teeth"],
  pharmacies: ["pharmacy", "chemist", "medical store", "drugstore"],
  pharmacy: ["pharmacy", "chemist", "medical store", "drugstore"],
  labs: ["lab", "laboratory", "diagnostic", "pathology", "blood test"],
  lab: ["lab", "laboratory", "diagnostic", "pathology", "blood test"],
  doctors: ["doctor", "physician", "consultant", "specialist"],
  doctor: ["doctor", "physician", "consultant", "specialist"],
};

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function parseSearchQuery(q: string) {
  let locationTerm: string | null = null;
  let keywordTerm = q.trim();

  for (const area of KNOWN_AREAS) {
    const reg = new RegExp(`(?:in|near|at|around)?\\s*\\b${area}\\b`, "i");
    if (reg.test(q)) {
      locationTerm = area;
      keywordTerm = q.replace(reg, "").trim();
      break;
    }
  }

  return { locationTerm, keywordTerm };
}

export async function executeSearch(filters: SearchFilters): Promise<PaginatedResult<BusinessSummary>> {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: any = {
    deletedAt: null,
    status: "approved",
  };

  const andConditions: any[] = [];

  // Free-text query parsing
  if (filters.q && filters.q.trim()) {
    const { locationTerm, keywordTerm } = parseSearchQuery(filters.q);
    const searchKeyword = keywordTerm || filters.q.trim();

    if (searchKeyword) {
      const lower = searchKeyword.toLowerCase();
      const aliases = KEYWORD_ALIASES[lower] || [searchKeyword];
      andConditions.push({
        OR: [
          ...aliases.flatMap((term) => [
            { name: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
            { address: { contains: term, mode: "insensitive" } },
            { categories: { some: { category: { name: { contains: term, mode: "insensitive" } } } } },
            { categories: { some: { category: { slug: { contains: term, mode: "insensitive" } } } } },
          ]),
        ],
      });
    }

    if (locationTerm) {
      andConditions.push({
        OR: [
          { address: { contains: locationTerm, mode: "insensitive" } },
          { locality: { name: { contains: locationTerm, mode: "insensitive" } } },
          { city: { name: { contains: locationTerm, mode: "insensitive" } } },
        ],
      });
    }
  }

  if (filters.city) {
    where.city = { slug: filters.city };
  }

  if (filters.locality) {
    andConditions.push({
      OR: [
        { locality: { slug: filters.locality } },
        { address: { contains: filters.locality.replace(/-/g, " "), mode: "insensitive" } },
      ],
    });
  }

  if (filters.pincode) {
    andConditions.push({
      OR: [
        { pincode: filters.pincode },
        { address: { contains: filters.pincode } },
      ],
    });
  }

  if (filters.category) {
    where.categories = {
      some: {
        category: {
          OR: [{ slug: filters.category }, { parent: { slug: filters.category } }],
        },
      },
    };
  }

  if (filters.subcategory) {
    where.categories = {
      some: {
        category: { slug: filters.subcategory },
      },
    };
  }

  if (filters.verified) {
    where.isVerified = true;
  }

  if (filters.minRating) {
    where.avgRating = { gte: filters.minRating };
  }

  if (filters.price && filters.price.length > 0) {
    where.priceRange = { in: filters.price };
  }

  if (filters.tier && filters.tier.length > 0) {
    where.planTier = { in: filters.tier };
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Determine sort order
  let orderBy: any = { avgRating: "desc" };
  if (filters.sort === "rating") {
    orderBy = { avgRating: "desc" };
  } else if (filters.sort === "reviews") {
    orderBy = { reviewCount: "desc" };
  } else if (filters.sort === "newest") {
    orderBy = { createdAt: "desc" };
  }

  const [items, total] = await Promise.all([
    prisma.business.findMany({
      where,
      take: filters.sort === "distance" && filters.lat && filters.lng ? 100 : limit,
      skip: filters.sort === "distance" && filters.lat && filters.lng ? 0 : skip,
      include: {
        city: true,
        locality: true,
        categories: { include: { category: true } },
      },
      orderBy,
    }),
    prisma.business.count({ where }),
  ]);

  let formattedItems: BusinessSummary[] = items.map((b: any) => {
    let distanceKm: number | null = null;
    const bLat = b.lat != null ? Number(b.lat) : null;
    const bLng = b.lng != null ? Number(b.lng) : null;

    if (filters.lat != null && filters.lng != null && bLat != null && bLng != null) {
      distanceKm = calculateDistanceKm(filters.lat, filters.lng, bLat, bLng);
    }

    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      description: b.description,
      coverImageUrl: resolveImageUrl(b.coverImageUrl),
      planTier: b.planTier,
      isVerified: b.isVerified,
      isTrusted: b.isTrusted,
      avgRating: Number(b.avgRating || 0),
      reviewCount: b.reviewCount || 0,
      priceRange: b.priceRange,
      address: b.address,
      citySlug: b.city?.slug ?? "",
      cityName: b.city?.name ?? "",
      localitySlug: b.locality?.slug ?? null,
      localityName: b.locality?.name ?? null,
      areaSlug: null,
      areaName: b.locality?.name ?? null,
      lat: bLat,
      lng: bLng,
      distanceKm,
      primaryCategoryName: b.categories[0]?.category?.name ?? null,
      primaryCategorySlug: b.categories[0]?.category?.slug ?? null,
      isOpenNow: true,
      hasActiveOffer: false,
      score: 100,
    };
  });

  // Sort by distance if distance sort requested and location coordinates available
  if (filters.sort === "distance" && filters.lat != null && filters.lng != null) {
    formattedItems.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    formattedItems = formattedItems.slice(skip, skip + limit);
  }

  return {
    items: formattedItems,
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasVerifiedMatches: total > 0,
  };
}
