import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCities, searchBusinesses } from "@/app/lib/search-api";
import { buildBreadcrumbJsonLd } from "@/app/lib/json-ld";
import JsonLd from "@/app/components/seo/JsonLd";
import CityDetailsClient from "./CityDetailsClient";

const TOP_BUSINESSES_LIMIT = 20;

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cities = await getCities().catch(() => []);
  const city = cities.find((c) => c.slug === slug) ?? null;
  if (!city) notFound();

  const title = `${city.name} Business Directory`;
  const description = `Discover ${city.businessCount.toLocaleString("en-IN")} businesses across ${city.pincodeCount.toLocaleString("en-IN")} areas in ${city.name}, ${city.state}, on Hubigo.`;
  const canonical = `/city/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CityDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cities = await getCities().catch(() => []);
  const city = cities.find((c) => c.slug === slug) ?? null;
  if (!city) notFound();

  const topResult = await searchBusinesses({
    city: slug,
    sort: "rating",
    limit: TOP_BUSINESSES_LIMIT,
  }).catch(() => null);

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Cities", path: "/city" },
    { name: city.name, path: `/city/${slug}` },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <CityDetailsClient
        slug={slug}
        initialCity={city}
        initialTopBusinesses={topResult?.items ?? []}
      />
    </>
  );
}
