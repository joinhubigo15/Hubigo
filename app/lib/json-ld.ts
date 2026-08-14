import type { BusinessDetail } from "@/app/lib/search-api";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

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

// Only real, fetched fields — aggregateRating is omitted entirely when there are no reviews,
// rather than claiming a rating that doesn't exist.
export function buildLocalBusinessJsonLd(business: BusinessDetail, slug: string) {
  const canonical = `${SITE_URL}/business/${slug}`;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
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
    name: "Hubigo",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Hubigo",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}
