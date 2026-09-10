import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { request } from "@/app/lib/api";
import { getCategories, searchBusinesses, type CategoryOption } from "@/app/lib/search-api";
import { buildBreadcrumbJsonLd, generateHealthcareKeywords } from "@/app/lib/json-ld";
import JsonLd from "@/app/components/seo/JsonLd";
import CategoryDetailsClient from "./CategoryDetailsClient";

interface PlatformStats {
  businessCount: number;
  pincodeCount: number;
}

export const revalidate = 3600;

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  hospital: "hospitals",
  clinic: "clinics",
  doctor: "doctors-clinics",
  pharmacy: "pharmacies",
  lab: "diagnostic-labs",
  dentist: "dentists",
  "dental-clinic": "dentists",
  "eye-clinic": "eye-clinics",
};

function findCategoryOrSubcategory(categories: CategoryOption[], rawSlug: string): CategoryOption | null {
  const slug = CATEGORY_SLUG_ALIASES[rawSlug] || rawSlug;

  const directCat = categories.find((c: any) => c.slug === slug);
  if (directCat) return directCat;

  for (const parentCat of categories) {
    const sub = parentCat.subcategories?.find((s: any) => s.slug === slug);
    if (sub) {
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        icon: sub.icon,
        businessCount: sub.businessCount,
        subcategories: parentCat.subcategories,
      };
    }
  }

  const normalized = slug.toLowerCase().replace(/-/g, "");
  const fallbackCat = categories.find((c: any) => c.slug.toLowerCase().replace(/-/g, "") === normalized);
  if (fallbackCat) return fallbackCat;

  for (const parentCat of categories) {
    const sub = parentCat.subcategories?.find((s: any) => s.slug.toLowerCase().replace(/-/g, "") === normalized);
    if (sub) {
      return {
        id: sub.id,
        name: sub.name,
        slug: sub.slug,
        icon: sub.icon,
        businessCount: sub.businessCount,
        subcategories: parentCat.subcategories,
      };
    }
  }

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = findCategoryOrSubcategory(categories, slug);
  if (!category) notFound();

  const isHealthcare = category.name.toLowerCase().includes("health") || category.name.toLowerCase().includes("medical") || category.name.toLowerCase().includes("doctor") || category.name.toLowerCase().includes("clinic") || category.name.toLowerCase().includes("lab") || category.name.toLowerCase().includes("hospital") || category.name.toLowerCase().includes("pharmacy");

  const title = isHealthcare
    ? `Top ${category.name} in Bangalore & India | Compare Ratings & OPD Hours | Hubigo`
    : `Top ${category.name} in Bangalore & India | Hubigo`;
  const description = isHealthcare
    ? `Find ${category.businessCount.toLocaleString("en-IN")} verified ${category.name} on Hubigo Healthcare. Compare ratings, doctor profiles, phone numbers, addresses, and OPD timings.`
    : `Find ${category.businessCount.toLocaleString("en-IN")} ${category.name} listed on Hubigo across India.`;
  const canonical = `/category/${slug}`;
  const keywords = generateHealthcareKeywords(category.name, undefined, "Bangalore");

  return {
    title,
    description,
    keywords,
    robots: {
      index: true,
      follow: true,
    },
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const categories = await getCategories();
  const category = findCategoryOrSubcategory(categories, slug);
  if (!category) notFound();

  const [platformStats, featuredResult] = await Promise.all([
    request<PlatformStats>("/api/v2/stats").catch(() => null),
    searchBusinesses({ category: category.slug, sort: "rating", limit: 24 }).catch(() => null),
  ]);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/category" },
    { name: category.name, path: `/category/${category.slug}` },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <CategoryDetailsClient
        slug={category.slug}
        initialCategory={category}
        initialPlatformStats={platformStats}
        initialFeatured={featuredResult?.items ?? []}
      />
    </>
  );
}
