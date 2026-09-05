import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { request } from "@/app/lib/api";
import { getCategories, searchBusinesses } from "@/app/lib/search-api";
import { buildBreadcrumbJsonLd, generateHealthcareKeywords } from "@/app/lib/json-ld";
import JsonLd from "@/app/components/seo/JsonLd";
import CategoryDetailsClient from "./CategoryDetailsClient";

interface PlatformStats {
  businessCount: number;
  pincodeCount: number;
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug) ?? null;
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

  // No .catch() — the list itself failing to load must propagate rather than being treated as
  // "no categories exist", which would otherwise 404 every category page and cache that for an
  // hour. Only "list loaded fine, slug just isn't in it" is a genuine not-found case.
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug) ?? null;
  if (!category) notFound();

  const [platformStats, featuredResult] = await Promise.all([
    request<PlatformStats>("/api/v1/stats").catch(() => null),
    searchBusinesses({ category: slug, sort: "rating", limit: 24 }).catch(() => null),
  ]);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Categories", path: "/category" },
    { name: category.name, path: `/category/${slug}` },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <CategoryDetailsClient
        slug={slug}
        initialCategory={category}
        initialPlatformStats={platformStats}
        initialFeatured={featuredResult?.items ?? []}
      />
    </>
  );
}
