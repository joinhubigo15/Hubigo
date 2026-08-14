import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessBySlug, type BusinessDetail } from "@/app/lib/search-api";
import { buildBreadcrumbJsonLd, buildLocalBusinessJsonLd, buildFaqJsonLd } from "@/app/lib/json-ld";
import { deriveBusinessFaqs } from "@/app/lib/business-faqs";
import JsonLd from "@/app/components/seo/JsonLd";
import BusinessDetailClient from "./BusinessDetailClient";

export const revalidate = 3600;

const DESCRIPTION_MAX_LENGTH = 155;

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength).replace(/\s+\S*$/, "");
  return `${cut}…`;
}

// Only real, fetched fields — no invented ratings/claims for businesses without their own
// description or reviews yet.
function buildDescription(business: BusinessDetail): string {
  if (business.description) return truncate(business.description, DESCRIPTION_MAX_LENGTH);

  const primaryCategoryName = business.categories.find((c) => c.isPrimary)?.category.name ?? null;
  const kind = primaryCategoryName ?? "business";
  const ratingClause =
    business.reviewCount > 0
      ? ` Rated ${business.avgRating.toFixed(1)}/5 from ${business.reviewCount.toLocaleString("en-IN")} reviews.`
      : "";

  return truncate(
    `${business.name} is a ${kind} in ${business.city.name}. Find contact details, address, and reviews on Hubigo.${ratingClause}`,
    DESCRIPTION_MAX_LENGTH,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug).catch(() => null);
  if (!business) notFound();

  const title = `${business.name} in ${business.city.name}`;
  const description = buildDescription(business);
  const canonical = `/business/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: business.coverImageUrl ? [{ url: business.coverImageUrl }] : undefined,
    },
    twitter: {
      card: business.coverImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: business.coverImageUrl ? [business.coverImageUrl] : undefined,
    },
  };
}

export default async function BusinessDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await getBusinessBySlug(slug).catch(() => null);
  if (!business) notFound();

  const primaryCategory = business.categories.find((c) => c.isPrimary)?.category ?? null;
  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: business.city.name, path: `/city/${business.city.slug}` },
    ...(primaryCategory ? [{ name: primaryCategory.name, path: `/category/${primaryCategory.slug}` }] : []),
    { name: business.name, path: `/business/${slug}` },
  ];

  const faqs = deriveBusinessFaqs(business);

  return (
    <>
      <JsonLd data={buildLocalBusinessJsonLd(business, slug)} />
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      {faqs.length > 0 && <JsonLd data={buildFaqJsonLd(faqs)} />}
      <BusinessDetailClient slug={slug} initialBusiness={business} />
    </>
  );
}
