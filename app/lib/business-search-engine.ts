import { prisma } from "@/app/lib/db";
import { resolveImageUrl } from "@/app/lib/utils";
import type { BusinessSummary, PaginatedResult, SearchFilters } from "@/app/lib/search-api";

const CITY_ALIASES: Record<string, string[]> = {
  bengaluru: ["bangalore", "bengaluru"],
  bangalore: ["bangalore", "bengaluru"],
  mumbai: ["mumbai", "bombay"],
  bombay: ["mumbai", "bombay"],
  delhi: ["delhi", "new delhi"],
  "new delhi": ["delhi", "new delhi"],
  chennai: ["chennai", "madras"],
  madras: ["chennai", "madras"],
  pune: ["pune", "poona"],
  poona: ["pune", "poona"],
  hyderabad: ["hyderabad", "secunderabad"],
  secunderabad: ["hyderabad", "secunderabad"],
};

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
  domlur: "Domlur",
  "old airport road": "Old Airport Road",
};

const COMPOUND_KEYWORDS: Record<string, string[]> = {
  "medical store": ["pharmacy", "chemist", "medical store", "drugstore", "medicine", "medicals"],
  "medical shop": ["pharmacy", "chemist", "medical store", "drugstore", "medicine", "medicals"],
  "medical center": ["medical center", "clinic", "hospital", "medical centre", "medicals"],
  "medical centre": ["medical center", "clinic", "hospital", "medical centre", "medicals"],
  "skin hospital": ["skin", "dermatol", "cosmetol", "derma"],
  "skin clinic": ["skin", "dermatol", "cosmetol", "derma"],
  "skin doctor": ["skin", "dermatol", "cosmetol", "derma"],
  "dental clinic": ["dentist", "dental", "dentistry", "teeth", "orthodontic"],
  "dental hospital": ["dentist", "dental", "dentistry", "teeth"],
  "eye clinic": ["eye", "ophthalm", "optician", "vision", "cataract"],
  "eye hospital": ["eye", "ophthalm", "optician", "vision", "cataract"],
  "eye doctor": ["eye", "ophthalm", "optician", "vision"],
  "diagnostic center": ["lab", "laboratory", "diagnostic", "pathology", "scan", "ultrasound", "mri", "blood test"],
  "diagnostic lab": ["lab", "laboratory", "diagnostic", "pathology", "scan", "blood test"],
  "child doctor": ["child", "pediatric", "paediatric", "baby", "infant"],
  "pediatric clinic": ["child", "pediatric", "paediatric", "baby"],
  "orthopedic hospital": ["ortho", "orthoped", "orthopaed", "bone", "joint"],
  "physiotherapy center": ["physio", "rehab", "physical therapy", "physiotherapy"],
};

const KEYWORD_STEMS: Record<string, string[]> = {
  medical: ["medical", "pharmacy", "chemist", "medical store", "medicine", "medicals"],
  medicals: ["medical", "pharmacy", "chemist", "medical store", "medicine", "medicals"],
  pharmacy: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  pharmacies: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  chemist: ["chemist", "pharmacy", "medical store", "drugstore", "medicine"],
  chemists: ["chemist", "pharmacy", "medical store", "drugstore", "medicine"],
  skin: ["skin", "dermatol", "cosmetol", "derma"],
  dermatologist: ["dermatol", "skin", "cosmetol"],
  dermatology: ["dermatol", "skin", "cosmetol"],
  hospital: ["hospital", "hospitals", "nursing home", "clinic", "center"],
  hospitals: ["hospital", "hospitals", "nursing home", "clinic", "center"],
  clinic: ["clinic", "clinics", "center", "centre"],
  clinics: ["clinic", "clinics", "center", "centre"],
  dentist: ["dentist", "dental", "dentistry", "teeth"],
  dentists: ["dentist", "dental", "dentistry", "teeth"],
  dental: ["dentist", "dental", "dentistry", "teeth"],
  lab: ["lab", "laboratory", "diagnostic", "pathology", "blood test", "scan"],
  labs: ["lab", "laboratory", "diagnostic", "pathology", "blood test", "scan"],
  diagnostic: ["lab", "laboratory", "diagnostic", "pathology", "blood test", "scan"],
  doctor: ["doctor", "physician", "consultant", "specialist"],
  doctors: ["doctor", "physician", "consultant", "specialist"],
  eye: ["eye", "ophthalm", "optician", "vision"],
  physio: ["physio", "rehab", "physical therapy"],
  physiotherapy: ["physio", "rehab", "physical therapy"],
  orthopedic: ["ortho", "orthoped", "orthopaed", "bone", "joint"],
  orthopaedics: ["ortho", "orthoped", "orthopaed", "bone", "joint"],
  pediatric: ["child", "pediatric", "paediatric", "baby"],
  pediatrician: ["child", "pediatric", "paediatric", "baby"],
};

const CATEGORY_SEARCH_MAP: Record<string, string[]> = {
  hospitals: ["hospital", "nursing home", "medical center", "healthcare"],
  hospital: ["hospital", "nursing home", "medical center", "healthcare"],
  clinics: ["clinic", "medical center", "healthcare"],
  clinic: ["clinic", "medical center", "healthcare"],
  doctors: ["doctor", "physician", "consultant", "specialist"],
  doctor: ["doctor", "physician", "consultant", "specialist"],
  "dental-clinics": ["dental", "dentist", "teeth", "orthodontic"],
  dentist: ["dental", "dentist", "teeth", "orthodontic"],
  dentists: ["dental", "dentist", "teeth", "orthodontic"],
  "eye-clinics": ["eye", "ophthalm", "optician", "vision", "cataract"],
  "diagnostic-labs": ["lab", "diagnostic", "pathology", "blood test", "scan", "ultrasound", "x-ray", "mri"],
  lab: ["lab", "diagnostic", "pathology", "blood test", "scan"],
  labs: ["lab", "diagnostic", "pathology", "blood test", "scan"],
  physiotherapy: ["physio", "rehab", "physical therapy", "posture", "spine"],
  pharmacies: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  pharmacy: ["pharmacy", "chemist", "medical store", "drugstore", "medicine"],
  "home-healthcare": ["home care", "nursing", "home health", "elder care"],
  ayurvedic: ["ayurved", "homeopath", "unani", "naturopath", "panchakarma"],
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
  const lowerQ = q.trim().toLowerCase();
  const words = lowerQ.split(/\s+/);
  let locationTerm: string | null = null;
  const stems: string[] = [];

  // 1. Check multi-word compound terms first
  for (const [compound, compStems] of Object.entries(COMPOUND_KEYWORDS)) {
    if (lowerQ.includes(compound)) {
      stems.push(...compStems);
    }
  }

  // 2. Tokenize words for locations and individual stems
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    if (["in", "near", "at", "around", "of", "for", "store", "shop"].includes(word)) continue;

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
    } else if (KEYWORD_STEMS[word] && stems.length === 0) {
      stems.push(...KEYWORD_STEMS[word]);
    }
  }

  if (stems.length === 0) {
    stems.push(...words.filter((w) => !["in", "near", "at", "around", "of", "for"].includes(w)));
  }

  return { locationTerm, stems };
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
  let parsedLocation: string | null = null;
  let parsedStems: string[] = [];

  // Intelligent tokenized free-text query parsing
  if (filters.q && filters.q.trim()) {
    const { locationTerm, stems } = parseTokenizedQuery(filters.q);
    parsedLocation = locationTerm;
    parsedStems = stems;

    if (stems.length > 0) {
      andConditions.push({
        OR: stems.flatMap((term) => [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
          { address: { contains: term, mode: "insensitive" } },
          { categories: { some: { category: { name: { contains: term, mode: "insensitive" } } } } },
          { categories: { some: { category: { slug: { contains: term, mode: "insensitive" } } } } },
        ]),
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
    const rawCity = filters.city.toLowerCase().replace(/-/g, " ");
    const cityTerms = CITY_ALIASES[rawCity] || [rawCity, filters.city];
    andConditions.push({
      OR: [
        { city: { slug: { in: cityTerms } } },
        ...cityTerms.flatMap((term) => [
          { address: { contains: term, mode: "insensitive" } },
          { city: { name: { contains: term, mode: "insensitive" } } },
        ]),
      ],
    });
  }

  const targetArea = filters.area || filters.locality;
  if (targetArea) {
    const cleanLoc = AREA_ALIASES[targetArea.toLowerCase()] || targetArea.replace(/-/g, " ");
    andConditions.push({
      OR: [
        { locality: { slug: targetArea } },
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

  // Fetch candidates (fetch up to 300 to perform relevance scoring if free-text search or category filter is active)
  const isFreeTextSearch = Boolean(filters.q && filters.q.trim());
  const isCategorySearch = Boolean(categorySlug);
  const shouldPerformRelevanceScoring = isFreeTextSearch || isCategorySearch;

  const fetchLimit = shouldPerformRelevanceScoring ? 300 : limit;
  const fetchSkip = shouldPerformRelevanceScoring ? 0 : skip;

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
      take: fetchLimit,
      skip: fetchSkip,
      include: {
        city: true,
        locality: true,
        categories: { include: { category: true } },
      },
      orderBy,
    }),
    prisma.business.count({ where }),
  ]);

  const primaryStems = parsedStems.slice(0, 3);
  const categoryTerms = categorySlug
    ? CATEGORY_SEARCH_MAP[categorySlug] || [categorySlug.replace(/-/g, " ")]
    : [];

  let formattedItems: (BusinessSummary & { _relevanceScore?: number })[] = items.map((b: any) => {
    let distanceKm: number | null = null;
    const bLat = b.lat != null ? Number(b.lat) : null;
    const bLng = b.lng != null ? Number(b.lng) : null;

    if (filters.lat != null && filters.lng != null && bLat != null && bLng != null) {
      distanceKm = calculateDistanceKm(filters.lat, filters.lng, bLat, bLng);
    }

    let relevanceScore = 0;
    const nameLower = (b.name || "").toLowerCase();
    const descLower = (b.description || "").toLowerCase();
    const primaryCat = (b.categories[0]?.category?.name || "").toLowerCase();
    const primarySlug = (b.categories[0]?.category?.slug || "").toLowerCase();

    if (isFreeTextSearch && parsedStems.length > 0) {
      for (const pTerm of primaryStems) {
        if (nameLower.includes(pTerm)) relevanceScore += 800;
        if (primaryCat.includes(pTerm) || primarySlug.includes(pTerm)) relevanceScore += 400;
      }

      for (const term of parsedStems) {
        if (nameLower.includes(term)) relevanceScore += 200;
        if (primaryCat.includes(term) || primarySlug.includes(term)) relevanceScore += 100;
        if (descLower.includes(term)) relevanceScore += 30;
      }

      if (parsedLocation) {
        const locLower = parsedLocation.toLowerCase();
        if ((b.locality?.name || "").toLowerCase().includes(locLower)) relevanceScore += 400;
        else if ((b.address || "").toLowerCase().includes(locLower)) relevanceScore += 300;
      }
    }

    if (isCategorySearch && categoryTerms.length > 0) {
      for (const term of categoryTerms) {
        if (nameLower.includes(term)) relevanceScore += 800;
        if (primaryCat.includes(term) || primarySlug.includes(term)) relevanceScore += 500;
        if (descLower.includes(term)) relevanceScore += 50;
      }
    }

    relevanceScore += Number(b.avgRating || 0) * 5;
    if (b.isVerified) relevanceScore += 10;

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
      _relevanceScore: relevanceScore,
    };
  });

  if (shouldPerformRelevanceScoring && (!filters.sort || filters.sort === "rating")) {
    formattedItems.sort((a, b) => (b._relevanceScore ?? 0) - (a._relevanceScore ?? 0));
    formattedItems = formattedItems.slice(skip, skip + limit);
  } else if (filters.sort === "distance" && filters.lat != null && filters.lng != null) {
    formattedItems.sort((a, b) => {
      if (a.distanceKm == null) return 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
    formattedItems = formattedItems.slice(skip, skip + limit);
  }

  return {
    items: formattedItems.map(({ _relevanceScore, ...rest }) => rest),
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    hasVerifiedMatches: total > 0,
  };
}

