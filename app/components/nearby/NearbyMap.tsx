"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, MapPin, Navigation, Phone, MessageSquare, Clock, ArrowRight, X, Sparkles } from "lucide-react";
import { cn } from "@/app/lib/utils";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";

export interface NearbyBusinessItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  logoUrl?: string | null;
  planTier: string;
  isVerified: boolean;
  isTrusted: boolean;
  avgRating: number;
  reviewCount: number;
  priceRange?: string | null;
  phone?: string | null;
  whatsappPhone?: string | null;
  address: string;
  cityName: string;
  localityName?: string | null;
  areaName?: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  formattedDistance: string;
  primaryCategoryName: string;
  primaryCategorySlug: string;
  isOpenNow: boolean;
  hasActiveOffer: boolean;
}

interface NearbyMapProps {
  businesses: NearbyBusinessItem[];
  userLat: number | null;
  userLng: number | null;
  activeBusinessId: string | null;
  onSelectBusiness: (id: string) => void;
}

/**
 * Bearing (degrees clockwise from north) from the user to a business, so pins land in the
 * right direction on the map rather than at a position derived from list order.
 */
function bearingDegrees(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180) / Math.PI;
}

/** Haversine distance in km between two coordinates. */
function distanceKmBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function NearbyMap({
  businesses,
  userLat,
  userLng,
  activeBusinessId,
  onSelectBusiness,
}: NearbyMapProps) {
  const selected = businesses.find((b) => b.id === activeBusinessId) || businesses[0];

  // Furthest real distance among the current results sets the map's visible radius, so pins
  // spread across the full canvas regardless of whether the search radius was 2km or 20km.
  const maxDistanceKm = Math.max(1, ...businesses.map((b) => b.distanceKm ?? 0));

  return (
    <div className="relative w-full h-full bg-[#0f172a] rounded-none lg:rounded-none overflow-hidden border-x-0 lg:border-l lg:border-r-0 border-y lg:border-y-0 border-slate-200/90 shadow-none lg:shadow-none font-sans group">
      
      {/* Dark Vector Map Canvas Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1.5px,transparent_1.5px)] [background-size:16px_16px] bg-[#090d16] opacity-90" />

      {/* Map Grid Roads Styling overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Live User Location Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-purple-500/30 border border-purple-400 animate-ping absolute" />
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 border-2 border-white shadow-xl flex items-center justify-center text-white text-[10px] font-black z-10">
            YOU
          </div>
        </div>
        <span className="bg-slate-900/90 text-purple-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-purple-500/30 mt-1 backdrop-blur-md shadow-md">
          Current Location
        </span>
      </div>

      {/* Business Pins — positioned by real bearing/distance from the user, not list order */}
      {businesses.map((b) => {
        const isSelected = selected?.id === b.id;

        let topPct = 50;
        let leftPct = 50;
        if (userLat != null && userLng != null && b.lat != null && b.lng != null) {
          const bearing = bearingDegrees(userLat, userLng, b.lat, b.lng);
          const distKm = b.distanceKm ?? distanceKmBetween(userLat, userLng, b.lat, b.lng);
          // Map distance to a 0-42% radius from center (leaves room for the "YOU" pin + labels),
          // scaled against the furthest business in the current result set.
          const distPct = Math.min(42, (distKm / maxDistanceKm) * 42);
          // Compass bearing (0 = north/up) -> standard math angle (0 = right), and screen y
          // grows downward, so north (bearing 0) must move up (negative y).
          const rad = ((90 - bearing) * Math.PI) / 180;
          topPct = 50 - Math.sin(rad) * distPct;
          leftPct = 50 + Math.cos(rad) * distPct;
        }

        return (
          <div
            key={b.id}
            onClick={() => onSelectBusiness(b.id)}
            style={{ top: `${topPct}%`, left: `${leftPct}%` }}
            className={cn(
              "absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 transform hover:scale-110",
              isSelected ? "z-30 scale-110" : "opacity-85 hover:opacity-100"
            )}
          >
            <div
              className={cn(
                "px-2.5 py-1 rounded-xl shadow-lg border text-xs font-black flex items-center gap-1.5 transition-all whitespace-nowrap",
                isSelected
                  ? "bg-purple-600 border-white text-white ring-4 ring-purple-500/30 scale-105"
                  : b.isVerified
                  ? "bg-white border-purple-200 text-slate-900 hover:border-purple-500"
                  : "bg-slate-800 border-slate-700 text-slate-200"
              )}
            >
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{b.avgRating}</span>
              <span className="opacity-60 font-semibold text-[10px]">• {b.formattedDistance}</span>
            </div>
          </div>
        );
      })}

      {/* Selected Business Preview Bottom Card / Sheet */}
      {selected && (
        <div className="absolute bottom-3 left-3 right-3 z-30 animate-in slide-in-from-bottom-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 p-3.5 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <img
                src={selected.coverImageUrl || "https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/fallback-images/nearby-map-fallback.jpg"}
                alt={selected.name}
                className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded">
                    {selected.primaryCategoryName}
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    📍 {selected.formattedDistance}
                  </span>
                </div>

                <h4 className="font-black text-sm text-slate-900 mt-0.5 flex items-center gap-1.5">
                  <span className="truncate">{selected.name}</span>
                  {selected.isVerified && <VerifiedBadge size="xs" iconOnly />}
                </h4>

                <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                  <div className="flex items-center gap-1 text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{selected.avgRating}</span>
                  </div>
                  <span>•</span>
                  <span className="truncate">{selected.address}</span>
                </div>
              </div>
            </div>

            {/* Quick Action CTAs */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 border-slate-100 pt-2 sm:pt-0">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selected.name + ' ' + selected.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </a>

              <Link
                href={`/business/${selected.slug}`}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all"
              >
                Profile
              </Link>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
