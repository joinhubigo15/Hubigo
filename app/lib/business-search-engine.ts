import { prisma } from "@/app/lib/db";
import { resolveImageUrl } from "@/app/lib/utils";
import type { BusinessSummary, PaginatedResult, SearchFilters } from "@/app/lib/search-api";

const AREA_ALIASES: Record<string, string> = {
  indranagar: "Indiranagar",
  indiranagar: "Indiranagar",
  jpnagar: "JP Nagar",
  "jp nagar": "JP Nagar",
  "j.p. nagar": "JP Nagar",
  hsr: "HSR Layout",
  "hsr layout": "HSR Layout",
  btm: "BTM Layout",
  "btm layout": "BTM Layout",
  whitefield: "Whitefield",
  "white field": "Whitefield",
  koramangala: "Koramangala",
  kormangala: "Koramangala",
  marathahalli: "Marathahalli",
  marathalli: "Marathahalli",
  malleswaram: "Malleshwaram",
  malleshwaram: "Malleshwaram",
  rajajinagar: "Rajajinagar",
  "rajaji nagar": "Rajajinagar",
  jayanagar: "Jayanagar",
  hebbal: "Hebbal",
  "electronic city": "Electronic City",
  "elec city": "Electronic City",
  banashankari: "Banashankari",
  yelahanka: "Yelahanka",
  sarjapur: "Sarjapur",
  bellandur: "Bellandur",
  kammanahalli: "Kammanahalli",
  brookefield: "Brookefield",
  doddaballapura: "Doddaballapura",
  hoskote: "Hoskote",
};

const KEYWORD_STEMS: Record<string, string[]> = {
  skin: ["skin", "dermatol", "cosmetol"],
  dermatologist: ["dermatol", "skin", "cosmetol"],
  dermatology: ["dermatol", "skin", "cosmetol"],
  hospital: ["hospital", "hospitals", "nursing home", "clinic", "center"],
  hospitals: ["hospital", "hospitals", "nursing home", "clinic", "center"],
  clinic: ["clinic", "clinics", "center", "centre"],
  clinics: ["clinic", "clinics", "center", "centre"],
  dentist: ["dentist", "dental", "dentistry", "teeth"],
  dentists: ["dentist", "dental", "dentistry", "teeth"],
  pharmacy: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  pharmacies: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  lab: ["lab", "laboratory", "diagnostic", "pathology", "blood test", "scan"],
  labs: ["lab", "laboratory", "diagnostic", "pathology", "blood test", "scan"],
  doctor: ["doctor", "physician", "consultant", "specialist"],
  doctors: ["doctor", "physician", "consultant", "specialist"],
  eye: ["eye", "ophthalm", "optician", "vision"],
  physio: ["physio", "rehab", "physical therapy"],
  physiotherapy: ["physio", "rehab", "physical therapy"],
};

const CATEGORY_SEARCH_MAP: Record<string, string[]> = {
  "hospitals": ["hospital", "nursing home", "medical center", "healthcare"],
  "dental-clinics": ["dental", "dentist", "teeth", "orthodontic"],
  "eye-clinics": ["eye", "ophthalm", "optician", "vision", "cataract"],
  "diagnostic-labs": ["lab", "diagnostic", "pathology", "blood test", "scan", "ultrasound", "x-ray", "mri"],
  "physiotherapy": ["physio", "rehab", "physical therapy", "posture", "spine"],
  "pharmacies": ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  "home-healthcare": ["home care", "nursing", "home health", "elder care"],
  "ayurvedic": ["ayurved", "homeopath", "unani", "naturopath", "panchakarma"],
  "emergency-services": ["emergency", "ambulance", "24/7", "trauma", "icu"],
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

function parseTokenizedQuery(q: string) {
  const words = q.trim().toLowerCase().split(/\s+/);
  let locationTerm: string | null = null;
  const keywordWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (word === "in" || word === "near" || word === "at" || word === "around" || word === "of" || word === "for") continue;

    if (i < words.length - 1) {
      const twoWords = `${words[i]} ${words[i + 1]}`;
      if (AREA_ALIASES[twoWords]) {
        locationTerm = AREA_ALIASES[twoWords];
        i++;
        continue;
      }
    }

    if (AREA_ALIASES[word]) {
      locationTerm = AREA_ALIASES[word];
    } else {
      keywordWords.push(word);
    }
  }

  return { locationTerm, keywordWords };
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

  // Intelligent tokenized free-text query parsing
  if (filters.q && filters.q.trim()) {
    const { locationTerm, keywordWords } = parseTokenizedQuery(filters.q);

    for (const kw of keywordWords) {
      const terms = KEYWORD_STEMS[kw] || [kw];
      andConditions.push({
        OR: [
          ...terms.flatMap((term) => [
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
    const cleanCity = filters.city.replace(/-/g, " ");
    andConditions.push({
      OR: [
        { city: { slug: filters.city } },
        { address: { contains: cleanCity, mode: "insensitive" } },
      ],
    });
  }

  if (filters.locality) {
    const cleanLoc = AREA_ALIASES[filters.locality.toLowerCase()] || filters.locality.replace(/-/g, " ");
    andConditions.push({
      OR: [
        { locality: { slug: filters.locality } },
        { address: { contains: cleanLoc, mode: "insensitive" } },
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

  const categorySlug = filters.subcategory || filters.category;
  if (categorySlug) {
    const terms = CATEGORY_SEARCH_MAP[categorySlug] || [categorySlug.replace(/-/g, " ")];
    andConditions.push({
      OR: [
        { categories: { some: { category: { OR: [{ slug: categorySlug }, { parent: { slug: categorySlug } }] } } } },
        ...terms.flatMap((term) => [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ]),
      ],
    });
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
