"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MapPin, Heart, Crown, Tag, Phone } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { saveBusinessRequest, removeSavedBusinessRequest, getSavedBusinessesRequest } from "@/app/lib/api";
import { formatDisplayArea, type BusinessSummary } from "@/app/lib/search-api";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";

const PRICE_LABEL: Record<string, string> = {
  budget: "₹",
  moderate: "₹₹",
  premium: "₹₹₹",
  luxury: "₹₹₹₹",
};

interface BusinessResultCardProps {
  business: BusinessSummary;
  className?: string;
}

export default function BusinessResultCard({ business, className }: BusinessResultCardProps) {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    getSavedBusinessesRequest(accessToken)
      .then((list) => {
        if (cancelled) return;
        const match = list.find((b) => b.listingId === business.id);
        if (match) {
          setSaved(true);
          setSavedId(match.id);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [accessToken, business.id]);

  async function toggleSave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent("/search")}`);
      return;
    }

    if (busy) return;
    setBusy(true);

    try {
      if (saved && savedId) {
        await removeSavedBusinessRequest(accessToken, savedId);
        setSaved(false);
        setSavedId(null);
      } else {
        const created = await saveBusinessRequest(accessToken, {
          listingId: business.id,
          name: business.name,
          category: business.primaryCategoryName ?? undefined,
          city: business.cityName,
          imageUrl: business.coverImageUrl ?? undefined,
          rating: business.avgRating,
        });
        setSaved(true);
        setSavedId(created.id);
      }
    } catch (err) {
      if (!(err instanceof ApiClientError)) console.error(err);
    } finally {
      setBusy(false);
    }
  }

  const displayArea = formatDisplayArea(business.address, business.areaName, business.localityName);
  const locationLabel = [displayArea, business.cityName].filter(Boolean).join(", ");

  return (
    <Link
      href={`/business/${business.slug}`}
      className={cn(
        "group bg-white rounded-none lg:rounded-none border lg:border-x-0 lg:border-t-0 lg:border-b border-slate-100 shadow-xs lg:shadow-none hover:shadow-md lg:hover:shadow-none transition-all duration-300 overflow-hidden block",
        className
      )}
    >
      {/* ── Mobile / Small-Screen Layout (<lg): compact padded card ── */}
      <div className="flex lg:hidden items-center gap-3 p-3">
        {/* Thumbnail (100% Full Clean Image, no overlay cuts) */}
        <div className="relative w-20 h-20 shrink-0 overflow-hidden bg-slate-100 rounded-lg">
          {business.coverImageUrl ? (
            <Image
              src={business.coverImageUrl}
              alt={`${business.name} in ${business.cityName}`}
              fill
              sizes="80px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <MapPin className="w-7 h-7" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1 min-w-0">
              <h3 className="font-bold text-slate-900 text-[13px] leading-tight truncate">{business.name}</h3>
              {business.isVerified && <VerifiedBadge size="xs" iconOnly />}
            </div>

            {business.avgRating >= 4.8 && (
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 text-[9.5px] font-black text-amber-900 bg-gradient-to-r from-amber-50 to-amber-100/90 border border-amber-300/80 px-2 py-0.5 rounded-full shadow-2xs">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500 shrink-0" />
                  <span>Top rated</span>
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500 font-medium overflow-hidden">
            <div className="flex items-center gap-0.5 min-w-0 flex-1 truncate">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{locationLabel || "Bangalore"}</span>
            </div>
            {business.distanceKm != null && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-purple-700 bg-purple-50 border border-purple-200/80 px-1.5 py-0.5 rounded shadow-2xs shrink-0">
                {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap text-[11px]">
            <Star className="w-3 h-3 fill-current text-amber-500" />
            <span className="font-bold text-slate-700">{business.avgRating.toFixed(1)}</span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            {business.isOpenNow != null && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded",
                  business.isOpenNow ? "text-emerald-700 bg-emerald-50" : "text-rose-600 bg-rose-50"
                )}
              >
                {business.isOpenNow ? "Open" : "Closed"}
              </span>
            )}
            {business.hasActiveOffer && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                <Tag className="w-2.5 h-2.5" /> Offer
              </span>
            )}
            <div className="ml-auto w-8 h-8 rounded-full bg-white text-blue-600 border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs hover:bg-blue-50 transition-colors">
              <Phone className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop Layout (≥lg): original wide card ── */}
      <div className="hidden lg:flex">
        {/* Image (100% Full Clean Image, no overlay cuts) */}
        <div className="relative w-28 sm:w-40 shrink-0 overflow-hidden bg-slate-100">
          {business.coverImageUrl ? (
            <Image
              src={business.coverImageUrl}
              alt={`${business.name} in ${business.cityName}`}
              fill
              sizes="(min-width: 1024px) 160px, 112px"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <MapPin className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base lg:text-lg group-hover:text-purple-600 transition-colors leading-tight truncate">
                {business.name}
              </h3>
              {business.isVerified && <VerifiedBadge size="sm" />}
            </div>

            {business.avgRating >= 4.8 && (
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-amber-900 bg-gradient-to-r from-amber-50 to-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-500 shrink-0" />
                  <span>Top rated</span>
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="flex items-center gap-0.5 text-purple-600">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{business.avgRating.toFixed(1)}</span>
              </div>
              {business.priceRange && (
                <span className="text-xs font-semibold text-slate-500">{PRICE_LABEL[business.priceRange]}</span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs lg:text-sm text-slate-600 font-semibold truncate flex items-center gap-1 pt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{locationLabel}</span>
              {business.distanceKm != null && (
                <span className="text-purple-700 font-bold shrink-0 ml-1">
                  • {business.distanceKm < 1 ? `${Math.round(business.distanceKm * 1000)} m` : `${business.distanceKm.toFixed(1)} km`}
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-1.5 border-t border-slate-100 mt-2">
            {business.isOpenNow != null && (
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded",
                  business.isOpenNow ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                )}
              >
                {business.isOpenNow ? "Open" : "Closed"}
              </span>
            )}
            {business.hasActiveOffer && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                <Tag className="w-2.5 h-2.5" /> Offer
              </span>
            )}
            <span className="ml-auto text-[10px] font-bold text-purple-600 group-hover:underline">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
