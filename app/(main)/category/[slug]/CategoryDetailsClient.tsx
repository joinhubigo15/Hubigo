"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Store,
  Star,
  MapPin,
  ChevronRight,
  ArrowRight,
  HeartPulse,
  Stethoscope,
  Hospital,
  Building2,
  Phone,
  MessageSquare,
  SlidersHorizontal,
  Activity,
  Sparkles,
  TestTube,
  Pill,
} from "lucide-react";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import {
  searchBusinesses,
  type CategoryOption,
  type BusinessSummary,
} from "@/app/lib/search-api";
import { useNearbyLocation } from "@/app/lib/useNearbyLocation";

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
  const { location } = useNearbyLocation();
  const activeLat = location.lat ?? undefined;
  const activeLng = location.lng ?? undefined;

  const [category] = useState<CategoryOption | null>(initialCategory);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>(initialFeatured);
  const [loading, setLoading] = useState(false);

  const listingsSectionRef = useRef<HTMLDivElement | null>(null);

  function selectSubcategory(subSlug: string | null) {
    setActiveSubcategory(subSlug);
    if (typeof window !== "undefined") {
      requestAnimationFrame(() => {
        listingsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  useEffect(() => {
    setLoading(true);
    searchBusinesses({
      category: activeSubcategory ? undefined : slug,
      subcategory: activeSubcategory ?? undefined,
      lat: activeLat,
      lng: activeLng,
      sort: "rating",
      limit: 24,
    })
      .then((res) => {
        setBusinesses(res.items);
      })
      .catch(() => {
        if (!initialFeatured || initialFeatured.length === 0) {
          setBusinesses([]);
        }
      })
      .finally(() => setLoading(false));
  }, [slug, activeSubcategory, activeLat, activeLng]);

  const title = category?.name ?? (slug ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "Healthcare Category");

  const CategoryIcon =
    slug === "health-and-medicine" || slug === "healthcare" || slug === "healthcare-and-medical"
      ? HeartPulse
      : slug === "hospitals"
      ? Hospital
      : slug === "clinics" || slug === "doctors-clinics"
      ? Stethoscope
      : slug === "pharmacies"
      ? Pill
      : slug === "diagnostic-labs"
      ? TestTube
      : slug === "physiotherapy"
      ? Activity
      : slug === "dentists"
      ? Sparkles
      : HeartPulse;

  const activeSubcategoryObj = category?.subcategories.find((sc) => sc.slug === activeSubcategory);

  if (!category) {
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
    <div className="bg-slate-50/60 min-h-screen pb-12 w-full space-y-4 sm:space-y-6">
      {/* Category Hero Block */}
      <div className="bg-white border-b border-slate-200/80 py-6 px-4 lg:px-8 shadow-2xs relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200/80 uppercase tracking-wider">
                Healthcare Category
              </span>
              {category.businessCount > 0 && (
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  {category.businessCount.toLocaleString("en-IN")} Providers
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
              {title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
              Find {title.toLowerCase()} providers, clinics, diagnostic centers, and medical specialists across India. Compare ratings, addresses, and OPD hours.
            </p>
          </div>

          <div className="w-14 h-14 lg:w-20 lg:h-20 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs border border-emerald-100">
            <CategoryIcon className="w-7 h-7 lg:w-10 lg:h-10" />
          </div>
        </div>
      </div>

      {/* Subcategory Scroll Filter Bar (Mobile & Desktop) */}
      {category.subcategories.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="bg-white rounded-xl border border-slate-200/80 p-2 sm:p-3 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 pr-1 border-r border-slate-100">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subcategories:</span>
              </span>

              <button
                onClick={() => selectSubcategory(null)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                  activeSubcategory === null
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                }`}
              >
                All {title} ({category.businessCount || businesses.length})
              </button>

              {category.subcategories.map((sc) => {
                const isActive = activeSubcategory === sc.slug;
                return (
                  <button
                    key={sc.id}
                    onClick={() => selectSubcategory(sc.slug)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? "bg-purple-600 text-white shadow-xs"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/70"
                    }`}
                  >
                    <span>{sc.name}</span>
                    {sc.businessCount > 0 && (
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                          isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {sc.businessCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Business Listings Grid Section */}
      <div ref={listingsSectionRef} className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900">
              {activeSubcategoryObj ? activeSubcategoryObj.name : `All ${title} Providers`}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Showing {businesses.length} healthcare listings in this category
            </p>
          </div>

          <Link
            href={`/search?${activeSubcategory ? `subcategory=${activeSubcategory}` : `category=${slug}`}`}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1 transition-colors bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-200/70"
          >
            <span>Search Filter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 bg-slate-200/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5">
            {businesses.map((b) => (
              <CategoryBusinessCard key={b.id} b={b} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4 my-4 shadow-2xs">
            <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-bold text-slate-900">No listings found in this specific filter</h3>
              <p className="text-xs text-slate-500">
                Try clearing the subcategory filter to view all healthcare listings in {title}.
              </p>
            </div>
            <button
              onClick={() => selectSubcategory(null)}
              className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-purple-700 transition-colors"
            >
              Show All {title}
            </button>
          </div>
        )}
      </div>

      {/* Subcategories Explorer Card Grid (At bottom) */}
      {category.subcategories.length > 0 && (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 pt-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-6 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Explore Healthcare Subcategories & Specializations
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Browse departments and specialized medical services in {title}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {category.subcategories.map((sc) => {
                const isActive = activeSubcategory === sc.slug;
                return (
                  <button
                    key={sc.id}
                    onClick={() => selectSubcategory(sc.slug)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer group ${
                      isActive
                        ? "bg-purple-50 border-purple-300 shadow-2xs"
                        : "bg-slate-50/70 border-slate-200/80 hover:bg-purple-50/50 hover:border-purple-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white text-purple-600 flex items-center justify-center shrink-0 border border-slate-200/80 group-hover:border-purple-200 shadow-2xs">
                        <Store className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                      <span className="text-xs font-extrabold text-slate-800 group-hover:text-purple-600 transition-colors truncate">
                        {sc.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-purple-600 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBusinessCard({ b }: { b: BusinessSummary }) {
  return (
    <Link
      href={`/business/${b.slug}`}
      className="group bg-white rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between"
    >
      <div>
        {/* Cover Photo */}
        <div className="relative w-full h-24 sm:h-28 lg:h-32 bg-slate-100 overflow-hidden">
          {b.coverImageUrl ? (
            <Image
              src={b.coverImageUrl}
              alt={`${b.name} in ${b.cityName}`}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Building2 className="w-6 h-6" />
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute bottom-1.5 left-1.5 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
            <Star className="w-2.5 h-2.5 fill-current text-white" />
            <span>{b.avgRating.toFixed(1)}</span>
          </div>

          {/* Verified Badge */}
          {b.isVerified && (
            <div className="absolute top-1.5 left-1.5">
              <VerifiedBadge size="xs" iconOnly />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-3 space-y-1">
          <span className="text-[9px] font-bold text-slate-400 block truncate">
            {b.primaryCategoryName || "Healthcare Provider"}
          </span>
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-purple-600 transition-colors line-clamp-1 leading-snug">
            {b.name}
          </h3>
          <div className="flex items-center gap-1 text-[10px] font-semibold text-slate-500 pt-0.5">
            <MapPin className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="truncate">{[b.areaName || b.localityName, b.cityName].filter(Boolean).join(", ")}</span>
          </div>
        </div>
      </div>

      {/* Footer link */}
      <div className="p-2.5 sm:p-3 pt-0 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-purple-600 mt-2">
        <span>View Details</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
      </div>
    </Link>
  );
}
