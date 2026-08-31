/**
 * Isolated Healthcare Mock Business Data — Premium Healthcare Discovery Platform.
 */
import "dotenv/config";
import { PrismaClient, PlanTier, PriceRange, DayOfWeek } from "@prisma/client";

const prisma = new PrismaClient();

const ALWAYS_OPEN_HOURS: { day: DayOfWeek; openTime: string; closeTime: string }[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
].map((day) => ({ day: day as DayOfWeek, openTime: "00:00", closeTime: "23:59" }));

const STANDARD_CLINIC_HOURS: { day: DayOfWeek; openTime: string; closeTime: string }[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
].map((day) => ({ day: day as DayOfWeek, openTime: "08:00", closeTime: "21:00" }));

interface HealthcareMockBusiness {
  name: string;
  categorySlug: string;
  subcategorySlugs: string[];
  citySlug: string;
  localitySlug?: string;
  address: string;
  pincode?: string;
  phone?: string;
  whatsappPhone?: string;
  website?: string;
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
  offerTitle?: string;
  offerDiscount?: string;
  description: string;
  coverImageUrl: string;
  hours?: "standard" | "always";
}

const healthcareBusinesses: HealthcareMockBusiness[] = [
  {
    name: "Manipal Super Specialty Hospital",
    categorySlug: "hospitals",
    subcategorySlugs: [
      "multispecialty-hospital",
      "super-specialty-hospital",
      "general-hospital",
      "emergency-hospital",
      "trauma-hospital",
      "cardiology-hospital",
      "neurology-hospital",
      "orthopedic-hospital",
      "oncology-hospital",
    ],
    citySlug: "bangalore",
    localitySlug: "indiranagar",
    address: "98, HAL Old Airport Road, Kodihalli, Indiranagar",
    pincode: "560038",
    phone: "+91 80 2502 4444",
    whatsappPhone: "918025024444",
    website: "https://www.manipalhospitals.com",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.9,
    reviewCount: 3840,
    viewCount: 18500,
    keywords: ["hospital", "multispecialty", "emergency", "cardiology", "icu", "neurology"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "card-payment", "cctv", "power-backup"],
    services: ["24x7 Emergency & Trauma", "Robotic Surgery", "Cardiology & Cardiac Surgery", "Organ Transplant", "Advanced ICU"],
    hasOffer: true,
    offerTitle: "Free Master Health Checkup Voucher",
    offerDiscount: "25% OFF",
    description: "Ranked among India's top multispecialty hospitals. Features 24x7 emergency trauma care, world-class ICU, robotic surgery, and 500+ specialist doctors.",
    coverImageUrl: "https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&h=500&fit=crop",
    hours: "always",
  },
  {
    name: "Apollo Medical & Diagnostic Center",
    categorySlug: "doctors-clinics",
    subcategorySlugs: [
      "general-physician",
      "pediatrician",
    ],
    citySlug: "bangalore",
    localitySlug: "koramangala",
    address: "80 Feet Road, 4th Block, Koramangala",
    pincode: "560034",
    phone: "+91 80 4111 8888",
    whatsappPhone: "918041118888",
    website: "https://www.apolloclinics.com",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.moderate,
    avgRating: 4.8,
    reviewCount: 2150,
    viewCount: 12400,
    keywords: ["clinic", "doctor", "health checkup", "general physician", "blood test"],
    amenitySlugs: ["air-conditioning", "parking", "card-payment", "wheelchair-accessible"],
    services: ["Specialist OPD Consultation", "Comprehensive Health Checkups", "ECG & Blood Testing", "Vaccination"],
    hasOffer: true,
    offerTitle: "Full Body Executive Health Screening",
    offerDiscount: "FLAT ₹999",
    description: "Full-service multi-specialty clinic providing OPD consultations with senior physicians, diagnostic blood tests, ultrasound, and preventative health packages.",
    coverImageUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=500&fit=crop",
    hours: "standard",
  },
  {
    name: "Fortis Escorts Heart & Multispecialty Institute",
    categorySlug: "hospitals",
    subcategorySlugs: [
      "super-specialty-hospital",
      "cardiology-hospital",
    ],
    citySlug: "bangalore",
    localitySlug: "hsr-layout",
    address: "154/9, Bannerghatta Main Road & HSR Sector 1",
    pincode: "560102",
    phone: "+91 80 6621 4444",
    whatsappPhone: "918066214444",
    website: "https://www.fortishealthcare.com",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.9,
    reviewCount: 4120,
    viewCount: 22100,
    keywords: ["heart hospital", "cardiology", "angioplasty", "bypass surgery", "fortis"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "power-backup"],
    services: ["Cath Lab Interventions", "Coronary Bypass Surgery", "Heart Failure Clinic", "24x7 Cardiac Emergency"],
    hasOffer: false,
    description: "Premier cardiac & super-specialty hospital renowned for complex heart surgeries, interventional cardiology, vascular surgery, and critical care.",
    coverImageUrl: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=500&fit=crop",
    hours: "always",
  },
  {
    name: "Cloudnine Women & Children's Hospital",
    categorySlug: "hospitals",
    subcategorySlugs: [
      "maternity-hospital",
    ],
    citySlug: "bangalore",
    localitySlug: "whitefield",
    address: "ITPB Main Road, Whitefield",
    pincode: "560066",
    phone: "+91 80 4333 1111",
    whatsappPhone: "918043331111",
    website: "https://www.cloudninehospitals.com",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.8,
    reviewCount: 1890,
    viewCount: 9800,
    keywords: ["maternity hospital", "gynecologist", "pediatrician", "ivf", "pregnancy care"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "card-payment"],
    services: ["Painless Delivery", "High-Risk Pregnancy Care", "Level-III NICU", "Pediatric OPD", "Fertility & IVF"],
    hasOffer: true,
    offerTitle: "Maternity Package Consultation",
    offerDiscount: "15% OFF",
    description: "India's leading maternity, gynaecology, and pediatric care hospital. Specialized in high-risk pregnancy, neonatology, and painless delivery.",
    coverImageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&h=500&fit=crop",
    hours: "always",
  },
  {
    name: "Narayana Nethralaya Super Specialty Eye Hospital",
    categorySlug: "eye-care",
    subcategorySlugs: [
      "eye-hospital",
      "eye-clinic",
      "optometrist",
    ],
    citySlug: "bangalore",
    localitySlug: "rajajinagar",
    address: "121/C, 1st R Block, Rajajinagar",
    pincode: "560010",
    phone: "+91 80 6612 1200",
    whatsappPhone: "918066121200",
    website: "https://www.narayananethralaya.org",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.moderate,
    avgRating: 4.9,
    reviewCount: 5210,
    viewCount: 28400,
    keywords: ["eye hospital", "lasik surgery", "cataract", "retina clinic", "narayana nethralaya"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "card-payment"],
    services: ["Femto-LASIK Vision Correction", "Robotic Cataract Surgery", "Vitreoretinal Care", "Pediatric Ophthalmology"],
    hasOffer: false,
    description: "World-class super-specialty eye care hospital providing advanced Femto-LASIK, robotic cataract surgery, corneal transplants, and pediatric eye care.",
    coverImageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&h=500&fit=crop",
    hours: "standard",
  },
  {
    name: "SRL Diagnostic & Pathology Lab",
    categorySlug: "diagnostic-and-laboratory-services",
    subcategorySlugs: [
      "pathology-lab",
      "diagnostic-center",
      "mri-scan-center",
      "ct-scan-center",
      "blood-testing-lab",
      "radiology-center",
    ],
    citySlug: "bangalore",
    localitySlug: "indiranagar",
    address: "100 Feet Road, Indiranagar",
    pincode: "560038",
    phone: "+91 80 4900 7777",
    whatsappPhone: "918049007777",
    website: "https://www.srlworld.com",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.budget,
    avgRating: 4.7,
    reviewCount: 1650,
    viewCount: 7800,
    keywords: ["diagnostic lab", "blood test", "mri scan", "ct scan", "pathology"],
    amenitySlugs: ["air-conditioning", "card-payment", "power-backup"],
    services: ["Home Sample Collection", "Full Blood Profile", "3T MRI & 128-Slice CT", "Hormone Testing"],
    hasOffer: true,
    offerTitle: "Complete Blood Profile & Lipid Panel",
    offerDiscount: "50% OFF",
    description: "NABL & CAP certified diagnostic network providing accurate blood testing, digital X-rays, 3T MRI scans, and free home sample pickup.",
    coverImageUrl: "https://images.unsplash.com/photo-1579154204601-01588f351e67?w=800&h=500&fit=crop",
    hours: "standard",
  },
  {
    name: "MedPlus 24/7 Pharmacy & Surgical Store",
    categorySlug: "pharmacies-and-medicines",
    subcategorySlugs: [
      "24x7-pharmacy",
      "medical-store",
      "surgical-supply-store",
      "chemist-and-druggist",
      "orthopedic-apparel-store",
    ],
    citySlug: "bangalore",
    localitySlug: "hsr-layout",
    address: "Sector 3, HSR Layout",
    pincode: "560102",
    phone: "+91 80 2572 1234",
    whatsappPhone: "918025721234",
    website: "https://www.medplusmart.com",
    planTier: PlanTier.basic,
    isVerified: true,
    isTrusted: false,
    priceRange: PriceRange.budget,
    avgRating: 4.6,
    reviewCount: 890,
    viewCount: 5400,
    keywords: ["pharmacy", "medical store", "chemist", "24 hours", "medicines"],
    amenitySlugs: ["card-payment", "power-backup", "home-delivery"],
    services: ["24x7 Genuine Medicines", "Doorstep Express Delivery", "Surgical Equipment", "Baby Care Supplies"],
    hasOffer: true,
    offerTitle: "Prescription Medicine Discount",
    offerDiscount: "FLAT 20% OFF",
    description: "Trusted 24-hour licensed retail pharmacy stocking genuine prescription medications, surgical supplies, orthopedic supports, and wellness products.",
    coverImageUrl: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=500&fit=crop",
    hours: "always",
  },
  {
    name: "Aster CMI Super Specialty Hospital",
    categorySlug: "hospitals",
    subcategorySlugs: [
      "super-specialty-hospital",
      "quaternary-care-hospital",
      "tertiary-care-hospital",
      "oncology-hospital",
      "transplant-hospital",
      "neurology-hospital",
    ],
    citySlug: "bangalore",
    localitySlug: "whitefield",
    address: "Hebbal & Whitefield Tech Zone, Bangalore",
    pincode: "560066",
    phone: "+91 80 4342 0100",
    whatsappPhone: "918043420100",
    website: "https://www.asterhospitals.in",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.luxury,
    avgRating: 4.9,
    reviewCount: 3120,
    viewCount: 16900,
    keywords: ["aster hospital", "oncology", "neurosurgery", "organ transplant", "icu"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "cctv", "power-backup"],
    services: ["Comprehensive Cancer Care", "Bone Marrow Transplant", "Brain & Spine Surgery", "Heart & Lung Transplant"],
    hasOffer: true,
    offerTitle: "Senior Citizen Wellness Package",
    offerDiscount: "30% OFF",
    description: "500-bed quaternary care hospital with international accreditation, center of excellence for liver transplant, oncology, neurosurgery, and pediatric cardiac care.",
    coverImageUrl: "https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&h=500&fit=crop",
    hours: "always",
  },
  {
    name: "Dr. Batra's Homeopathy & Wellness Clinic",
    categorySlug: "alternative-and-complementary-healthcare",
    subcategorySlugs: [
      "homeopathy-clinic",
      "dermatology-clinic",
      "trichology-clinic",
      "wellness-center",
      "allergy-clinic",
    ],
    citySlug: "bangalore",
    localitySlug: "koramangala",
    address: "5th Block, Koramangala",
    pincode: "560034",
    phone: "+91 80 4121 9999",
    whatsappPhone: "918041219999",
    website: "https://www.drbatras.com",
    planTier: PlanTier.premium,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.moderate,
    avgRating: 4.7,
    reviewCount: 1420,
    viewCount: 6500,
    keywords: ["homeopathy", "hair loss treatment", "skin care", "asthma", "wellness"],
    amenitySlugs: ["air-conditioning", "card-payment", "wifi"],
    services: ["Natural Hair Fall Treatment", "Skin Psoriasis & Eczema Care", "Asthma & Allergy Care", "Weight Management"],
    hasOffer: true,
    offerTitle: "First Doctor Consultation & Hair Analysis",
    offerDiscount: "FLAT ₹299",
    description: "World's largest chain of homeopathic clinics. Specialized in side-effect-free treatment for hair loss, skin ailments, respiratory allergies, and chronic diseases.",
    coverImageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&h=500&fit=crop",
    hours: "standard",
  },
  {
    name: "Sakra World Hospital",
    categorySlug: "hospitals",
    subcategorySlugs: [
      "multispecialty-hospital",
      "orthopedic-hospital",
      "rehabilitation-hospital",
      "joint-replacement-center",
      "trauma-hospital",
    ],
    citySlug: "bangalore",
    localitySlug: "hsr-layout",
    address: "Devarabeesanahalli, Outer Ring Road, Near HSR Layout",
    pincode: "560102",
    phone: "+91 80 4969 4969",
    whatsappPhone: "918049694969",
    website: "https://www.sakraworldhospital.com",
    planTier: PlanTier.elite,
    isVerified: true,
    isTrusted: true,
    priceRange: PriceRange.premium,
    avgRating: 4.9,
    reviewCount: 2780,
    viewCount: 15100,
    keywords: ["sakra hospital", "japanese medical tech", "orthopedics", "rehab", "icu"],
    amenitySlugs: ["parking", "air-conditioning", "wifi", "wheelchair-accessible", "power-backup"],
    services: ["Japanese Joint Replacement Surgery", "Advanced Neuro Rehab", "Gastroenterology", "24x7 Emergency"],
    hasOffer: false,
    description: "India's first Japanese collaboration hospital bringing cutting-edge Japanese medical technology, advanced rehabilitation, and joint replacement expertise.",
    coverImageUrl: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&h=500&fit=crop",
    hours: "always",
  },
];

async function main() {
  console.log("Cleaning up old mock business listings...");
  
  // Wipe existing mock businesses safely
  const oldMocks = await prisma.business.findMany({
    where: { externalPlaceId: { startsWith: "MOCK-" } },
    select: { id: true },
  });

  const mockIds = oldMocks.map((b) => b.id);
  if (mockIds.length > 0) {
    await prisma.businessCategory.deleteMany({ where: { businessId: { in: mockIds } } });
    await prisma.businessMedia.deleteMany({ where: { businessId: { in: mockIds } } });
    await prisma.businessAmenity.deleteMany({ where: { businessId: { in: mockIds } } });
    await prisma.businessService.deleteMany({ where: { businessId: { in: mockIds } } });
    await prisma.offer.deleteMany({ where: { businessId: { in: mockIds } } });
    await prisma.business.deleteMany({ where: { id: { in: mockIds } } });
  }

  console.log(`Deleted ${mockIds.length} old mock business listings.`);

  // Load Cities & Localities map
  const cities = await prisma.city.findMany({ include: { localities: true } });
  const cityMap = new Map(cities.map((c) => [c.slug, c]));

  // Load Categories map
  const categories = await prisma.category.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c]));

  // Load Amenities map
  const amenities = await prisma.amenity.findMany();
  const amenityMap = new Map(amenities.map((a) => [a.slug, a]));

  let insertedCount = 0;

  for (const item of healthcareBusinesses) {
    const city = cityMap.get(item.citySlug);
    if (!city) {
      console.warn(`City not found: ${item.citySlug}`);
      continue;
    }

    const locality = item.localitySlug
      ? city.localities.find((l) => l.slug === item.localitySlug)
      : undefined;

    const parentCat = categoryMap.get(item.categorySlug);

    if (!parentCat) {
      console.warn(`Parent category not found: ${item.categorySlug}`);
      continue;
    }

    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const externalPlaceId = `MOCK-HEALTHCARE-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const business = await prisma.business.create({
      data: {
        name: item.name,
        slug,
        description: item.description,
        address: item.address,
        cityId: city.id,
        localityId: locality?.id ?? null,
        pincode: item.pincode ?? locality?.pincode ?? "560034",
        lat: locality?.lat ?? city.lat ?? 12.9716,
        lng: locality?.lng ?? city.lng ?? 77.5946,
        phone: item.phone ?? "+91 80 4000 0000",
        whatsappPhone: item.whatsappPhone ?? "918040000000",
        website: item.website ?? "https://hubigo.in",
        planTier: item.planTier,
        isVerified: item.isVerified,
        isTrusted: item.isTrusted,
        priceRange: item.priceRange,
        avgRating: item.avgRating,
        reviewCount: item.reviewCount,
        viewCount: item.viewCount,
        status: "approved",
        claimedAt: new Date(),
        externalPlaceId,
        coverImageUrl: item.coverImageUrl,
        openHoursRaw: JSON.stringify(item.hours === "always" ? ALWAYS_OPEN_HOURS : STANDARD_CLINIC_HOURS),
      },
    });

    // Link Primary Parent Category
    await prisma.businessCategory.create({
      data: {
        businessId: business.id,
        categoryId: parentCat.id,
        isPrimary: true,
      },
    });

    // Link Subcategories
    for (let sIdx = 0; sIdx < item.subcategorySlugs.length; sIdx++) {
      const subSlug = item.subcategorySlugs[sIdx];
      const subCat = categoryMap.get(subSlug);
      if (subCat && subCat.id !== parentCat.id) {
        await prisma.businessCategory.create({
          data: {
            businessId: business.id,
            categoryId: subCat.id,
            isPrimary: false,
          },
        });
      }
    }

    // Add Media Cover Photo
    await prisma.businessMedia.create({
      data: {
        businessId: business.id,
        type: "image",
        url: item.coverImageUrl,
        sortOrder: 0,
      },
    });

    // Link Amenities
    for (const aSlug of item.amenitySlugs) {
      const amenity = amenityMap.get(aSlug);
      if (amenity) {
        await prisma.businessAmenity.create({
          data: {
            businessId: business.id,
            amenityId: amenity.id,
          },
        });
      }
    }

    // Add Services
    for (let i = 0; i < item.services.length; i++) {
      await prisma.businessService.create({
        data: {
          businessId: business.id,
          name: item.services[i],
        },
      });
    }

    // Add Offer if applicable
    if (item.hasOffer) {
      await prisma.offer.create({
        data: {
          businessId: business.id,
          title: item.offerTitle ?? "Special Health Checkup Discount",
          description: "Exclusive offer available for Hubigo users. Show this card at registration.",
          discountLabel: item.offerDiscount ?? "20% OFF",
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days valid
        },
      });
    }

    insertedCount++;
  }

  console.log(`Seeded ${insertedCount} Healthcare businesses with multiple subcategories successfully!`);
}

main()
  .catch((err) => {
    console.error("Fatal error seeding healthcare businesses:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
