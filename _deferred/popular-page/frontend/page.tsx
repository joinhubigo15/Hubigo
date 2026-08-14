"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, MapPin, Heart, Flame, Search, Store } from "lucide-react";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import { useRouter } from "next/navigation";
import { cn } from "@/app/lib/utils";
import { request, saveBusinessRequest, removeSavedBusinessRequest, getSavedBusinessesRequest } from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";

interface PopularBusiness {
  id: string;
  slug: string;
  name: string;
  coverImageUrl: string | null;
  planTier: "basic" | "premium" | "elite";
  isVerified: boolean;
  isTrusted: boolean;
  avgRating: number;
  reviewCount: number;
  citySlug: string;
  cityName: string;
  localitySlug: string | null;
  localityName: string | null;
  primaryCategoryName: string | null;
}

interface PopularCategoryGroup {
  categorySlug: string;
  categoryName: string;
  businesses: PopularBusiness[];
}

const RANK_COLORS = ["bg-amber-500 text-white", "bg-purple-600 text-white", "bg-indigo-600 text-white"];

export default function PopularBusinessesPage() {
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<PopularCategoryGroup[] | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  // Maps a business id to its saved-record id so a re-toggle can DELETE it.
  const [savedMap, setSavedMap] = useState<Record<string, string>>({});

  useEffect(() => {
    request<PopularCategoryGroup[]>("/api/v1/popular?limit=10")
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

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

  const toggleFavorite = async (b: PopularBusiness, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !accessToken) {
      router.push(`/login?next=${encodeURIComponent("/popular")}`);
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
          category: b.primaryCategoryName ?? undefined,
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

  const filteredGroups = (groups ?? []).filter((g) =>
    searchTerm.trim() ? g.categoryName.toLowerCase().includes(searchTerm.trim().toLowerCase()) : true,
  );

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-8">

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold">
            <Flame className="w-3.5 h-3.5" />
            <span>Top 10 Per Category</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight mt-1">
            Popular Businesses
          </h1>
          <p className="text-xs text-slate-500 font-semibold max-w-lg">
            Ranked by real rating, profile completeness, and trust signals — the lineup refreshes every week.
          </p>
        </div>

        {/* Search / filter by category */}
        <div className="w-full md:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Category sections */}
      {groups === null ? (
        <div className="space-y-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-2">
          <p className="text-sm font-bold text-slate-700">No categories found</p>
          <p className="text-xs text-slate-500">Try a different search term.</p>
        </div>
      ) : (
        filteredGroups.map((group) => (
          <section key={group.categorySlug} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm sm:text-base font-black text-slate-900">{group.categoryName}</h2>
              <Link
                href={`/category/${group.categorySlug}`}
                className="text-[11px] font-bold text-purple-600 hover:underline"
              >
                View Category →
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none lg:grid lg:grid-cols-5 lg:overflow-visible">
              {group.businesses.map((b, idx) => (
                <Link
                  key={b.id}
                  href={`/business/${b.slug}`}
                  className="group bg-white rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between shrink-0 w-56 lg:w-auto"
                >
                  {/* Image */}
                  <div className="relative h-36 w-full overflow-hidden bg-slate-100">
                    {b.coverImageUrl ? (
                      <img
                        src={b.coverImageUrl}
                        alt={b.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Store className="w-8 h-8" />
                      </div>
                    )}

                    {idx < 3 && (
                      <span
                        className={cn(
                          "absolute top-2 left-2 text-[9px] font-black px-2 py-0.5 rounded shadow-xs",
                          RANK_COLORS[idx],
                        )}
                      >
                        #{idx + 1} This Week
                      </span>
                    )}

                    <button
                      onClick={(e) => void toggleFavorite(b, e)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-rose-500 transition-colors"
                    >
                      <Heart className={cn("w-3.5 h-3.5", Boolean(savedMap[b.id]) && "fill-rose-500 text-rose-500")} />
                    </button>

                    <div className="absolute bottom-2 left-2 bg-purple-600/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded flex items-center gap-0.5 shadow-xs">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      <span>{b.avgRating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Info Details */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-2">
                    <div className="space-y-1">
                      {b.primaryCategoryName && (
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          {b.primaryCategoryName}
                        </span>
                      )}
                      <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-purple-600 transition-colors leading-tight line-clamp-1">
                        {b.name}
                      </h3>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{b.localityName ?? b.cityName}</span>
                      </div>
                    </div>

                    {b.isVerified && (
                      <div className="pt-2 border-t border-slate-50">
                        <VerifiedBadge size="sm" />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

    </div>
  );
}
