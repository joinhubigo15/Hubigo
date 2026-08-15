"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { searchBusinesses, type BusinessSummary } from "@/app/lib/search-api";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";

const NEARBY_COUNT = 3;
// Sampled from this many top results and shuffled, rather than a real distance/location query —
// there's no reliable per-visitor location signal for a homepage teaser section (no GPS prompt is
// fired here), and defaulting to a generic city-center point previously produced misleadingly
// precise-looking "4m away" badges for businesses that were nowhere near the visitor. This section
// is just a rotating sample of decent listings, not a real "nearest to you" feature — /nearby is.
const SAMPLE_POOL_SIZE = 24;

export default function NearbyBusinessesSection() {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    searchBusinesses({ sort: "rating", limit: SAMPLE_POOL_SIZE })
      .then((result) => {
        if (cancelled) return;
        const shuffled = [...result.items].sort(() => Math.random() - 0.5);
        setBusinesses(shuffled.slice(0, NEARBY_COUNT));
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
  }, []);

  if (!loading && businesses.length === 0) return null;

  return (
    <section className="px-3 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900">Nearby Businesses</h2>
          <Link
            href="/nearby"
            className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-1.5 lg:gap-3">
            {Array.from({ length: NEARBY_COUNT }).map((_, i) => (
              <div key={i} className="rounded-lg lg:rounded-lg bg-slate-100 animate-pulse h-24 lg:h-40" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 lg:gap-3">
            {businesses.map((b) => (
              <NearbyCard key={b.id} b={b} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function NearbyCard({ b }: { b: BusinessSummary }) {
  return (
    <Link
      href={`/business/${b.slug}`}
      className="group bg-white rounded-lg lg:rounded-lg border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-slate-100 h-16 sm:h-20 lg:h-30">
        {b.coverImageUrl ? (
          <Image
            src={b.coverImageUrl}
            alt={`${b.name} in ${b.cityName}`}
            fill
            sizes="33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Building2 className="w-5 h-5" />
          </div>
        )}
        {/* Rating Badge */}
        <div className="absolute bottom-1 left-1 bg-purple-600/90 backdrop-blur-md text-white text-[8px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
          <Star className="fill-current text-white w-2 h-2 lg:w-2.5 lg:h-2.5" />
          <span>{b.avgRating.toFixed(1)}</span>
        </div>
        {/* Verified Badge */}
        {b.isVerified && (
          <div className="absolute top-1 left-1">
            <VerifiedBadge size="xs" iconOnly />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 justify-between gap-0.5 p-1 lg:p-2.5">
        <div className="space-y-0.5">
          <span className="font-medium text-slate-500 block leading-none text-[8px] lg:text-[10px]">
            {b.primaryCategoryName ?? "Business"}
          </span>
          <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-1 text-[9px] lg:text-xs">
            {b.name}
          </h3>
          <div className={cn("flex items-center gap-0.5 text-slate-500 text-[10px] lg:text-[10px]")}>
            <MapPin className="text-slate-400 shrink-0 w-2 h-2 lg:w-3 lg:h-3" />
            <span className="truncate">{[b.areaName ?? b.localityName, b.cityName].filter(Boolean).join(", ")}</span>
          </div>
        </div>
        {b.isOpenNow !== null && (
          <div>
            <span
              className={cn(
                "inline-block font-semibold px-1 py-0.5 rounded text-[7px] lg:text-[9px]",
                b.isOpenNow ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
              )}
            >
              {b.isOpenNow ? "Open" : "Closed"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
