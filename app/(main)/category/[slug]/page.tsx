import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { request } from "@/app/lib/api";
import { getCategories, searchBusinesses } from "@/app/lib/search-api";
import { buildBreadcrumbJsonLd } from "@/app/lib/json-ld";
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
  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug) ?? null;
  if (!category) notFound();

  const title = `${category.name} in India`;
  const description = `Find ${category.businessCount.toLocaleString("en-IN")} ${category.name} listed on Hubigo across India.`;
  const canonical = `/category/${slug}`;

  return {
    title,
    description,
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

  const categories = await getCategories().catch(() => []);
  const category = categories.find((c) => c.slug === slug) ?? null;
  if (!category) notFound();

  const [platformStats, featuredResult] = await Promise.all([
    request<PlatformStats>("/api/v1/stats").catch(() => null),
    searchBusinesses({ category: slug, sort: "rating", limit: 6 }).catch(() => null),
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
