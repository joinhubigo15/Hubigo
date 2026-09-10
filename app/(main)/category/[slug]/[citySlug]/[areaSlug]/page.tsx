import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { searchBusinesses, getCategories, getArea, type CategoryOption } from "@/app/lib/search-api";
import { isNotFoundError } from "@/app/lib/api";
import { buildBreadcrumbJsonLd, generateHealthcareKeywords } from "@/app/lib/json-ld";
import JsonLd from "@/app/components/seo/JsonLd";
import PseoBusinessGrid from "@/app/components/pseo/PseoBusinessGrid";
import { pseoRobotsMeta, PSEO_DISPLAY_LIMIT, PSEO_MAX_EXPOSED } from "@/app/lib/pseo-thresholds";

export const revalidate = 3600;

const CATEGORY_SLUG_ALIASES: Record<string, string> = {
  hospitals: "hospital",
  hospital: "hospital",
  clinics: "clinic",
  clinic: "clinic",
  doctors: "doctor",
  doctor: "doctor",
  pharmacies: "pharmacy",
  pharmacy: "pharmacy",
  labs: "lab",
  lab: "lab",
  dentists: "dentist",
  dentist: "dentist",
};

function findCategory(categories: CategoryOption[], rawSlug: string): CategoryOption | null {
  const normalizedSlug = CATEGORY_SLUG_ALIASES[rawSlug] || rawSlug;

  const directCat = categories.find((c) => c.slug === normalizedSlug || c.slug === rawSlug);
  if (directCat) return directCat;

  for (const parentCat of categories) {
    const sub = parentCat.subcategories.find((s) => s.slug === normalizedSlug || s.slug === rawSlug);
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

  const clean = rawSlug.toLowerCase().replace(/s$/, "").replace(/-/g, "");
  const fallback = categories.find((c) => c.slug.toLowerCase().replace(/-/g, "") === clean);
  if (fallback) return fallback;

  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; citySlug: string; areaSlug: string }>;
}): Promise<Metadata> {
  const { slug, citySlug, areaSlug } = await params;

  const [categories, area] = await Promise.all([
    getCategories(),
    getArea(citySlug, areaSlug).catch((err) => {
      if (isNotFoundError(err)) return null;
      throw err;
    }),
  ]);
  const category = findCategory(categories, slug);
  if (!category || !area) notFound();

  const categoryName = category.name;
  const targetCategorySlug = category.slug;

  let result = await searchBusinesses({
    category: targetCategorySlug,
    city: citySlug,
    area: areaSlug,
    sort: "rating",
    limit: PSEO_DISPLAY_LIMIT,
  });

  if (result.items.length === 0) {
    result = await searchBusinesses({
      category: targetCategorySlug,
      city: citySlug,
      sort: "rating",
      limit: PSEO_DISPLAY_LIMIT,
    });
  }

  if (result.items.length === 0) {
    notFound();
  }

  const title = `Top ${categoryName} in ${area.name}, ${area.cityName} | OPD Hours & Phone | Hubigo`;
  const description = `Discover top-rated ${categoryName} in ${area.name}, ${area.cityName} — ${result.total.toLocaleString("en-IN")} listings with ratings, contact numbers, addresses, and OPD timings on Hubigo.`;
  const canonical = `/category/${slug}/${citySlug}/${areaSlug}`;
  const keywords = generateHealthcareKeywords(categoryName, undefined, area.cityName, area.name);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: pseoRobotsMeta(true),
    openGraph: { title, description, url: canonical, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CategoryCityAreaPage({
  params,
}: {
  params: Promise<{ slug: string; citySlug: string; areaSlug: string }>;
}) {
  const { slug, citySlug, areaSlug } = await params;

  const [categories, area] = await Promise.all([
    getCategories(),
    getArea(citySlug, areaSlug).catch((err) => {
      if (isNotFoundError(err)) return null;
      throw err;
    }),
  ]);
  const category = findCategory(categories, slug);
  if (!category || !area) notFound();

  const categoryName = category.name;
  const targetCategorySlug = category.slug;

  let result = await searchBusinesses({
    category: targetCategorySlug,
    city: citySlug,
    area: areaSlug,
    sort: "rating",
    limit: PSEO_DISPLAY_LIMIT,
  });

  if (result.items.length === 0) {
    result = await searchBusinesses({
      category: targetCategorySlug,
      city: citySlug,
      sort: "rating",
      limit: PSEO_DISPLAY_LIMIT,
    });
  }

  if (result.items.length === 0) {
    notFound();
  }

  const { items, total } = result;
  const displayCategoryName = categoryName;

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: displayCategoryName, path: `/category/${slug}` },
    { name: area.cityName, path: `/category/${slug}/${citySlug}` },
    { name: area.name, path: `/category/${slug}/${citySlug}/${areaSlug}` },
  ];

  return (
    <>
      <JsonLd data={buildBreadcrumbJsonLd(breadcrumbItems)} />
      <div className="bg-slate-50/60 min-h-screen px-0 lg:px-0 pt-0 pb-4 lg:py-0 flex flex-col gap-0 lg:gap-0 w-full">
        {/* Hero / Header Block */}
        <div className="bg-white rounded-none lg:rounded-none border-y lg:border-b lg:border-x-0 lg:border-t-0 border-slate-100 py-6 px-4 lg:p-8 lg:px-12 shadow-xs lg:shadow-none relative overflow-hidden flex flex-col justify-center gap-2 text-center">
          <div className="absolute right-0 top-0 w-32 h-32 bg-purple-50 rounded-full blur-2xl opacity-70" />
          <div className="absolute left-0 bottom-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-70" />

          <div className="z-10 flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-2xl font-black text-slate-900 leading-tight">
              {displayCategoryName} in {area.name}, {area.cityName}
            </h1>
            <p className="text-xs sm:text-sm lg:hidden text-slate-500 font-medium mt-2">
              {total} {displayCategoryName.toLowerCase()} listings in {area.name}, {area.cityName}
            </p>

            {/* Breadcrumb / Internal Links */}
            <div className="flex items-center gap-2 mt-4 text-[11px] sm:text-xs font-semibold">
              <Link href={`/category/${slug}`} className="text-purple-600 hover:underline">
                {displayCategoryName}
              </Link>
              <span className="text-slate-300">•</span>
              <Link href={`/category/${slug}/${citySlug}`} className="text-purple-600 hover:underline">
                {area.cityName}
              </Link>
            </div>
          </div>
        </div>

        {/* Main Listings Grid */}
        <div className="w-full space-y-4 px-0 lg:px-0 mt-4 lg:mt-0 lg:space-y-0">
          <div className="px-4 lg:px-12 lg:py-8 lg:bg-white lg:border-b lg:border-slate-100">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Top Rated {displayCategoryName} in {area.name}, {area.cityName}
            </h2>
          </div>
          <div className="lg:bg-white lg:p-12 lg:pt-0 lg:pb-12 lg:border-b lg:border-slate-100">
            <PseoBusinessGrid
              initialItems={items}
              maxExposed={Math.min(total, PSEO_MAX_EXPOSED)}
              queryFilters={{ category: targetCategorySlug, city: citySlug, area: areaSlug }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
