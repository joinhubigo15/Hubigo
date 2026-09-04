"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Pill, Stethoscope, HeartPulse, Activity, Sparkles, TestTube, Star, MapPin, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { searchBusinesses, type BusinessSummary } from "@/app/lib/search-api";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";

const services = [
  { name: "Hospitals & Care", href: "/category/hospitals", icon: HeartPulse, bgColor: "bg-rose-100", iconColor: "text-rose-600" },
  { name: "24/7 Pharmacies", href: "/category/pharmacies", icon: Pill, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { name: "Specialist Doctors", href: "/category/doctors-clinics", icon: Stethoscope, bgColor: "bg-sky-100", iconColor: "text-sky-600" },
  { name: "Diagnostic Labs", href: "/category/diagnostic-labs", icon: TestTube, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { name: "Physiotherapy", href: "/category/physiotherapy", icon: Activity, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
  { name: "Dental Clinics", href: "/category/dentists", icon: Sparkles, bgColor: "bg-amber-100", iconColor: "text-amber-600" },
];

interface ServicesNearYouSectionProps {
  initialBusinesses?: BusinessSummary[];
}

export default function ServicesNearYouSection({ initialBusinesses }: ServicesNearYouSectionProps) {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>(
    initialBusinesses && initialBusinesses.length > 0 ? initialBusinesses.slice(0, 3) : []
  );
  const [loading, setLoading] = useState(!initialBusinesses || initialBusinesses.length === 0);

  useEffect(() => {
    let cancelled = false;

    searchBusinesses({ sort: "rating", limit: 12 })
      .then((res) => {
        if (cancelled) return;
        if (res.items.length > 0) {
          setBusinesses(res.items.slice(0, 3));
        }
      })
      .catch(() => {
        // Keep initialBusinesses if client fetch fails
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-2 sm:px-4 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900">Services & Healthcare Centers Near You</h2>
          <Link
            href="/category"
            className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
          >
            <span>View More</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Quick Category Icons Strip */}
        <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-8 bg-white lg:bg-transparent rounded-xl lg:rounded-none border lg:border-transparent border-slate-100 shadow-xs lg:shadow-none p-1.5 sm:p-2 lg:p-0">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <Link
                key={svc.href}
                href={svc.href}
                className={cn(
                  "group flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 lg:hover:bg-transparent transition-all duration-200 text-center w-full",
                  idx === 5 ? "hidden lg:flex" : "flex"
                )}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full ${svc.bgColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 ${svc.iconColor}`} />
                </div>
                <span className="text-[9px] sm:text-[10px] lg:text-sm font-bold text-slate-700 group-hover:text-purple-600 transition-colors leading-tight text-center line-clamp-1">
                  {svc.name}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Live Healthcare Service Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-1.5 lg:gap-3 pt-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-slate-100 animate-pulse h-24 lg:h-40" />
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid grid-cols-3 gap-1.5 lg:gap-3 pt-1">
            {businesses.map((b) => (
              <ServiceBusinessCard key={b.id} b={b} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ServiceBusinessCard({ b }: { b: BusinessSummary }) {
  return (
    <Link
      href={`/business/${b.slug}`}
      className="group bg-white rounded-lg lg:rounded-lg border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full overflow-hidden bg-slate-100 h-16 sm:h-20 lg:h-28">
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
          <span className="font-medium text-slate-500 block leading-none text-[8px] lg:text-[10px] truncate">
            {b.primaryCategoryName ?? "Healthcare Service"}
          </span>
          <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors leading-tight line-clamp-1 text-[9px] lg:text-xs">
            {b.name}
          </h3>
          <div className="flex items-center gap-0.5 text-slate-500 text-[8px] lg:text-[10px]">
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
