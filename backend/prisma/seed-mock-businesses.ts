/**
 * Isolated mock business data — NOT permanent.
 *
 * Real businesses arrive later via the scraper pipeline (SRS §21). This script exists purely
 * so the search/ranking/filter/compare stack has something realistic to run against until then.
 * Every row it creates carries an externalPlaceId starting with "MOCK-", so it can be wiped
 * cleanly with `npm run seed:clear-mock-businesses` without touching real imported data or the
 * permanent taxonomy from seed.ts.
 */
import { PrismaClient, PlanTier, PriceRange, DayOfWeek } from "@prisma/client";

const prisma = new PrismaClient();

const STANDARD_HOURS: { day: DayOfWeek; openTime: string; closeTime: string }[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
].map((day) => ({ day: day as DayOfWeek, openTime: "09:00", closeTime: "21:00" }));

const ALWAYS_OPEN_HOURS: { day: DayOfWeek; openTime: string; closeTime: string }[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
].map((day) => ({ day: day as DayOfWeek, openTime: "00:00", closeTime: "23:59" }));

interface MockBusiness {
  name: string;
  categorySlug: string;
  subcategorySlug?: string;
  citySlug: string;
  localitySlug?: string;
  address: string;
  planTier: PlanTier;
  isVerified: boolean;
  isTrusted: boolean;
  priceRange: PriceRange;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  keywords: string[];
  amenitySlugs: string[];
  services: string[];
  hasOffer?: boolean;
  description: string;
  coverImageUrl: string;
  hours?: "standard" | "always";
}

const businesses: MockBusiness[] = [
  // ── The Koramangala/Delhi gym example from the spec, made real ──
  {
    name: "Iron Paradise Fitness Club",
    categorySlug: "gyms",
    citySlug: "bangalore",
    localitySlug: "koramangala",
    address: "3rd Floor, Forum Mall Road, Koramangala",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.5,
    reviewCount: 210,
    viewCount: 1400,
    keywords: ["gym", "fitness", "weight training", "crossfit"],
    amenitySlugs: ["parking", "air-conditioning", "wifi"],
    services: ["Personal Training", "Group Classes"],
    description: "Neighbourhood strength and conditioning gym with certified trainers.",
    coverImageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Elite Fitness Delhi",
    categorySlug: "gyms",
    citySlug: "delhi",
    localitySlug: "saket",
    address: "Select Citywalk Complex, Saket",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.8,
    reviewCount: 940,
    viewCount: 5200,
    keywords: ["gym", "fitness", "luxury gym", "personal training"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible"],
    services: ["Personal Training", "Nutrition Coaching", "Spa Recovery"],
    hasOffer: true,
    description: "Premium fitness club with recovery spa, personal chefs, and elite trainers.",
    coverImageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop",
    hours: "always",
  },

  // ── Restaurants ──
  {
    name: "Spice Garden Restaurant",
    categorySlug: "restaurants",
    subcategorySlug: "fine-dining",
    citySlug: "pune",
    localitySlug: "koregaon-park",
    address: "42, MG Road, Koregaon Park",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.8,
    reviewCount: 1245,
    viewCount: 8600,
    keywords: ["north indian", "fine dining", "live music"],
    amenitySlugs: ["air-conditioning", "parking", "card-payment", "outdoor-seating"],
    services: ["Dine-in", "Live Music Nights", "Private Events"],
    hasOffer: true,
    description: "Authentic Indian cuisine with a modern twist and weekend live music.",
    coverImageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "The Urban Cafe & Bistro",
    categorySlug: "restaurants",
    subcategorySlug: "cafe",
    citySlug: "pune",
    localitySlug: "koregaon-park",
    address: "Lane 5, Koregaon Park",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.4,
    reviewCount: 678,
    viewCount: 3100,
    keywords: ["cafe", "coffee", "pastries", "continental"],
    amenitySlugs: ["wifi", "outdoor-seating", "card-payment"],
    services: ["Dine-in", "Takeaway"],
    description: "Trendy cafe serving artisanal coffee and fusion cuisine.",
    coverImageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Bengaluru Bites",
    categorySlug: "restaurants",
    subcategorySlug: "fast-food",
    citySlug: "bangalore",
    localitySlug: "indiranagar",
    address: "100ft Road, Indiranagar",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.budget,
    avgRating: 4.2,
    reviewCount: 512,
    viewCount: 2700,
    keywords: ["fast food", "quick bites", "south indian"],
    amenitySlugs: ["home-delivery", "card-payment"],
    services: ["Dine-in", "Delivery"],
    description: "Quick-serve South Indian favourites, from dosas to filter coffee.",
    coverImageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Flour & Co Bakery",
    categorySlug: "restaurants",
    subcategorySlug: "bakery",
    citySlug: "mumbai",
    localitySlug: "bandra",
    address: "Hill Road, Bandra West",
    planTier: PlanTier.basic,
    isVerified: false,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.0,
    reviewCount: 88,
    viewCount: 640,
    keywords: ["bakery", "desserts", "cakes"],
    amenitySlugs: ["card-payment"],
    services: ["Custom Cakes", "Walk-in"],
    description: "Neighbourhood bakery known for sourdough and custom celebration cakes.",
    coverImageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Hospitals ──
  {
    name: "LifeCare Wellness Hospital",
    categorySlug: "hospitals",
    citySlug: "pune",
    localitySlug: "baner",
    address: "15, Baner Road, Baner",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.6,
    reviewCount: 892,
    viewCount: 6100,
    keywords: ["multi-specialty", "emergency", "icu"],
    amenitySlugs: ["parking", "wheelchair-accessible", "air-conditioning"],
    services: ["24/7 Emergency", "ICU", "Diagnostics"],
    description: "Multi-specialty hospital with 24/7 emergency care and expert doctors.",
    coverImageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=600&h=400&fit=crop",
    hours: "always",
  },
  {
    name: "Apollo Care Clinic",
    categorySlug: "hospitals",
    citySlug: "hyderabad",
    localitySlug: "banjara-hills",
    address: "Road No 12, Banjara Hills",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.7,
    reviewCount: 1530,
    viewCount: 9200,
    keywords: ["multi-specialty", "diagnostics", "checkup"],
    amenitySlugs: ["parking", "wheelchair-accessible"],
    services: ["General Consultation", "Full Body Checkup"],
    description: "Trusted multi-specialty clinic with same-day diagnostics.",
    coverImageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Manipal City Hospital",
    categorySlug: "hospitals",
    citySlug: "bangalore",
    localitySlug: "hsr-layout",
    address: "27th Main, HSR Layout",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.3,
    reviewCount: 410,
    viewCount: 2900,
    keywords: ["general hospital", "emergency"],
    amenitySlugs: ["parking", "wheelchair-accessible"],
    services: ["General Ward", "Emergency"],
    description: "Community hospital offering general and emergency medical care.",
    coverImageUrl: "https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=600&h=400&fit=crop",
    hours: "always",
  },

  // ── Hotels ──
  {
    name: "Grand Vista Hotel & Suites",
    categorySlug: "hotels",
    citySlug: "pune",
    address: "Plot 7, Hinjewadi Phase 1",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.9,
    reviewCount: 2130,
    viewCount: 11400,
    keywords: ["5 star", "luxury hotel", "pool", "spa"],
    amenitySlugs: ["wifi", "parking", "air-conditioning", "card-payment"],
    services: ["Room Service", "Spa", "Banquet Hall"],
    hasOffer: true,
    description: "5-star luxury hotel with panoramic views and a world-class spa.",
    coverImageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop",
    hours: "always",
  },
  {
    name: "City Comfort Inn",
    categorySlug: "hotels",
    citySlug: "chennai",
    localitySlug: "t-nagar",
    address: "Usman Road, T Nagar",
    planTier: PlanTier.basic,
    isVerified: false,
    isTrusted: false,
    priceRange: PriceRange.budget,
    avgRating: 3.9,
    reviewCount: 156,
    viewCount: 980,
    keywords: ["budget hotel", "business travel"],
    amenitySlugs: ["wifi", "air-conditioning"],
    services: ["Room Service"],
    description: "No-frills budget stay close to T Nagar's shopping district.",
    coverImageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop",
    hours: "always",
  },

  // ── Salons & Spas ──
  {
    name: "Glamour Studio Salon & Spa",
    categorySlug: "salons",
    subcategorySlug: "spa",
    citySlug: "pune",
    address: "12, FC Road, Shivajinagar",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.premium,
    avgRating: 4.7,
    reviewCount: 934,
    viewCount: 4200,
    keywords: ["salon", "spa", "bridal", "hair color"],
    amenitySlugs: ["air-conditioning", "card-payment", "wifi"],
    services: ["Hair Styling", "Bridal Package", "Spa Therapy"],
    hasOffer: true,
    description: "Luxury salon offering premium hair, skin, and body treatments.",
    coverImageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Chop Shop Unisex Salon",
    categorySlug: "salons",
    subcategorySlug: "hair-salon",
    citySlug: "bangalore",
    localitySlug: "indiranagar",
    address: "12th Main, Indiranagar",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.3,
    reviewCount: 267,
    viewCount: 1500,
    keywords: ["salon", "haircut", "unisex"],
    amenitySlugs: ["air-conditioning", "card-payment"],
    services: ["Haircut", "Beard Grooming"],
    description: "Walk-in friendly unisex salon known for consistent haircuts.",
    coverImageUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Plumbers / Electricians (services) ──
  {
    name: "QuickFix Plumbing Services",
    categorySlug: "plumbers",
    citySlug: "pune",
    localitySlug: "kothrud",
    address: "Near Dahanukar Colony, Kothrud",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.budget,
    avgRating: 4.3,
    reviewCount: 312,
    viewCount: 1600,
    keywords: ["plumber", "emergency plumbing", "leak repair"],
    amenitySlugs: ["card-payment"],
    services: ["Emergency Repair", "Pipe Installation"],
    description: "Same-day residential and commercial plumbing repairs.",
    coverImageUrl: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=600&h=400&fit=crop",
    hours: "standard",
  },
  {
    name: "Bright Spark Electricals",
    categorySlug: "electricians",
    citySlug: "pune",
    address: "Near Bremen Chowk, Aundh",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.budget,
    avgRating: 4.2,
    reviewCount: 245,
    viewCount: 1300,
    keywords: ["electrician", "wiring", "repairs"],
    amenitySlugs: [],
    services: ["Wiring", "Appliance Installation"],
    description: "Licensed electricians for wiring, repairs, and installations.",
    coverImageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Shopping ──
  {
    name: "Style Avenue Mall",
    categorySlug: "shopping",
    citySlug: "pune",
    address: "Magarpatta City, Hadapsar",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.6,
    reviewCount: 1567,
    viewCount: 7200,
    keywords: ["mall", "shopping", "fashion", "electronics"],
    amenitySlugs: ["parking", "air-conditioning", "wheelchair-accessible", "wifi"],
    services: ["Food Court", "Valet Parking"],
    hasOffer: true,
    description: "Premium shopping destination with 200+ international and Indian brands.",
    coverImageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Education ──
  {
    name: "Bright Minds Learning Centre",
    categorySlug: "education",
    citySlug: "bangalore",
    localitySlug: "whitefield",
    address: "ITPL Main Road, Whitefield",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.5,
    reviewCount: 340,
    viewCount: 1900,
    keywords: ["tuition", "coaching", "school prep"],
    amenitySlugs: ["air-conditioning", "wifi", "parking"],
    services: ["K-12 Tuition", "Test Prep"],
    description: "After-school coaching centre for K-12 and competitive exam prep.",
    coverImageUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Real Estate ──
  {
    name: "Skyline Realty Advisors",
    categorySlug: "real-estate",
    citySlug: "mumbai",
    localitySlug: "powai",
    address: "Hiranandani Gardens, Powai",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.4,
    reviewCount: 210,
    viewCount: 2600,
    keywords: ["real estate", "property", "rental", "resale"],
    amenitySlugs: ["parking", "air-conditioning"],
    services: ["Property Search", "Legal Assistance"],
    description: "Full-service real estate advisory for rentals, resale, and new projects.",
    coverImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Car Services ──
  {
    name: "AutoCare Service Centre",
    categorySlug: "car-services",
    citySlug: "delhi",
    localitySlug: "dwarka",
    address: "Sector 12, Dwarka",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.1,
    reviewCount: 389,
    viewCount: 2100,
    keywords: ["car service", "car repair", "denting painting"],
    amenitySlugs: ["parking", "card-payment"],
    services: ["General Service", "Denting & Painting"],
    description: "Multi-brand car service and repair centre with pickup/drop.",
    coverImageUrl: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Dentists ──
  {
    name: "Dr. Smile Dental Clinic",
    categorySlug: "dentists",
    citySlug: "pune",
    address: "JM Road, Near Garware Bridge",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.8,
    reviewCount: 456,
    viewCount: 2400,
    keywords: ["dentist", "braces", "implants", "cosmetic dentistry"],
    amenitySlugs: ["air-conditioning", "card-payment", "wheelchair-accessible"],
    services: ["Cosmetic Dentistry", "Braces", "Implants"],
    description: "Modern dental clinic offering painless treatments and cosmetic dentistry.",
    coverImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Lawyers ──
  {
    name: "Chandra & Associates",
    categorySlug: "lawyers",
    citySlug: "delhi",
    localitySlug: "connaught-place",
    address: "Barakhamba Road, Connaught Place",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.7,
    reviewCount: 180,
    viewCount: 1700,
    keywords: ["lawyer", "legal advisory", "corporate law"],
    amenitySlugs: ["air-conditioning", "wifi"],
    services: ["Corporate Law", "Civil Litigation"],
    description: "Full-service law firm specializing in corporate and civil matters.",
    coverImageUrl: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Photographers ──
  {
    name: "Pixel Perfect Studio",
    categorySlug: "photographers",
    citySlug: "pune",
    address: "Viman Nagar, Near Phoenix Mall",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.9,
    reviewCount: 423,
    viewCount: 3300,
    keywords: ["photography", "wedding photographer", "portrait"],
    amenitySlugs: ["wifi", "parking"],
    services: ["Wedding Shoots", "Portrait Sessions", "Commercial Shoots"],
    hasOffer: true,
    description: "Award-winning photography studio specializing in weddings and portraits.",
    coverImageUrl: "https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Pet Care ──
  {
    name: "Happy Paws Pet Clinic",
    categorySlug: "pet-care",
    citySlug: "bangalore",
    localitySlug: "koramangala",
    address: "80 Feet Road, Koramangala",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.moderate,
    avgRating: 4.6,
    reviewCount: 198,
    viewCount: 1100,
    keywords: ["pet clinic", "vet", "grooming"],
    amenitySlugs: ["air-conditioning", "pet-friendly", "parking"],
    services: ["Vaccination", "Grooming", "Consultation"],
    description: "Full-service veterinary clinic and grooming salon for pets.",
    coverImageUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=400&fit=crop",
    hours: "standard",
  },

  // ── Home Decor ──
  {
    name: "Casa Living Home Decor",
    categorySlug: "home-decor",
    citySlug: "chennai",
    localitySlug: "adyar",
    address: "Lattice Bridge Road, Adyar",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.premium,
    avgRating: 4.5,
    reviewCount: 267,
    viewCount: 1800,
    keywords: ["home decor", "furniture", "interior"],
    amenitySlugs: ["parking", "card-payment", "air-conditioning"],
    services: ["Interior Consultation", "Custom Furniture"],
    description: "Curated home decor and furniture store with interior design consultations.",
    coverImageUrl: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop",
    hours: "standard",
  },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function clearMockBusinesses() {
  const result = await prisma.business.deleteMany({
    where: { externalPlaceId: { startsWith: "MOCK-" } },
  });
  console.log(`Removed ${result.count} mock business(es).`);
}

async function seedMockBusinesses() {
  const categorySlugs = [...new Set(businesses.flatMap((b) => [b.categorySlug, b.subcategorySlug]))].filter(
    Boolean
  ) as string[];
  const citySlugs = [...new Set(businesses.map((b) => b.citySlug))];

  const [dbCategories, dbCities, dbAmenities] = await Promise.all([
    prisma.category.findMany({ where: { slug: { in: categorySlugs } } }),
    prisma.city.findMany({ where: { slug: { in: citySlugs } }, include: { localities: true } }),
    prisma.amenity.findMany(),
  ]);

  const categoryBySlug = new Map(dbCategories.map((c) => [c.slug, c]));
  const cityBySlug = new Map(dbCities.map((c) => [c.slug, c]));
  const amenityBySlug = new Map(dbAmenities.map((a) => [a.slug, a]));

  if (dbCategories.length === 0 || dbCities.length === 0) {
    throw new Error("Run `npm run seed` first to create categories/cities before seeding mock businesses.");
  }

  let created = 0;
  for (const [index, mock] of businesses.entries()) {
    const slug = slugify(mock.name);
    const city = cityBySlug.get(mock.citySlug);
    if (!city) {
      console.warn(`Skipping "${mock.name}" — unknown city slug "${mock.citySlug}"`);
      continue;
    }
    const locality = mock.localitySlug
      ? city.localities.find((l) => l.slug === mock.localitySlug)
      : undefined;
    const primaryCategory = categoryBySlug.get(mock.categorySlug);
    const subCategory = mock.subcategorySlug ? categoryBySlug.get(mock.subcategorySlug) : undefined;

    const externalPlaceId = `MOCK-${index}`;

    const existing = await prisma.business.findUnique({ where: { externalPlaceId } });
    if (existing) continue;

    const hoursTemplate = mock.hours === "always" ? ALWAYS_OPEN_HOURS : STANDARD_HOURS;

    await prisma.business.create({
      data: {
        slug,
        name: mock.name,
        description: mock.description,
        externalPlaceId,
        cityId: city.id,
        localityId: locality?.id,
        address: mock.address,
        pincode: locality?.pincode,
        lat: locality?.lat ?? city.lat,
        lng: locality?.lng ?? city.lng,
        phone: `98765${String(10000 + index).slice(-5)}`,
        whatsappPhone: `98765${String(10000 + index).slice(-5)}`,
        planTier: mock.planTier,
        status: "approved",
        isVerified: mock.isVerified,
        isTrusted: mock.isTrusted,
        priceRange: mock.priceRange,
        coverImageUrl: mock.coverImageUrl,
        keywords: mock.keywords,
        avgRating: mock.avgRating,
        reviewCount: mock.reviewCount,
        viewCount: mock.viewCount,
        categories: {
          create: [
            ...(primaryCategory ? [{ categoryId: primaryCategory.id, isPrimary: true }] : []),
            ...(subCategory ? [{ categoryId: subCategory.id, isPrimary: false }] : []),
          ],
        },
        amenities: {
          create: mock.amenitySlugs
            .map((slug) => amenityBySlug.get(slug))
            .filter((a): a is NonNullable<typeof a> => Boolean(a))
            .map((a) => ({ amenityId: a.id })),
        },
        services: { create: mock.services.map((name) => ({ name })) },
        hours: { create: hoursTemplate },
        offers: mock.hasOffer
          ? {
              create: [
                {
                  title: "Limited-time offer",
                  description: "Special introductory pricing for new customers.",
                  discountLabel: "10% OFF",
                },
              ],
            }
          : undefined,
        reviews: {
          create: [
            {
              authorName: "Anonymous User",
              rating: Math.round(mock.avgRating),
              comment: "Great experience, would recommend.",
            },
          ],
        },
      },
    });
    created++;
  }

  console.log(`Created ${created} mock business(es).`);
}

async function main() {
  const shouldClear = process.argv.includes("--clear");
  if (shouldClear) {
    await clearMockBusinesses();
    return;
  }
  await seedMockBusinesses();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
