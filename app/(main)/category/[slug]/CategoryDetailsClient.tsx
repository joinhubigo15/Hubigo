"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Store, Star, MapPin, ChevronRight, ArrowRight, UtensilsCrossed, HeartPulse, GraduationCap, Wrench, Car } from "lucide-react";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import {
  searchBusinesses,
  type CategoryOption,
  type BusinessSummary,
} from "@/app/lib/search-api";

interface PlatformStats {
  businessCount: number;
  pincodeCount: number;
}

export default function CategoryDetailsPage({
  slug,
  initialCategory,
  initialPlatformStats,
  initialFeatured,
}: {
  slug: string;
  initialCategory: CategoryOption | null;
  initialPlatformStats: PlatformStats | null;
  initialFeatured: BusinessSummary[];
}) {
  const [category] = useState<CategoryOption | null>(initialCategory);
  const [loadingCategory] = useState(false);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [featured, setFeatured] = useState<BusinessSummary[]>(initialFeatured);
  const [loadingFeatured, setLoadingFeatured] = useState(false);
  // Platform-wide totals (not this category's own, smaller numbers) — the real, trust-building
  // headline figures: total businesses on Hubigo and total distinct pincodes we cover.
  const [platformStats] = useState<PlatformStats | null>(initialPlatformStats);

  // page.tsx (server) already fetched the category, platform stats, and the "All"-tab featured
  // businesses for this slug — skip re-fetching those on mount. Only refetch featured businesses
  // when the visitor picks a different subcategory tab (a genuinely interactive, client-only state).
  const initialSlugRef = useRef<string | null>(slug);
  useEffect(() => {
    if (slug === initialSlugRef.current && activeSubcategory === null) return;
    setLoadingFeatured(true);
    searchBusinesses({
      category: activeSubcategory ? undefined : slug,
      subcategory: activeSubcategory ?? undefined,
      sort: "rating",
      limit: 6,
    })
      .then((res) => setFeatured(res.items))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));
  }, [slug, activeSubcategory]);

  const title = category?.name ?? (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Category");

  const CategoryIcon = slug === "food-and-beverage" ? UtensilsCrossed :
                       (slug === "health-and-medicine" || slug === "healthcare") ? HeartPulse :
                       slug === "education" ? GraduationCap :
                       slug === "home-services" ? Wrench :
                       (slug === "automotive" || slug === "automotive-services") ? Car :
                       Store;

  if (!loadingCategory && !category) {
    return (
      <div className="bg-slate-50/60 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-black text-slate-900">Category not found</h1>
          <Link href="/search" className="inline-block text-sm font-bold text-purple-600 hover:underline">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-0 lg:px-0 pt-0 pb-4 lg:py-0 flex flex-col gap-0 lg:gap-0 w-full">
      {/* Category Hero Block */}
      <div className="bg-white rounded-none lg:rounded-none border-y lg:border-b lg:border-x-0 lg:border-t-0 border-slate-100 py-4 px-4 lg:p-6 lg:px-6 shadow-xs lg:shadow-none relative overflow-hidden flex flex-row items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl opacity-70" />

        <div className="space-y-1.5 z-10 flex-1 min-w-0 pr-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight truncate">{title}</h1>
          <p className="text-xs text-slate-500 max-w-md leading-relaxed font-medium mt-0.5 truncate sm:whitespace-normal">
            Find the best {title.toLowerCase()} businesses near you. Compare ratings and reviews.
          </p>
        </div>

        <div className="flex w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-orange-50 text-orange-500 items-center justify-center shrink-0 z-10 shadow-2xs border border-orange-100">
          <CategoryIcon className="w-6 h-6 lg:w-8 lg:h-8" />
        </div>
      </div>

      {/* Subcategory scroll pills bar */}
      {category && category.subcategories.length > 0 && (
        <div className="hidden lg:flex items-center gap-2 overflow-x-auto px-4 lg:px-6 pb-1.5 lg:pb-3 lg:py-3 lg:bg-white lg:border-b lg:border-slate-100 scrollbar-none shrink-0">
          <button
            onClick={() => setActiveSubcategory(null)}
            className={
              activeSubcategory === null
                ? "px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-none lg:rounded-none shadow-sm whitespace-nowrap"
                : "px-4 py-1.5 bg-white text-slate-600 border border-slate-200 text-xs font-semibold rounded-none lg:rounded-none hover:bg-slate-50 transition-colors whitespace-nowrap"
            }
          >
            All
          </button>
          {category.subcategories.map((sc) => (
            <button
              key={sc.id}
              onClick={() => setActiveSubcategory(sc.slug)}
              className={
                activeSubcategory === sc.slug
                  ? "px-4 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-none lg:rounded-none shadow-sm whitespace-nowrap"
                  : "px-4 py-1.5 bg-white text-slate-600 border border-slate-200 text-xs font-semibold rounded-none lg:rounded-none hover:bg-slate-50 transition-colors whitespace-nowrap"
              }
            >
              {sc.name}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 items-start lg:items-stretch">
        {/* Left Column: Subcategories list */}
        <div className="lg:col-span-6 bg-white rounded-none lg:rounded-none border-b lg:border-r lg:border-t-0 lg:border-b-0 lg:border-l-0 border-slate-100 -mt-[1px] lg:mt-0 p-4 sm:p-5 lg:p-6 shadow-xs lg:shadow-none space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-semibold">Subcategories</h3>
          {category && category.subcategories.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {category.subcategories.map((sc) => (
                <button
                  key={sc.id}
                  onClick={() => setActiveSubcategory(sc.slug)}
                  className="w-full flex items-center justify-between py-3.5 hover:bg-slate-50/50 rounded-none lg:rounded-none px-2 transition-all cursor-pointer group text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-none lg:rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Store className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-purple-600 transition-colors">
                      {sc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">No subcategories listed.</p>
          )}
        </div>

        {/* Right Column: Featured Section */}
        <div className="lg:col-span-6 bg-white rounded-none lg:rounded-none border-b lg:border-0 border-slate-100 -mt-[1px] lg:mt-0 p-4 sm:p-5 lg:p-6 shadow-xs lg:shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Featured {title}</h3>
            <Link
              href={`/search?${activeSubcategory ? `subcategory=${activeSubcategory}` : `category=${slug}`}`}
              className="text-[11px] font-semibold text-purple-600 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-100 rounded-none lg:rounded-none animate-pulse" />
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {featured.map((r) => (
                <Link
                  key={r.id}
                  href={`/business/${r.slug}`}
                  className="group bg-slate-50 border border-slate-200/40 rounded-none lg:rounded-none overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 flex flex-col"
                >
                  <div className="relative h-20 w-full overflow-hidden bg-slate-200 shrink-0">
                    {r.coverImageUrl ? (
                      <Image
                        src={r.coverImageUrl}
                        alt={`${r.name} in ${r.cityName}`}
                        fill
                        sizes="(min-width: 640px) 33vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Store className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none lg:rounded-none flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{r.avgRating.toFixed(1)}</span>
                    </div>
                    {r.isVerified && (
                      <div className="absolute top-1 right-1">
                        <VerifiedBadge size="xs" iconOnly />
                      </div>
                    )}
                  </div>
                  <div className="p-2.5 flex-1 flex flex-col justify-between">
                    <h4 className="font-bold text-[10px] text-slate-900 leading-tight group-hover:text-purple-600 transition-colors line-clamp-1">
                      {r.name}
                    </h4>
                    <div className="flex items-center gap-0.5 text-[8px] text-slate-500 mt-1">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{r.localityName ?? r.cityName}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 font-medium">No businesses found in this category yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
