"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Heart, ArrowRight, Store } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { searchBusinesses, type BusinessSummary } from "@/app/lib/search-api";
import { FEATURED_COUNT, pickDistinctCategories } from "@/app/lib/featured-businesses";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";

export default function FeaturedBusinessesSection({
  initialBusinesses,
}: {
  initialBusinesses?: BusinessSummary[];
} = {}) {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>(initialBusinesses ?? []);
  const [loading, setLoading] = useState(!initialBusinesses);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    // page.tsx (server) already fetched and picked these — skip the redundant client fetch.
    if (initialBusinesses) return;

    let cancelled = false;

    // Kept static — highest-rated businesses platform-wide, not re-filtered by the homepage's
    // city pill, so this section doesn't change every time the pill's auto-detected city changes.
    // Transient failures (cold backend connection pool, brief network blip) are already retried
    // inside request()/searchBusinesses at the transport layer — this only needs to handle the
    // final outcome. Pool is wider than FEATURED_COUNT so pickDistinctCategories has real variety
    // to choose from.
    searchBusinesses({ sort: "rating", limit: 40 })
      .then((res) => {
        if (!cancelled) setBusinesses(pickDistinctCategories(res.items, FEATURED_COUNT));
      })
      .catch(() => {
        if (!cancelled) setBusinesses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialBusinesses is only read once, to decide whether to skip this effect entirely
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  if (!loading && businesses.length === 0) return null;

  // Show exactly 3 featured healthcare centers
  const cards = businesses.slice(0, 3);

  return (
    <section className="px-3 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900">Featured Healthcare Centers</h2>
          <Link
            href="/search"
            className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-slate-100 animate-pulse h-24 lg:h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 lg:gap-3">
            {cards.map((b) => (
              <BusinessCard key={b.id} b={b} favorites={favorites} toggleFavorite={toggleFavorite} compact={false} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function BusinessCard({
  b,
  favorites,
  toggleFavorite,
  compact,
}: {
  b: BusinessSummary;
  favorites: string[];
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  compact: boolean;
}) {
  const statusLabel = b.isOpenNow === true ? "Open" : b.isOpenNow === false ? "Closed" : null;
  const statusColor = b.isOpenNow ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600";

  return (
    <Link
      href={`/business/${b.slug}`}
      className="group bg-white rounded-lg lg:rounded-lg border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className={cn("relative w-full overflow-hidden bg-slate-100", compact ? "h-12 sm:h-14" : "h-16 sm:h-18 lg:h-20")}>
        {b.coverImageUrl ? (
          <Image
            src={b.coverImageUrl}
            alt={`${b.name} in ${b.cityName}`}
            fill
            sizes="(min-width: 1024px) 200px, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Store className={compact ? "w-4 h-4" : "w-6 h-6"} />
          </div>
        )}
        {/* Rating Badge */}
        <div className="absolute bottom-1 left-1 bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
          <Star className={cn("fill-current text-white", compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
          <span>{b.avgRating.toFixed(1)}</span>
        </div>
        {/* Verified Badge */}
        {b.isVerified && (
          <div className="absolute top-1 left-1">
            <VerifiedBadge size={compact ? "xs" : "sm"} iconOnly={compact} />
          </div>
        )}
        {/* Heart */}
        <button
          onClick={(e) => toggleFavorite(b.id, e)}
          className="absolute top-1 right-1 w-5.5 h-5.5 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-colors"
          aria-label="Add to favorites"
        >
          <Heart className={cn(favorites.includes(b.id) && "fill-rose-500 text-rose-500", compact ? "w-2.5 h-2.5" : "w-3 h-3")} />
        </button>
      </div>

      {/* Info */}
      <div className={cn("flex flex-col flex-1 justify-between gap-0.5", compact ? "p-1" : "p-1.5 sm:p-2")}>
        <div className="space-y-0.5">
          <h3 className={cn("font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-1", compact ? "text-[9px]" : "text-[11px] sm:text-xs")}>
            {b.name}
          </h3>
          <div className={cn("flex items-center gap-0.5 text-slate-500", compact ? "text-[8px]" : "text-[9px] sm:text-[10px]")}>
            <MapPin className={cn("text-slate-400 shrink-0", compact ? "w-2 h-2" : "w-2.5 h-2.5")} />
            <span className="truncate">{[b.areaName ?? b.localityName, b.cityName].filter(Boolean).join(", ")}</span>
          </div>
        </div>
        {statusLabel && (
          <div>
            <span className={cn("inline-block font-semibold px-1 py-0.2 rounded", statusColor, compact ? "text-[7px]" : "text-[8px] sm:text-[9px]")}>
              {statusLabel}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
