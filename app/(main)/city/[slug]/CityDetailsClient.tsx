"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Store, Building2 } from "lucide-react";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import CategoryStrip from "@/app/components/sections/CategoryStrip";
import {
  searchBusinesses,
  type CityOption,
  type BusinessSummary,
} from "@/app/lib/search-api";

const TOP_BUSINESSES_LIMIT = 20;

// Served from the R2 "business" bucket's city-images/ prefix (see backend/scripts/upload-city-images-r2.ts)
// rather than /public — keeps these in the same CDN-backed storage as every other image on the site.
const R2_BASE = process.env.NEXT_PUBLIC_R2_BUSINESS_BUCKET_URL ?? "";

const CITY_BG_MAP: Record<string, string> = {
  bangalore: `${R2_BASE}/city-images/bg1.jpg`,
  chennai: `${R2_BASE}/city-images/bg2.jpg`,
  hyderabad: `${R2_BASE}/city-images/bg3.jpg`,
};

export default function CityDetailsPage({
  slug,
  initialCity,
  initialTopBusinesses,
}: {
  slug: string;
  initialCity: CityOption | null;
  initialTopBusinesses: BusinessSummary[];
}) {
  const [city] = useState<CityOption | null>(initialCity);
  const [loadingCity] = useState(false);
  const [topBusinesses, setTopBusinesses] = useState<BusinessSummary[]>(initialTopBusinesses);
  const [loadingTop, setLoadingTop] = useState(false);
  // Tries .webp first, falls back to .jpg on error, then null (gradient only) if that also fails.
  const [heroImageExt, setHeroImageExt] = useState<"webp" | "jpg" | null>("webp");

  // page.tsx (server) already fetched this city and its top businesses — skip the redundant
  // client fetch on mount and only refetch if the slug changes under this same component instance.
  const initialSlugRef = useRef<string | null>(slug);
  useEffect(() => {
    if (slug === initialSlugRef.current) return;
    setLoadingTop(true);
    setHeroImageExt("webp");
    searchBusinesses({ city: slug, sort: "rating", limit: TOP_BUSINESSES_LIMIT })
      .then((res) => setTopBusinesses(res.items))
      .catch(() => setTopBusinesses([]))
      .finally(() => setLoadingTop(false));
  }, [slug]);

  const cityName = city?.name ?? (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "City");

  if (!loadingCity && !city) {
    return (
      <div className="bg-slate-50/60 min-h-screen flex items-center justify-center px-4">
        <div className="text-center space-y-3">
          <h1 className="text-xl font-black text-slate-900">City not found</h1>
          <Link href="/search" className="inline-block text-sm font-bold text-purple-600 hover:underline">
            ← Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-0 py-0 flex flex-col gap-0 w-full">
      {/* City Hero Banner — bg1/bg2/bg3 as background image behind the center landmark photo */}
      <div className="relative w-full h-52 sm:h-64 lg:h-72 bg-slate-950 rounded-none overflow-hidden shrink-0 shadow-none border-b border-slate-100 flex items-end">
        {/* Dedicated Background Image (bg1.jpg for Bangalore, bg2.jpg for Chennai, bg3.jpg for Hyderabad) */}
        <Image
          src={CITY_BG_MAP[slug] || `${R2_BASE}/city-images/bg1.jpg`}
          alt={`${cityName} skyline`}
          fill
          sizes="100vw"
          priority
          className="object-cover opacity-90"
        />

        {/* Foreground Center Landmark Image (e.g. Bangalore Palace) */}
        {heroImageExt && (
          <Image
            src={`${R2_BASE}/city-images/${slug}.${heroImageExt}`}
            alt={cityName}
            fill
            sizes="100vw"
            onError={() => setHeroImageExt((ext) => (ext === "webp" ? "jpg" : null))}
            className="object-cover lg:object-contain z-10"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-20" />
        <div className="absolute bottom-6 left-6 text-white space-y-1 z-30">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight drop-shadow-md">{cityName}</h1>
          {city && city.state && (
            <p className="text-xs sm:text-sm font-semibold text-slate-200 opacity-90 drop-shadow-sm">
              {city.state}
            </p>
          )}
        </div>
      </div>

      {/* Popular Categories inside City */}
      <div className="space-y-2 py-4 bg-white border-b border-slate-100">
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 px-4 sm:px-6 lg:px-12 lg:mb-2">Popular Categories</h3>
        <CategoryStrip roundedNone />
      </div>

      {/* Top Businesses Section (Grid) */}
      <div className="space-y-4 px-4 sm:px-6 lg:px-12 py-6 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900">Top Businesses in {cityName}</h3>
          <Link
            href={`/search?city=${slug}`}
            className="text-[10px] sm:text-xs font-semibold text-purple-600 flex items-center gap-0.5"
          >
            <span>View More</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loadingTop ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: TOP_BUSINESSES_LIMIT }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-none animate-pulse" />
            ))}
          </div>
        ) : topBusinesses.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {topBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/business/${b.slug}`}
                className="group bg-white rounded-none border border-slate-100 overflow-hidden shadow-none transition-all duration-300 flex flex-col hover:border-purple-300"
              >
                {/* Image */}
                <div className="relative h-18 lg:h-28 w-full overflow-hidden bg-slate-100">
                  {b.coverImageUrl ? (
                    <Image
                      src={b.coverImageUrl}
                      alt={`${b.name} in ${b.cityName}`}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <Store className="w-5 h-5" />
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-none flex items-center gap-0.5 shadow-none">
                    <Star className="w-2.5 h-2.5 fill-current text-white" />
                    <span>{b.avgRating.toFixed(1)}</span>
                  </div>
                  {b.isVerified && (
                    <div className="absolute top-1 left-1">
                      <VerifiedBadge size="xs" iconOnly />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2 flex-1 flex flex-col justify-between gap-1">
                  <div>
                    {b.primaryCategoryName && (
                      <span className="text-[8px] font-medium text-slate-400 block leading-tight">
                        {b.primaryCategoryName}
                      </span>
                    )}
                    <h4 className="font-bold text-[10px] sm:text-xs text-slate-900 truncate group-hover:text-purple-600 transition-colors leading-tight mt-0.5">
                      {b.name}
                    </h4>
                    <div className="flex items-center gap-0.5 text-[8px] text-slate-500 mt-0.5">
                      <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{b.localityName ?? b.cityName}</span>
                    </div>
                  </div>
                  {b.isOpenNow !== null && (
                    <div>
                      <span
                        className={
                          b.isOpenNow
                            ? "inline-block text-[8px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700"
                            : "inline-block text-[8px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600"
                        }
                      >
                        {b.isOpenNow ? "Open" : "Closed"}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500 font-medium">No businesses found in {cityName} yet.</p>
        )}
      </div>
    </div>
  );
}
