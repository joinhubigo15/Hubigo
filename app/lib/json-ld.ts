import type { BusinessDetail } from "@/app/lib/search-api";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://findhubigo.com";

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function generateHealthcareKeywords(
  categoryName?: string,
  subcategoryName?: string,
  cityName = "Bangalore",
  areaName?: string
): string[] {
  const sub = subcategoryName || categoryName || "Healthcare";
  const area = areaName ? `in ${areaName}` : `in ${cityName}`;
  const areaSuffix = areaName ? `${areaName} ${cityName}` : cityName;
  const sLower = sub.toLowerCase();

  const domainKeywords: string[] = [];
  if (sLower.includes("dent")) {
    domainKeywords.push("root canal treatment", "dental implants", "clear aligners", "teeth whitening", "orthodontic braces", "pediatric dentistry");
  } else if (sLower.includes("eye") || sLower.includes("ophthalm") || sLower.includes("cataract")) {
    domainKeywords.push("cataract surgery", "lasik vision correction", "glaucoma treatment", "retina care", "eye checkup");
  } else if (sLower.includes("child") || sLower.includes("pediatr")) {
    domainKeywords.push("child vaccination", "pediatric OPD", "newborn care", "infant specialist", "child growth tracking");
  } else if (sLower.includes("lab") || sLower.includes("diagnost") || sLower.includes("patholog")) {
    domainKeywords.push("blood test home collection", "full body health checkup", "digital x-ray", "ultrasound scan USG", "ECG test");
  } else if (sLower.includes("hospital")) {
    domainKeywords.push("24/7 emergency care", "ICU beds", "cashless TPA insurance", "operation theatre", "multispecialty OPD");
  } else if (sLower.includes("skin") || sLower.includes("derma")) {
    domainKeywords.push("acne scar treatment", "laser hair removal", "dermatology OPD", "chemical peels", "anti aging treatment");
  } else if (sLower.includes("ortho")) {
    domainKeywords.push("knee joint replacement", "arthritis care", "fracture treatment", "spine specialist", "physiotherapy");
  } else if (sLower.includes("gynaec") || sLower.includes("women") || sLower.includes("maternity")) {
    domainKeywords.push("pregnancy care", "normal C-section delivery", "PCOS PCOD treatment", "IVF consultation", "antenatal OPD");
  }

  return Array.from(
    new Set([
      // Broad & High Intent Search Phrases
      `${sub} ${area}`,
      `best ${sLower} ${area}`,
      `top rated ${sLower} ${areaSuffix}`,
      `${sLower} near me`,
      `find ${sLower} ${areaSuffix}`,
      
      // Granular Micro / Long-Tail Search Keywords
      `24/7 ${sLower} ${areaSuffix}`,
      `emergency ${sLower} ${areaSuffix}`,
      `contact number of ${sLower} ${areaSuffix}`,
      `phone number ${sLower} ${areaSuffix}`,
      `address of ${sLower} ${areaSuffix}`,
      `OPD timings ${sLower} ${areaSuffix}`,
      `consultation fee ${sLower} ${areaSuffix}`,
      `doctor appointment ${sLower} ${areaSuffix}`,
      `book appointment ${sLower} ${areaSuffix}`,
      `verified ${sLower} ${areaSuffix}`,
      `doctors list ${sLower} ${areaSuffix}`,
      `cashless insurance ${sLower} ${areaSuffix}`,
      
      ...domainKeywords.map(k => `${k} ${areaSuffix}`),
      ...domainKeywords,

      // Platform Brand & Directory Intent
      "Hubigo Healthcare",
      "findhubigo.com",
      "medical directory India",
      `healthcare services ${cityName}`,
    ])
  );
}

export function getMedicalSchemaType(categoryOrSubcategory?: string): string[] {
  if (!categoryOrSubcategory) return ["LocalBusiness"];
  const lower = categoryOrSubcategory.toLowerCase();

  if (lower.includes("hospital")) return ["Hospital", "MedicalBusiness", "LocalBusiness"];
  if (lower.includes("lab") || lower.includes("diagnostic") || lower.includes("patholog")) return ["DiagnosticLab", "MedicalBusiness", "LocalBusiness"];
  if (lower.includes("pharmacy") || lower.includes("chemist")) return ["Pharmacy", "MedicalBusiness", "LocalBusiness"];
  if (lower.includes("doctor") || lower.includes("physician") || lower.includes("dermatolog") || lower.includes("pediatric")) return ["Physician", "MedicalBusiness", "LocalBusiness"];
  if (lower.includes("clinic") || lower.includes("eye") || lower.includes("optometrist") || lower.includes("dental")) return ["MedicalClinic", "MedicalBusiness", "LocalBusiness"];

  return ["MedicalBusiness", "LocalBusiness"];
}

// Only real, fetched fields — aggregateRating is omitted entirely when there are no reviews,
// rather than claiming a rating that doesn't exist.
export function buildLocalBusinessJsonLd(business: BusinessDetail, slug: string) {
  const canonical = `${SITE_URL}/business/${slug}`;
  const primaryCat = business.categories?.find((c) => c.isPrimary)?.category?.name || business.categories?.[0]?.category?.name || "";
  const allCatNames = business.categories?.map((c) => c.category?.name).filter(Boolean).join(" ") || "";
  const lowerCat = `${primaryCat} ${allCatNames}`.toLowerCase();

  const isHealthcare =
    lowerCat.includes("health") ||
    lowerCat.includes("medical") ||
    lowerCat.includes("hospital") ||
    lowerCat.includes("clinic") ||
    lowerCat.includes("lab") ||
    lowerCat.includes("pharmacy") ||
    lowerCat.includes("doctor") ||
    lowerCat.includes("dental") ||
    lowerCat.includes("dentist") ||
    lowerCat.includes("patholog") ||
    lowerCat.includes("eye") ||
    lowerCat.includes("optometr") ||
    lowerCat.includes("pediatric") ||
    lowerCat.includes("derma") ||
    lowerCat.includes("physio");

  const schemaTypes = isHealthcare
    ? getMedicalSchemaType(primaryCat || allCatNames)
    : ["LocalBusiness"];

  return {
    "@context": "https://schema.org",
    "@type": schemaTypes.length === 1 ? schemaTypes[0] : schemaTypes,
    "@id": canonical,
    url: canonical,
    name: business.name,
    image: business.coverImageUrl ?? undefined,
    telephone: business.phone ?? undefined,
    priceRange: business.priceRange ?? undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: business.city.name,
      postalCode: business.pincode ?? undefined,
      addressCountry: "IN",
    },
    geo:
      business.lat != null && business.lng != null
        ? { "@type": "GeoCoordinates", latitude: business.lat, longitude: business.lng }
        : undefined,
    aggregateRating:
      business.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: String(business.avgRating),
            reviewCount: String(business.reviewCount),
          }
        : undefined,
    keywords: generateHealthcareKeywords(primaryCat, undefined, business.city.name, business.areaName || undefined).join(", "),
    ...(isHealthcare
      ? {
          isAcceptingNewPatients: true,
          availableService: [
            { "@type": "MedicalProcedure", name: "OPD Consultation & Care" },
            { "@type": "MedicalProcedure", name: "Diagnostic & Health Testing" },
          ],
        }
      : {}),
  };
}

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildFaqJsonLd(faqs: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Hubigo Healthcare",
    alternateName: "Hubigo Medical Directory",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [
      "https://facebook.com/hubigo",
      "https://twitter.com/hubigo",
      "https://linkedin.com/company/hubigo",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91 80 4000 0000",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi", "Kannada"],
    },
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hubigo Healthcare",
    alternateName: "Hubigo Medical & Healthcare Discovery Platform",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
