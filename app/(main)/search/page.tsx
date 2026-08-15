"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, X, GitCompareArrows } from "lucide-react";
import { cn } from "@/app/lib/utils";
import SearchInputBar from "@/app/components/search/SearchInputBar";
import FiltersPanel from "@/app/components/search/FiltersPanel";
import ActiveFilterChips from "@/app/components/search/ActiveFilterChips";
import SortDropdown from "@/app/components/search/SortDropdown";
import BusinessResultCard from "@/app/components/search/BusinessResultCard";
import SkeletonResultCard from "@/app/components/search/SkeletonResultCard";
import EmptySearchState from "@/app/components/search/EmptySearchState";

import CompareNearbyPanel from "@/app/components/search/CompareNearbyPanel";
import { useIntersectionObserver } from "@/app/hooks/useIntersectionObserver";
import { useNearbyLocation } from "@/app/lib/useNearbyLocation";
import { SUPPORTED_CITIES } from "@/app/lib/city-context";
import { OTHER_KNOWN_CITIES } from "@/app/lib/known-cities";
import {
  searchBusinesses,
  type BusinessSummary,
  type SearchFilters,
  type SortOption,
} from "@/app/lib/search-api";

function normalizeCityQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

const ARRAY_KEYS = ["price", "amenities", "tier"] as const;
const NUMBER_KEYS = ["lat", "lng", "radiusKm", "minRating"] as const;
const BOOLEAN_KEYS = ["openNow", "verified", "offers"] as const;

function filtersFromSearchParams(params: URLSearchParams): SearchFilters {
  const filters: SearchFilters = {};

  const q = params.get("q");
  if (q) filters.q = q;
  const category = params.get("category");
  if (category) filters.category = category;
  const subcategory = params.get("subcategory");
  if (subcategory) filters.subcategory = subcategory;
  const city = params.get("city");
  if (city) filters.city = city;
  const locality = params.get("locality");
  if (locality) filters.locality = locality;
  const pincode = params.get("pincode");
  if (pincode) filters.pincode = pincode;
  const sort = params.get("sort");
  if (sort) filters.sort = sort as SortOption;

  for (const key of NUMBER_KEYS) {
    const raw = params.get(key);
    if (raw) filters[key] = Number(raw);
  }
  for (const key of BOOLEAN_KEYS) {
    if (params.get(key) === "true") filters[key] = true;
  }
  for (const key of ARRAY_KEYS) {
    const raw = params.get(key);
    if (raw) (filters as Record<string, unknown>)[key] = raw.split(",").filter(Boolean);
  }

  return filters;
}

function searchParamsFromFilters(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || key === "page" || key === "limit") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  return params;
}

const PAGE_SIZE = 20;

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);
  const filtersKey = useMemo(() => searchParamsFromFilters(filters).toString(), [filters]);

  // A bare city-name query ("Mumbai", "Hyderabad") is a special case, not a normal free-text
  // search: our data only covers SUPPORTED_CITIES, so a supported city should go straight to its
  // real city page, and any other real city name should say so plainly rather than silently
  // running a search that can only ever come back empty.
  const normalizedQuery = filters.q ? normalizeCityQuery(filters.q) : "";
  const matchedSupportedCity = useMemo(
    () => (normalizedQuery ? SUPPORTED_CITIES.find((c) => c.name.toLowerCase() === normalizedQuery) : undefined),
    [normalizedQuery]
  );
  const matchedOtherCity = useMemo(
    () =>
      !matchedSupportedCity && normalizedQuery
        ? OTHER_KNOWN_CITIES.find((name) => name.toLowerCase() === normalizedQuery)
        : undefined,
    [normalizedQuery, matchedSupportedCity]
  );

  const [items, setItems] = useState<BusinessSummary[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [hasVerifiedMatches, setHasVerifiedMatches] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const loadedFiltersKey = useRef<string | null>(null);

  // Compare needs one concrete subcategory to scope to. An explicit filter always wins; otherwise
  // infer it from whichever primary category is most common among the loaded results — covers the
  // common case of a free-text search ("cake shops in bangalore") that never set category/subcategory.
  const compareSubcategory = useMemo(() => {
    if (filters.subcategory) return filters.subcategory;
    const counts = new Map<string, number>();
    for (const b of items) {
      if (b.primaryCategorySlug) counts.set(b.primaryCategorySlug, (counts.get(b.primaryCategorySlug) ?? 0) + 1);
    }
    let best: string | undefined;
    let bestCount = 0;
    counts.forEach((count, slug) => {
      if (count > bestCount) {
        best = slug;
        bestCount = count;
      }
    });
    return best;
  }, [filters.subcategory, items]);

  const { ref: sentinelRef, isVisible } = useIntersectionObserver({ triggerOnce: false, rootMargin: "300px" });

  const runSearch = useCallback(async (targetPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const result = await searchBusinesses({ ...filters, page: targetPage, limit: PAGE_SIZE });
      setItems((prev) => (append ? [...prev, ...result.items] : result.items));
      setTotal(result.total);
      setHasVerifiedMatches(result.hasVerifiedMatches);
      setPage(targetPage);
    } catch {
      setErrorMsg("Something went wrong loading results. Please try again.");
    } finally {
      if (append) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    if (loadedFiltersKey.current === filtersKey) return;
    loadedFiltersKey.current = filtersKey;
    if (matchedSupportedCity || matchedOtherCity) {
      // Redirecting (supported city) or showing the "not here yet" state (other city) — either
      // way, skip the network round-trip; it would only ever leak the whole unfiltered dataset
      // (supported city) or come back empty (other city) while we decide what to render.
      setLoading(false);
      setItems([]);
      setTotal(0);
      return;
    }
    runSearch(1, false);
    setCompareOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey]);

  useEffect(() => {
    if (matchedSupportedCity) {
      router.replace(`/city/${matchedSupportedCity.slug}`);
    }
  }, [matchedSupportedCity, router]);

  useEffect(() => {
    if (!isVisible || loading || loadingMore) return;
    if (total != null && items.length >= total) return;
    // Deferred to a microtask so the loadingMore/loading state updates inside runSearch happen
    // outside this effect's synchronous pass.
    queueMicrotask(() => runSearch(page + 1, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  function updateFilters(patch: Partial<SearchFilters>) {
    const merged = { ...filters, ...patch };
    const params = searchParamsFromFilters(merged);
    router.push(`/search?${params.toString()}`);
  }

  // Typing a new name/keyword search while "Distance" is still selected from an earlier search
  // would silently keep ordering purely by distance (text match is only a tie-breaker server-side,
  // never a filter — see search.service.ts), burying the actual name matches. A fresh query should
  // go back to relevance ranking; the user can still re-pick Distance from the sort dropdown.
  function handleSearchSubmit(q: string) {
    if (filters.sort === "distance" && q !== (filters.q ?? "")) {
      // Drop back to relevance ranking, but keep the coordinates — distance still shows on every
      // card either way (see the "compulsory" note below), it just stops being the sort key.
      updateFilters({ q: q || undefined, sort: undefined });
    } else {
      updateFilters({ q: q || undefined });
    }
  }

  // "Distance" sort needs real coordinates or it silently falls back to best_match server-side
  // (see search.service.ts's toSearchParams) while the UI still labels it "Distance" — looking
  // like random ordering. useNearbyLocation restores a cached fix instantly when we already have
  // one; otherwise it kicks off a fresh GPS request and pendingDistanceSort applies it once ready.
  const { location, hasRealFix, requestGPS } = useNearbyLocation();
  const [pendingDistanceSort, setPendingDistanceSort] = useState(false);

  function handleSortChange(sort: SortOption) {
    if (sort === "best_match") {
      // "Best Match" is just the no-op default — don't write it to the URL as if it were an
      // explicit choice, or it would permanently block the nearest-first auto-detect below.
      updateFilters({ sort: undefined });
      return;
    }
    if (sort !== "distance") {
      updateFilters({ sort });
      return;
    }
    if (hasRealFix && location.lat != null && location.lng != null) {
      updateFilters({ sort, lat: location.lat, lng: location.lng });
    } else {
      // A direct click on "Distance" is itself a clear user gesture, so it's fine to fire the
      // native prompt right from here rather than routing through the pre-prompt modal.
      setPendingDistanceSort(true);
      requestGPS();
    }
  }

  useEffect(() => {
    if (!pendingDistanceSort || !hasRealFix || location.lat == null || location.lng == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing the pending flag once the GPS fix lands is intentional
    setPendingDistanceSort(false);
    updateFilters({ sort: "distance", lat: location.lat, lng: location.lng });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDistanceSort, hasRealFix, location.lat, location.lng]);

  // Distance only ever attaches to a search — and only ever shows on a card — when we have a
  // REAL location signal (hasRealFix: actual GPS grant or a manually geocoded address). The
  // "denied"/"skipped" states carry a Bangalore DEFAULT_CENTER fallback inside useNearbyLocation
  // for other features (the homepage Nearby section), but that fallback must never leak into
  // /search — showing a fake distance to a user who never granted location, or who is nowhere
  // near Bangalore, is exactly the bug this gate fixes. Nearest-first is now the default sort for
  // every search (query or query-less) once a real location resolves, unless the user explicitly
  // picked a different sort — matches the "results should default to nearest" product decision.
  const hasExplicitSort = searchParams.get("sort") != null;
  useEffect(() => {
    if (filters.lat != null || filters.lng != null) return;
    if (!hasRealFix || location.lat == null || location.lng == null) return;
    const patch: Partial<SearchFilters> = { lat: location.lat, lng: location.lng };
    if (!hasExplicitSort) patch.sort = "distance";
    updateFilters(patch);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a fresh, real location actually resolves
  }, [hasExplicitSort, hasRealFix, location.lat, location.lng]);

  // Fire the browser's own native location permission prompt directly on first load — no custom
  // in-app modal in between. Only fires once, and only when nothing is known yet (a cached/real
  // fix already resolved, or the URL already carries lat/lng). If the user denies it,
  // useNearbyLocation's error handler records that (see hasRealFix above), so no fake distance
  // ever attaches — this only controls how permission is FIRST asked for, not the correctness gate.
  const requestedLocationRef = useRef(false);
  useEffect(() => {
    if (requestedLocationRef.current) return;
    if (filters.lat != null || filters.lng != null) return;
    if (location.lat != null) return;
    requestedLocationRef.current = true;
    requestGPS();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fire once, only for the true "nothing known yet" case
  }, []);

  function resetFilters() {
    router.push(filters.q ? `/search?q=${encodeURIComponent(filters.q)}` : "/search");
  }

  const hasMore = total == null || items.length < total;

  // "All" (mobile quick action bar) just clears the same quick-filter fields the desktop
  // FiltersPanel already exposes — reused here, not new filter logic.
  const isAllActive =
    (filters.tier ?? []).length === 0 && filters.openNow !== true && filters.minRating == null;

  return (
    <div className="bg-[#f1f4f9] min-h-screen px-0 lg:px-0 py-0 lg:py-0 flex flex-col gap-0 lg:gap-0">
      {/* SEAMLESS ATTACHED SEARCH HEADER CARD (Search Box + Sort/Filter Controls directly attached) */}
      <div className="bg-white rounded-none border-b lg:border-none border-slate-200/90 shadow-2xs lg:shadow-none z-20 relative">
        {/* Top Search Input Row */}
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1 bg-white">
          <button
            onClick={() => router.back()}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 cursor-pointer border border-slate-200/60"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <SearchInputBar
            value={filters.q ?? ""}
            onSubmit={handleSearchSubmit}
            className="flex-1"
          />
        </div>

        {/* Standalone Pill Cells Toolbar (With Side Edge Inset Gap & Compact Pill Sizes) */}
        <div className="w-full flex items-center justify-between gap-1.5 px-3.5 sm:px-4 pt-1 pb-2 bg-white">
          {/* 1. All Pill Cell */}
          <button
            onClick={() => updateFilters({ tier: undefined, openNow: undefined, minRating: undefined })}
            className={cn(
              "flex-1 py-0.5 sm:py-1 px-1 rounded-full text-[9.5px] sm:text-[11px] font-bold transition-all cursor-pointer border shadow-2xs text-center justify-center flex items-center min-w-0",
              isAllActive
                ? "bg-purple-600 text-white border-purple-600 shadow-purple-600/20 font-black"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            )}
          >
            All
          </button>

          {/* 2. Sort By Pill Cell */}
          <div className="flex-1 min-w-0">
            <SortDropdown value={filters.sort ?? "best_match"} onChange={handleSortChange} label="Sort by" className="w-full px-1 py-0.5 sm:py-1 text-[9.5px] sm:text-[11px] justify-center" />
          </div>

          {/* 3. Comparison Pill Cell (Full Word, No Truncation) */}
          <button
            onClick={() => compareSubcategory && setCompareOpen(true)}
            disabled={!compareSubcategory}
            className={cn(
              "flex-[1.2] flex items-center justify-center gap-0.5 py-0.5 sm:py-1 px-1 rounded-full text-[9.5px] sm:text-[11px] font-bold transition-all border shadow-2xs cursor-pointer whitespace-nowrap min-w-0",
              !compareSubcategory
                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                : compareOpen
                ? "bg-purple-600 text-white border-purple-600 shadow-purple-600/20 font-black"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
            )}
          >
            <GitCompareArrows className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">Comparison</span>
          </button>

          {/* 4. Filter Pill Cell */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex-1 flex items-center justify-center gap-0.5 py-0.5 sm:py-1 px-1 rounded-full text-[9.5px] sm:text-[11px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs whitespace-nowrap min-w-0"
          >
            <SlidersHorizontal className="w-3 h-3 text-purple-600 shrink-0" />
            <span className="whitespace-nowrap">Filter</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips + Sort (desktop) */}
      <div className="hidden lg:flex items-center justify-between gap-3 lg:px-6 lg:py-3 lg:bg-white lg:border-b lg:border-slate-100">
        <ActiveFilterChips filters={filters} onChange={updateFilters} />
        <div className="ml-auto shrink-0 flex items-center gap-2">
          {compareSubcategory && !compareOpen && (
            <button
              onClick={() => setCompareOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm shadow-purple-600/25 cursor-pointer"
            >
              <GitCompareArrows className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare Top 5</span>
              <span className="sm:hidden">Compare</span>
            </button>
          )}
          <SortDropdown value={filters.sort ?? "best_match"} onChange={handleSortChange} />
        </div>
      </div>

      {compareOpen ? (
        <CompareNearbyPanel category={filters.category} subcategory={compareSubcategory} onClose={() => setCompareOpen(false)} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-0 items-start lg:items-stretch flex-1">
          {/* Desktop Filters Sidebar */}
          <FiltersPanel
            filters={filters}
            onChange={updateFilters}
            onReset={resetFilters}
            hasVerifiedMatches={hasVerifiedMatches}
            className="hidden lg:flex lg:col-span-3"
          />

          {/* Results */}
          <div className="lg:col-span-9 flex flex-col gap-0 lg:gap-0 bg-white">
            {errorMsg && (
              <div className="bg-white rounded-2xl border border-rose-100 shadow-xs p-6 text-center text-sm text-rose-600 font-semibold">
                {errorMsg}
              </div>
            )}

            {matchedSupportedCity ? (
              <div className="bg-white border-t lg:border-0 border-slate-100 shadow-2xs lg:shadow-none overflow-hidden lg:rounded-none divide-y divide-slate-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonResultCard key={i} />
                ))}
              </div>
            ) : matchedOtherCity ? (
              <EmptySearchState
                onResetFilters={resetFilters}
                title={`We're not in ${matchedOtherCity} yet`}
                message="Hubigo currently covers Bangalore, Chennai, and Hyderabad — we're working on expanding to more cities soon."
              />
            ) : loading ? (
              <div className="bg-white border-t lg:border-0 border-slate-100 shadow-2xs lg:shadow-none overflow-hidden lg:rounded-none divide-y divide-slate-100">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonResultCard key={i} />
                ))}
              </div>
            ) : items.length === 0 && !errorMsg ? (
              filters.verified ? (
                <EmptySearchState
                  onResetFilters={resetFilters}
                  title="No platform-verified businesses here yet"
                  message="We don't have any verified businesses for this category/area yet — try turning off Verified Only to see everything."
                />
              ) : (
                <EmptySearchState onResetFilters={resetFilters} />
              )
            ) : (
              <>
                <div className="bg-white border-t lg:border-0 border-slate-100 shadow-2xs lg:shadow-none overflow-hidden lg:rounded-none divide-y divide-slate-100">
                  {items.map((business) => (
                    <BusinessResultCard key={business.id} business={business} />
                  ))}
                </div>

                {hasMore && (
                  <div ref={sentinelRef} className="flex flex-col gap-0.5 lg:gap-3 pt-1">
                    {loadingMore ? (
                      Array.from({ length: 2 }).map((_, i) => <SkeletonResultCard key={i} />)
                    ) : (
                      <button
                        onClick={() => runSearch(page + 1, true)}
                        className="mx-auto px-5 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors cursor-pointer"
                      >
                        Load More
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileFiltersOpen(false)} />
          <div className="relative ml-auto w-[85%] max-w-sm h-full bg-[#f1f4f9] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <FiltersPanel filters={filters} onChange={updateFilters} onReset={resetFilters} hasVerifiedMatches={hasVerifiedMatches} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f4f9]" />}>
      <SearchPageContent />
    </Suspense>
  );
}
