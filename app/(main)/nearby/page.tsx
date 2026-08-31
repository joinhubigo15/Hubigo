"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import { saveBusinessRequest, removeSavedBusinessRequest, getSavedBusinessesRequest } from "@/app/lib/api";
import {
  MapPin,
  Search,
  Compass,
  Navigation,
  Star,
  Filter,
  Phone,
  MessageSquare,
  Share2,
  Bookmark,
  Building2,
  Sparkles,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  X,
  CheckCircle2,
  Flame,
  Tag,
  AlertCircle,
  Map as MapIcon,
  List,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useNearbyLocation } from "@/app/lib/useNearbyLocation";
import NearbyMap, { NearbyBusinessItem } from "@/app/components/nearby/NearbyMap";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import CityPickerPill from "@/app/components/layout/CityPickerPill";
import { API_URL } from "@/app/lib/api";

const DEFAULT_RADIUS = 5; // Default radius in KM (configurable constant)

const ALL_CATEGORY = { name: "All", slug: "all", icon: "🌐" };

interface CategoryChip {
  name: string;
  slug: string;
  icon: string;
}

function NearbyPageContent() {
  // Browsing /nearby needs no login — only actions that write to the user's account (saving a
  // business) redirect to login, right at the point of that interaction. See toggleSave below.
  const { user, accessToken } = useAuth();
  const router = useRouter();

  const { location, requestGPS, setManualAddress, skipLocation, geocoding, geocodeError } = useNearbyLocation();
  const searchParams = useSearchParams();

  // Pre-filled from a "Similar Businesses Nearby" link on a business detail page — locks results
  // to that subcategory immediately, with no category chip UI needed for it.
  const [subcategoryFilter, setSubcategoryFilter] = useState<string | null>(() => searchParams.get("subcategory"));

  const [radiusKm, setRadiusKm] = useState<number>(DEFAULT_RADIUS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOption, setSortOption] = useState<string>("distance");
  
  // View toggle: 'split' | 'list' | 'map'
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");

  // Advanced Filters
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);

  // Manual location modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualInput, setManualInput] = useState("");

  // Saved bookmarks — maps a business id to its saved-record id so a re-toggle can DELETE it.
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessToken) return;
    getSavedBusinessesRequest(accessToken)
      .then((list) => {
        const map: Record<string, string> = {};
        for (const b of list) map[b.listingId] = b.id;
        setSavedMap(map);
      })
      .catch(() => {});
  }, [accessToken]);

  // Category chips — fetched live from the real taxonomy so this always matches whatever
  // sectors actually exist in the DB, instead of a hardcoded list that drifts out of sync.
  const [categories, setCategories] = useState<CategoryChip[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/v1/categories`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load categories"))))
      .then((data) => {
        const list: { name: string; slug: string; icon: string | null }[] = Array.isArray(data?.data) ? data.data : [];
        setCategories(list.map((c) => ({ name: c.name, slug: c.slug, icon: c.icon || "🏷️" })));
      })
      .catch(() => setCategories([]));
  }, []);

  const categoryChips: CategoryChip[] = [ALL_CATEGORY, ...categories];

  // API State
  const [businesses, setBusinesses] = useState<NearbyBusinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMapBusinessId, setActiveMapBusinessId] = useState<string | null>(null);

  // Fetch Nearby Data from Backend API
  const fetchNearby = async () => {
    setLoading(true);
    setError(null);

    try {
      const lat = location.lat ?? 12.9716;
      const lng = location.lng ?? 77.5946;

      const params = new URLSearchParams();
      params.set("lat", lat.toString());
      params.set("lng", lng.toString());
      params.set("radius", radiusKm.toString());
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      if (subcategoryFilter) params.set("subcategory", subcategoryFilter);
      if (sortOption) params.set("sort", sortOption);
      if (openNowOnly) params.set("openNow", "true");
      if (verifiedOnly) params.set("verified", "true");
      if (offersOnly) params.set("offers", "true");
      if (minRating) params.set("minRating", minRating.toString());

      const res = await fetch(`${API_URL}/api/v1/nearby?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load nearby listings.");
      }

      const data = await res.json();
      if (data.success && data.data?.items) {
        setBusinesses(data.data.items);
        if (data.data.items.length > 0) {
          setActiveMapBusinessId(data.data.items[0].id);
        }
      } else {
        setBusinesses([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load nearby businesses. Please try again.");
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetchNearby's setState calls only run after the async fetch resolves, not synchronously in the effect body
    fetchNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchNearby closes over state already listed below; including the function itself would re-run every render
  }, [location.lat, location.lng, radiusKm, selectedCategory, subcategoryFilter, sortOption, openNowOnly, verifiedOnly, offersOnly, minRating]);

  // Handle Manual Address Submission
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    const ok = await setManualAddress(manualInput.trim());
    if (ok) setShowManualModal(false);
  };

  const toggleSave = async (b: NearbyBusinessItem) => {
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent("/nearby")}`);
      return;
    }
    const existingId = savedMap[b.id];
    try {
      if (existingId) {
        await removeSavedBusinessRequest(accessToken, existingId);
        setSavedMap((prev) => {
          const next = { ...prev };
          delete next[b.id];
          return next;
        });
      } else {
        const created = await saveBusinessRequest(accessToken, {
          listingId: b.id,
          name: b.name,
          city: b.cityName,
          imageUrl: b.coverImageUrl ?? undefined,
          rating: b.avgRating,
        });
        setSavedMap((prev) => ({ ...prev, [b.id]: created.id }));
      }
    } catch (err) {
      if (!(err instanceof ApiClientError)) console.error(err);
    }
  };

  // AI Recommendation Banner Text based on time of day
  const getAISuggestion = () => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) {
      return "🩺 Morning Healthcare: Diagnostic labs for fasting blood tests & OPD clinics open near you!";
    } else if (hour >= 11 && hour < 16) {
      return "🏥 Afternoon Care: Specialist doctor consultations, eye clinics & physiotherapy centers open nearby!";
    } else if (hour >= 16 && hour < 22) {
      return "💊 Evening Healthcare: Pharmacies, wellness centers, and pediatric clinics open near you!";
    }
    return "🚨 24/7 Healthcare: Emergency trauma hospitals, 24/7 pharmacies, and ambulance services nearby!";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans selection:bg-purple-100 selection:text-purple-900 pb-16">

      {/* 1. LOCATION PERMISSION SCREEN (Shown if location status is prompt) */}
      {location.status === "prompt" && (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white p-5 lg:p-8 rounded-none lg:rounded-none shadow-none lg:shadow-none mx-0 lg:mx-0 my-0 lg:my-0 border-none lg:border-b lg:border-slate-800 relative overflow-hidden z-10">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md text-purple-300 flex items-center justify-center border border-white/15 shadow-sm">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                Find Healthcare Services Near You 📍
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                Enable your location to discover nearby hospitals, clinics, 24/7 pharmacies, diagnostic labs, and specialist doctors within your area.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={requestGPS}
                disabled={location.loading}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-500/25 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Navigation className="w-4 h-4" />
                <span>{location.loading ? "Detecting GPS Location..." : "Allow Location Access"}</span>
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Enter Location Manually
              </button>

              <button
                onClick={skipLocation}
                className="px-3.5 py-2.5 text-slate-400 hover:text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Skip (Default Location)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1b. LOCATION DENIED / UNAVAILABLE BANNER (GPS request failed or was refused) */}
      {location.status === "denied" && (
        <div className="bg-amber-50 border-b lg:border-b lg:border-x-0 lg:border-t-0 border-amber-200 rounded-none lg:rounded-none p-4 mx-0 lg:mx-0 my-0 lg:my-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 -mt-[1px] lg:mt-0 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-900">Couldn&apos;t access your location</h3>
              <p className="text-xs text-amber-800 font-semibold mt-0.5">
                {location.error || "Location access was denied."} Showing results near Koramangala, Bangalore instead — enter your area manually for accurate results.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={requestGPS}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Try Again
            </button>
            <button
              onClick={() => setShowManualModal(true)}
              className="px-3.5 py-2 bg-white border border-amber-300 text-amber-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Enter Manually
            </button>
          </div>
        </div>
      )}

      {/* MANUAL LOCATION INPUT MODAL */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Enter Your Location Manually</span>
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Area, City, or Pincode</label>
                <p className="text-[11px] text-slate-500 font-semibold">Currently supported: Bangalore, Chennai, and Hyderabad.</p>
                <input
                  type="text"
                  placeholder="e.g. Koramangala, Bangalore or 560095"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                  autoFocus
                />
              </div>

              {geocodeError && <p className="text-xs text-rose-600 font-semibold">{geocodeError}</p>}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={geocoding || !manualInput.trim()}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm disabled:opacity-60"
                >
                  {geocoding ? "Finding location..." : "Set Location"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TOP HEADER CONTROLS & SEARCH BAR */}
      <div className="max-w-7xl lg:max-w-none mx-auto px-0 lg:px-0 pt-0 lg:pt-0 space-y-0 lg:space-y-0">
        
        {/* Header Bar */}
        <div className="bg-white rounded-none lg:rounded-none border-b lg:border-b lg:border-x-0 lg:border-t-0 border-slate-200/90 p-4 shadow-none lg:shadow-none flex flex-col md:flex-row items-center justify-between gap-4 -mt-[1px] lg:mt-0 relative z-10">
          
          {/* Active Location Info & GPS Trigger */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "text-[9px] lg:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded",
                    location.status === "denied" ? "text-amber-700 bg-amber-50" : "text-purple-700 bg-purple-50"
                  )}
                >
                  {location.status === "granted"
                    ? "GPS Active"
                    : location.status === "denied"
                    ? "Default Area"
                    : "Location Set"}
                </span>
                {location.accuracy && (
                  <span className="text-[9px] lg:text-[10px] text-slate-400 font-semibold">
                    (±{location.accuracy}m accuracy)
                  </span>
                )}
              </div>
              <h1 className="text-xs lg:text-sm font-black text-slate-900 truncate mt-0.5">
                {location.addressName}
              </h1>
            </div>

            <button
              onClick={() => setShowManualModal(true)}
              className="ml-auto md:ml-2 text-xs font-bold text-purple-600 hover:underline shrink-0"
            >
              Change
            </button>
          </div>

          {/* Homepage Pattern Search Bar */}
          <div className="flex-1 w-full max-w-lg bg-white rounded-2xl shadow-sm border border-purple-300/80 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/10 p-1 sm:p-1.5 flex items-center gap-1.5 transition-all">
            <div className="flex-1 flex items-center px-3 py-1">
              <input
                type="text"
                placeholder="Search Doctors, Hospitals, Clinics, Diagnostic Labs, Pharmacies..."
                value={searchQuery}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearchQuery(v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
                }}
                autoCapitalize="words"
                className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none capitalize"
              />
            </div>

            <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

            <div className="shrink-0 hidden sm:block">
              <CityPickerPill size="xs" />
            </div>

            <button
              onClick={() => {}}
              aria-label="Search"
              className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-1 shadow-sm shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Radius Selector & View Mode Switcher */}
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
            
            {/* Radius Selector Pills (Configurable DEFAULT_RADIUS = 5km) */}
            <div className="flex items-center gap-0.5 lg:gap-1 bg-[#f8fafc] border border-slate-200 rounded-lg lg:rounded-xl p-0.5 lg:p-1 text-[10px] lg:text-xs font-bold">
              {[2, 5, 10, 20].map((r) => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={cn(
                    "px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-md lg:rounded-lg transition-all cursor-pointer text-[10px] lg:text-xs",
                    radiusKm === r
                      ? "bg-purple-600 text-white font-black shadow-none lg:shadow-2xs"
                      : "text-slate-600 hover:bg-slate-200/60"
                  )}
                >
                  {r} km
                </button>
              ))}
            </div>

            {/* View Mode Switcher: Split vs List vs Map */}
            <div className="flex items-center bg-[#f8fafc] border border-slate-200 rounded-lg lg:rounded-xl p-0.5 lg:p-1 text-[10px] lg:text-xs font-bold">
              <button
                onClick={() => setViewMode("split")}
                className={cn(
                  "px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-md lg:rounded-lg transition-all cursor-pointer hidden md:block",
                  viewMode === "split" ? "bg-white text-purple-700 shadow-none lg:shadow-2xs border border-slate-200" : "text-slate-500"
                )}
                title="Split View"
              >
                Split
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-1 lg:p-1.5 rounded-md lg:rounded-lg transition-all cursor-pointer",
                  viewMode === "list" ? "bg-white text-purple-700 shadow-none lg:shadow-2xs border border-slate-200" : "text-slate-500"
                )}
                title="List View"
              >
                <List className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={cn(
                  "p-1 lg:p-1.5 rounded-md lg:rounded-lg transition-all cursor-pointer",
                  viewMode === "map" ? "bg-white text-purple-700 shadow-none lg:shadow-2xs border border-slate-200" : "text-slate-500"
                )}
                title="Map View"
              >
                <MapIcon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              </button>
            </div>
          </div>
        </div>



        {/* QUICK CATEGORIES HORIZONTAL CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto px-4 lg:px-6 py-3 bg-white border-b lg:border-b border-slate-200/80 -mt-[1px] lg:mt-0 scrollbar-none relative z-10">
          {categoryChips.map((cat) => {
            const isSelected = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setSubcategoryFilter(null);
                }}
                className={cn(
                  "px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg lg:rounded-xl text-[11px] lg:text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0",
                  isSelected
                    ? "bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-600/25"
                    : "bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                )}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl lg:max-w-none mx-auto px-0 lg:px-0 mt-0 lg:mt-0">
        
        {/* SPLIT VIEW LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 items-start lg:items-stretch">
          
          {/* LEFT LIST COLUMN (Shows on Split & List View) */}
          <div
            className={cn(
              "space-y-4 transition-all",
              viewMode === "map" ? "hidden" : viewMode === "list" ? "lg:col-span-12" : "lg:col-span-7"
            )}
          >
            
            {/* List Header Count & Filters */}
            <div className="flex items-center justify-between bg-white p-3 lg:px-6 rounded-none lg:rounded-none border-b lg:border-b lg:border-x-0 lg:border-t-0 border-slate-200/90 shadow-none lg:shadow-none -mt-[1px] lg:mt-0 relative z-10">
              <span className="text-[10px] lg:text-xs font-black text-slate-800 uppercase tracking-wider">
                {businesses.length} Businesses Found ({radiusKm} km radius)
              </span>

              <div className="flex items-center gap-1.5 lg:gap-2">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="px-2 py-0.5 lg:px-2.5 lg:py-1 bg-[#f8fafc] border border-slate-200 rounded-lg lg:rounded-xl text-[10px] lg:text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="distance">Nearest First 📍</option>
                  <option value="rating">Highest Rated ⭐</option>
                </select>

                <button
                  onClick={() => setShowFiltersDrawer(!showFiltersDrawer)}
                  className="px-2 py-0.5 lg:px-3 lg:py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] lg:text-xs rounded-md lg:rounded-xl border border-purple-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                  <span>Filters</span>
                </button>
              </div>
            </div>

            {/* FILTER DRAWER EXPANDABLE */}
            {showFiltersDrawer && (
              <div className="bg-white p-4 rounded-none lg:rounded-2xl border-b lg:border-t lg:border border-slate-200/90 -mt-[1px] lg:mt-0 shadow-none lg:shadow-md space-y-3 animate-in fade-in relative z-10">
                <h4 className="font-extrabold text-xs text-slate-900">Advanced Nearby Filters</h4>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <label className="flex items-center gap-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={openNowOnly}
                      onChange={(e) => setOpenNowOnly(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-600"
                    />
                    <span>Open Now</span>
                  </label>

                  <label className="flex items-center gap-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-600"
                    />
                    <span>Verified Only</span>
                  </label>

                  <label className="flex items-center gap-2 bg-[#f8fafc] p-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offersOnly}
                      onChange={(e) => setOffersOnly(e.target.checked)}
                      className="w-3.5 h-3.5 accent-purple-600"
                    />
                    <span>Active Offers</span>
                  </label>

                  <button
                    onClick={() => {
                      setMinRating(minRating === 4.5 ? undefined : 4.5);
                    }}
                    className={cn(
                      "p-2.5 rounded-xl border font-bold text-xs transition-colors cursor-pointer text-left",
                      minRating === 4.5 ? "bg-purple-600 text-white border-purple-600" : "bg-[#f8fafc] text-slate-700 border-slate-200"
                    )}
                  >
                    4.5+ ★ Ratings
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-0 lg:space-y-0">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-white rounded-none lg:rounded-none border-b lg:border-b lg:border-x-0 lg:border-t-0 border-slate-200 -mt-[1px] lg:mt-0 p-4 animate-pulse flex gap-4 relative z-10">
                    <div className="w-28 h-28 bg-slate-200 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="w-1/3 h-3 bg-slate-200 rounded" />
                      <div className="w-2/3 h-5 bg-slate-200 rounded" />
                      <div className="w-1/2 h-3 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              /* ERROR STATE */
              <div className="bg-white rounded-none lg:rounded-3xl border-b lg:border border-rose-200 p-8 text-center space-y-3 shadow-none lg:shadow-2xs my-0 lg:my-6 -mt-[1px] lg:mt-0 relative z-10">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">Couldn&apos;t load nearby businesses</h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">{error}</p>
                </div>
                <button
                  onClick={() => fetchNearby()}
                  className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Try Again
                </button>
              </div>
            ) : businesses.length === 0 ? (
              /* EMPTY STATE */
              <div className="bg-white rounded-none lg:rounded-3xl border-b lg:border border-slate-200 p-8 text-center space-y-4 shadow-none lg:shadow-2xs my-0 lg:my-6 -mt-[1px] lg:mt-0 relative z-10">
                <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-inner">
                  <Compass className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900">No businesses found nearby</h3>
                  <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
                    Try expanding your search radius to 10km or selecting another category.
                  </p>
                </div>

                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setRadiusKm(10)}
                    className="px-4 py-2 bg-purple-600 text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Increase Radius to 10 km
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSubcategoryFilter(null);
                      setSearchQuery("");
                    }}
                    className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            ) : (
              /* BUSINESS CARDS LIST */
              <div className="space-y-0 lg:space-y-0">
                {businesses.map((b) => {
                  const isSaved = Boolean(savedMap[b.id]);
                  const isSelected = activeMapBusinessId === b.id;

                  return (
                    <div
                      key={b.id}
                      onClick={() => setActiveMapBusinessId(b.id)}
                      className={cn(
                        "bg-white rounded-none lg:rounded-none border-b lg:border-x-0 lg:border-t-0 lg:border-b border-slate-200/90 -mt-[1px] lg:mt-0 shadow-none lg:shadow-none hover:shadow-md lg:hover:shadow-none transition-all duration-200 p-4 space-y-3 relative group cursor-pointer",
                        isSelected ? "border-purple-600 ring-2 ring-purple-500/15 z-20" : "border-slate-200/90 hover:border-purple-200 z-10"
                      )}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        
                        {/* Thumbnail Image */}
                        <div className="relative w-full sm:w-36 h-36 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          {b.coverImageUrl ? (
                            <img
                              src={b.coverImageUrl}
                              alt={b.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Building2 className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[9px] lg:text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400 fill-amber-400" />
                            <span>{b.avgRating}</span>
                          </div>

                          {b.hasActiveOffer && (
                            <span className="absolute bottom-2 left-2 bg-rose-600 text-white text-[8px] lg:text-[9px] font-extrabold px-1.5 lg:px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                              <Tag className="w-2 h-2 lg:w-2.5 lg:h-2.5" /> Special Offer
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] lg:text-[10px] font-black text-purple-700 uppercase tracking-wider bg-purple-50 px-1.5 lg:px-2 py-0.5 rounded-md">
                                {b.primaryCategoryName}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void toggleSave(b);
                                }}
                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              >
                                <Bookmark className={cn("w-4 h-4", isSaved && "text-rose-500 fill-rose-500")} />
                              </button>
                            </div>

                            <Link href={`/business/${b.slug}`}>
                              <h3 className="font-black text-sm lg:text-base text-slate-900 group-hover:text-purple-600 transition-colors mt-1">
                                {b.name}
                              </h3>
                            </Link>

                            <p className="text-[11px] lg:text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                              {b.address}
                            </p>
                          </div>

                          {/* Status & Distance Bar */}
                          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2 pt-1 border-t border-slate-100 text-[10px] lg:text-xs">
                            <span className="font-extrabold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg">
                              📍 {b.formattedDistance} away
                            </span>

                            <span className={cn(
                              "font-bold px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-lg text-[9px] lg:text-[11px]",
                              b.isOpenNow ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                            )}>
                              {b.isOpenNow ? "Open Now" : "Closed"}
                            </span>

                            {b.isVerified && <VerifiedBadge size="sm" />}
                          </div>

                        </div>

                      </div>

                      {/* Action Buttons Row */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 lg:gap-2">
                          {b.phone && (
                            <a
                              href={`tel:${b.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold text-[10px] lg:text-xs rounded-lg lg:rounded-xl flex items-center gap-1 transition-colors"
                            >
                              <Phone className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-purple-600" />
                              <span>Call</span>
                            </a>
                          )}

                          {(b.whatsappPhone || b.phone) && (
                            <a
                              href={`https://wa.me/${(b.whatsappPhone || b.phone || "").replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hi, I found ${b.name} on Hubigo`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-2.5 py-1.5 lg:px-3 lg:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] lg:text-xs rounded-lg lg:rounded-xl flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.name + ' ' + b.address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 lg:px-3.5 lg:py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-[10px] lg:text-xs rounded-lg lg:rounded-xl shadow-2xs flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                          <span>Directions</span>
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* RIGHT MAP COLUMN (Shows on Split & Map View) */}
          <div
            className={cn(
              "transition-all sticky top-20 h-[calc(100vh-160px)] min-h-[420px]",
              viewMode === "list" ? "hidden" : viewMode === "map" ? "lg:col-span-12" : "lg:col-span-5"
            )}
          >
            <NearbyMap
              businesses={businesses}
              userLat={location.lat}
              userLng={location.lng}
              activeBusinessId={activeMapBusinessId}
              onSelectBusiness={(id) => setActiveMapBusinessId(id)}
            />
          </div>

        </div>

      </div>

    </div>
  );
}

export default function NearbyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8fafc]" />}>
      <NearbyPageContent />
    </Suspense>
  );
}
