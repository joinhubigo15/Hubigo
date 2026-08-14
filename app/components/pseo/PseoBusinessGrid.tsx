"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import BusinessResultCard from "@/app/components/search/BusinessResultCard";
import SortDropdown from "@/app/components/search/SortDropdown";
import { useNearbyLocation } from "@/app/lib/useNearbyLocation";
import { searchBusinesses, type BusinessSummary, type SearchFilters, type SortOption } from "@/app/lib/search-api";

const BATCH_SIZE = 20;
const PSEO_SORT_OPTIONS: SortOption[] = ["rating", "distance"];

/**
 * Shared listings grid for both pSEO templates (City x Category/Subcategory and Area x
 * Category/Subcategory) — server passes the first `BATCH_SIZE` businesses (already fetched for
 * SSR, sorted by rating) plus `maxExposed` (Math.min(realTotal, PSEO_MAX_EXPOSED)). This component
 * progressively loads more on demand, capped at maxExposed, and lets the user switch to a
 * "Nearest" sort — the page itself stays framed as "Top Rated X in Y" (rating is the default and
 * the SSR/SEO-visible order), distance is purely an opt-in client-side view on top of it.
 *
 * `queryFilters` must be the exact same filters (minus page/limit/sort/lat/lng) the server used
 * for its own fetch, so the "Highest Rated" sort option stays consistent with the SSR-rendered
 * ordering.
 */
export default function PseoBusinessGrid({
  initialItems,
  maxExposed,
  queryFilters,
}: {
  initialItems: BusinessSummary[];
  maxExposed: number;
  queryFilters: Omit<SearchFilters, "page" | "limit" | "sort" | "lat" | "lng">;
}) {
  const [items, setItems] = useState<BusinessSummary[]>(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errored, setErrored] = useState(false);
  const [sort, setSort] = useState<SortOption>("rating");

  const { location, hasRealFix, requestGPS } = useNearbyLocation();
  const [pendingDistanceSort, setPendingDistanceSort] = useState(false);
  const [distanceDenied, setDistanceDenied] = useState(false);

  const hasMore = items.length < maxExposed;

  async function fetchSorted(nextSort: SortOption, lat?: number, lng?: number) {
    setLoading(true);
    setErrored(false);
    try {
      const result = await searchBusinesses({
        ...queryFilters,
        sort: nextSort,
        ...(lat != null && lng != null ? { lat, lng } : {}),
        page: 1,
        limit: BATCH_SIZE,
      });
      setItems(result.items.slice(0, maxExposed));
      setPage(1);
      setSort(nextSort);
    } catch {
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSortChange(nextSort: SortOption) {
    if (nextSort === sort) return;
    if (nextSort !== "distance") {
      fetchSorted(nextSort);
      return;
    }
    if (hasRealFix && location.lat != null && location.lng != null) {
      fetchSorted("distance", location.lat, location.lng);
    } else {
      // A direct click on "Nearest" is a clear user gesture — fine to fire the native
      // permission prompt right from here, same pattern as /search's sort dropdown.
      setDistanceDenied(false);
      setPendingDistanceSort(true);
      requestGPS();
    }
  }

  useEffect(() => {
    if (!pendingDistanceSort) return;
    if (location.status === "denied") {
      setPendingDistanceSort(false);
      setDistanceDenied(true);
      return;
    }
    if (!hasRealFix || location.lat == null || location.lng == null) return;
    setPendingDistanceSort(false);
    fetchSorted("distance", location.lat, location.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when a fresh, real location actually resolves
  }, [pendingDistanceSort, hasRealFix, location.status, location.lat, location.lng]);

  async function loadMore() {
    if (loading || !hasMore) return;
    setLoading(true);
    setErrored(false);
    try {
      const nextPage = page + 1;
      // Always request a fixed BATCH_SIZE (not a variable "remaining" amount) — the backend
      // computes offset as (page-1)*limit, so varying limit per request would corrupt pagination
      // near the cap. Any overshoot past maxExposed is trimmed client-side after the fetch.
      const result = await searchBusinesses({
        ...queryFilters,
        sort,
        ...(sort === "distance" && location.lat != null && location.lng != null
          ? { lat: location.lat, lng: location.lng }
          : {}),
        page: nextPage,
        limit: BATCH_SIZE,
      });
      const room = maxExposed - items.length;
      const trimmed = result.items.slice(0, room);
      setItems((prev) => [...prev, ...trimmed]);
      setPage(nextPage);
    } catch {
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2 pb-3">
        <span className="text-[11px] text-slate-400 font-medium">
          {sort === "distance" ? "Sorted by nearest" : "Sorted by highest rated"}
        </span>
        <SortDropdown
          value={sort}
          onChange={handleSortChange}
          options={PSEO_SORT_OPTIONS}
          label={sort === "distance" ? "Sort: Nearest" : "Sort: Highest Rated"}
        />
      </div>
      {distanceDenied && location.error && (
        <p className="text-[11px] text-rose-500 font-medium pb-2">{location.error}</p>
      )}
      {loading && (
        <div className="flex justify-center pb-3">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 lg:gap-4 px-0 lg:px-0">
        {items.map((business) => (
          <BusinessResultCard key={business.id} business={business} />
        ))}
      </div>

      {hasMore && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 disabled:opacity-60 rounded-full transition-colors cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {loading ? "Loading..." : "Load More"}
          </button>
          {errored && (
            <p className="text-[11px] text-rose-500 font-medium">Couldn&apos;t load more — try again.</p>
          )}
        </div>
      )}
    </>
  );
}
