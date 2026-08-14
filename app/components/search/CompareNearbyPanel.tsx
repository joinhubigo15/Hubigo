"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Navigation, MapPin, X, Star, ShieldCheck, Crown, Clock, Images, ArrowLeft, Sparkles } from "lucide-react";
import { useNearbyLocation } from "@/app/lib/useNearbyLocation";
import { compareNearby } from "@/app/lib/search-api";
import type { CompareBusiness } from "@/app/lib/search-api";
import { ApiClientError } from "@/app/lib/auth-context";
import { cn } from "@/app/lib/utils";

/** openHoursRaw is a scraped `{"Monday":["10:30 AM–10:30 PM"], ...}`-shaped JSON string — often
 * only a handful of days were actually captured, so this shows whatever's there rather than
 * assuming a full 7-day week. */
function formatOpenHours(raw: string | null): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, string[]>;
    const entries = Object.entries(parsed).filter(([, hours]) => hours?.length);
    if (entries.length === 0) return null;
    return entries
      .slice(0, 2)
      .map(([day, hours]) => `${day.slice(0, 3)}: ${hours[0]}`)
      .join(", ");
  } catch {
    return null;
  }
}

function PlanBadge({ tier }: { tier: string }) {
  if (tier === "basic") return <span className="text-[11px] font-semibold text-slate-500">Basic</span>;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
        tier === "elite" ? "bg-amber-500" : "bg-purple-600"
      }`}
    >
      <Crown className="w-3 h-3" />
      {tier === "elite" ? "Elite" : "Premium"}
    </span>
  );
}

export default function CompareNearbyPanel({
  category,
  subcategory,
  onClose,
}: {
  category?: string;
  subcategory?: string;
  onClose: () => void;
}) {
  const { location, requestGPS, setManualAddress, skipLocation, geocoding, geocodeError } = useNearbyLocation();
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [businesses, setBusinesses] = useState<CompareBusiness[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (location.lat == null || location.lng == null) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setErrorMsg(null);
    compareNearby({ category, subcategory, lat: location.lat, lng: location.lng, limit: 5 })
      .then((result) => {
        // A faster, more recent request (e.g. GPS resolving after the user already hit "Skip")
        // may have already landed — never let a slower, stale response overwrite it.
        if (requestIdRef.current !== requestId) return;
        setBusinesses(result);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        setErrorMsg(err instanceof ApiClientError ? err.message : "Couldn't load nearby comparison.");
      })
      .finally(() => {
        if (requestIdRef.current !== requestId) return;
        setLoading(false);
      });
  }, [location.lat, location.lng, category, subcategory]);

  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const ok = await setManualAddress(manualInput.trim());
    if (ok) setShowManual(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm shadow-slate-200/50 overflow-hidden">
      <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-sm font-black text-slate-900">Top 5 Nearest — Side by Side</h2>
            <p className="text-[11px] text-slate-500 font-semibold">
              Ranked by Hubigo Score — our rating combining reviews, distance, and trust signals
              {location.addressName ? ` from ${location.addressName}` : ""}.
            </p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      {location.status === "prompt" && (
        <div className="p-6 sm:p-8 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-black text-slate-900">Enable location to compare nearby options</h3>
            <p className="text-xs text-slate-500 font-semibold">We use your location only to rank the 5 nearest businesses in this category.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={requestGPS}
              disabled={location.loading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{location.loading ? "Detecting..." : "Allow Location Access"}</span>
            </button>
            <button
              onClick={() => setShowManual(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Enter Location Manually
            </button>
            <button onClick={skipLocation} className="px-3 py-2.5 text-slate-400 hover:text-slate-600 font-bold text-xs cursor-pointer">
              Skip (Default Area)
            </button>
          </div>
        </div>
      )}

      {location.status === "denied" && (
        <div className="p-4 mx-4 my-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-800 font-semibold">
            {location.error || "Location access was denied."} Showing results for a default area instead.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={requestGPS} className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer">
              Try Again
            </button>
            <button onClick={() => setShowManual(true)} className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 font-bold text-xs rounded-lg cursor-pointer">
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {showManual && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Enter Your Location</span>
              </h3>
              <button onClick={() => setShowManual(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <p className="text-[11px] text-slate-500 font-semibold">Currently supported: Bangalore, Chennai, and Hyderabad.</p>
              <input
                type="text"
                placeholder="e.g. Koramangala, Bangalore or 560095"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                autoFocus
              />
              {geocodeError && <p className="text-[11px] text-rose-600 font-semibold">{geocodeError}</p>}
              <button
                type="submit"
                disabled={geocoding || !manualInput.trim()}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl disabled:opacity-60"
              >
                {geocoding ? "Finding location..." : "Set Location"}
              </button>
            </form>
          </div>
        </div>
      )}

      {location.lat != null && location.lng != null && (
        <div className="p-4">
          {loading && <div className="p-10 text-center text-sm text-slate-400 font-semibold">Finding the nearest matches...</div>}

          {!loading && errorMsg && (
            <div className="p-6 text-center text-sm text-rose-600 font-semibold">{errorMsg}</div>
          )}

          {!loading && !errorMsg && businesses.length < 2 && (
            <div className="p-6 text-center text-sm text-slate-500 font-semibold">
              Not enough nearby businesses in this category yet to build a comparison.
            </div>
          )}

          {!loading && !errorMsg && businesses.length >= 2 && (() => {
            const topScore = Math.max(...businesses.map((b) => b.hubigoScore));
            return (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[500px] lg:min-w-[720px] table-fixed">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="p-2 sm:p-3 lg:p-4 text-[10px] lg:text-sm font-bold text-slate-500 w-[20%] lg:w-[15%]">Feature</th>
                    {businesses.map((b) => {
                      const isTopScore = b.hubigoScore === topScore && topScore > 0;
                      return (
                        <th
                          key={b.id}
                          className={cn("p-2 sm:p-3 lg:p-4 text-center relative", isTopScore && "bg-gradient-to-b from-purple-50/80 to-transparent")}
                        >
                          <div className="w-10 h-10 lg:w-14 lg:h-14 mx-auto rounded-xl overflow-hidden mb-1.5 lg:mb-2 bg-slate-100 ring-2 ring-offset-1 lg:ring-offset-2 ring-transparent" style={isTopScore ? { boxShadow: "0 0 0 2px #9333ea, 0 0 0 4px white" } : undefined}>
                            {b.coverImageUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.coverImageUrl} alt={b.name} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <Link href={`/business/${b.slug}`} title={b.name} className="text-[10px] sm:text-xs lg:text-sm font-bold text-slate-900 hover:text-purple-600 leading-tight line-clamp-2 lg:line-clamp-none lg:block min-h-[2rem] lg:min-h-[2.5rem]">
                            {b.name}
                          </Link>
                          <div className="mt-1 lg:mt-1.5 flex justify-center">
                            <PlanBadge tier={b.planTier} />
                          </div>
                          <div className="mt-1 lg:mt-2 flex flex-col items-center gap-0.5">
                            <div
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-sm shadow-sm",
                                isTopScore
                                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              <Sparkles className="w-3 h-3" />
                              {b.hubigoScore}
                            </div>
                            <span className="text-[7px] lg:text-[9px] font-bold uppercase tracking-wider text-slate-400">Hubigo Score</span>
                            {isTopScore && (
                              <span className="text-[7px] lg:text-[9px] font-black text-purple-600 uppercase tracking-wide">★ Top Match</span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Distance</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center font-bold text-purple-700 text-[10px] lg:text-sm">
                        {b.distanceKm != null ? `${b.distanceKm} km` : "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Rating</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center text-[10px] lg:text-sm">
                        <div className="flex items-center justify-center gap-1 text-amber-600">
                          <Star className="w-3 h-3 lg:w-3.5 lg:h-3.5 fill-current" />
                          <span className="font-bold">{b.avgRating.toFixed(1)}</span>
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Verification</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center">
                        {b.isVerified ? (
                          <span className="inline-flex items-center gap-0.5 lg:gap-1 text-[9px] lg:text-xs font-bold text-purple-600">
                            <ShieldCheck className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[9px] lg:text-xs text-slate-400">Standard</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Hours</td>
                    {businesses.map((b) => {
                      const hours = formatOpenHours(b.openHoursRaw);
                      return (
                        <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center text-[9px] lg:text-xs">
                          {hours ? (
                            <span className="inline-flex items-center gap-0.5 lg:gap-1 text-slate-700 font-semibold">
                              <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-slate-400 shrink-0" />
                              {hours}
                            </span>
                          ) : (
                            <span className="text-slate-400">Not listed</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Photos</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center">
                        {b.photos.length > 0 ? (
                          <span className="inline-flex items-center gap-0.5 lg:gap-1 text-[9px] lg:text-xs font-bold text-purple-600">
                            <Images className="w-3 h-3 lg:w-3.5 lg:h-3.5" /> {b.photos.length} photos
                          </span>
                        ) : (
                          <span className="text-[9px] lg:text-xs text-slate-400">No photos</span>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Location</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center text-[9px] lg:text-xs text-slate-600">
                        {[b.locality, b.city].filter(Boolean).join(", ")}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 sm:p-3 lg:p-4 font-bold text-slate-900 text-[10px] lg:text-sm">Action</td>
                    {businesses.map((b) => (
                      <td key={b.id} className="p-2 sm:p-3 lg:p-4 text-center">
                        <Link
                          href={`/business/${b.slug}`}
                          className="inline-block w-full px-2 lg:px-3 py-1.5 lg:py-2 bg-purple-600 hover:bg-purple-700 text-white text-[9px] lg:text-xs font-bold rounded-lg lg:rounded-xl transition-colors truncate"
                        >
                          View Details
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
