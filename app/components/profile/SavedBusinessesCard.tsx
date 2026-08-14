"use client";

import { useEffect, useState } from "react";
import { Heart, Star, Trash2 } from "lucide-react";
import { getSavedBusinessesRequest, removeSavedBusinessRequest, type SavedBusiness } from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";

export default function SavedBusinessesCard() {
  const { accessToken } = useAuth();
  const [businesses, setBusinesses] = useState<SavedBusiness[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getSavedBusinessesRequest(accessToken)
      .then(setBusinesses)
      .catch((err) =>
        setErrorMsg(
          err instanceof ApiClientError ? err.message : "Could not load saved businesses"
        )
      );
  }, [accessToken]);

  if (!accessToken) return null;

  async function handleRemove(id: string) {
    if (!accessToken) return;
    setBusinesses((prev) => prev?.filter((b) => b.id !== id) ?? null);
    try {
      await removeSavedBusinessRequest(accessToken, id);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not remove business");
    }
  }

  return (
    <div className="bg-transparent rounded-none border-b border-slate-200/90 shadow-none p-4 sm:p-6">
      <h2 className="text-base sm:text-lg lg:text-base font-black text-slate-900">Saved Businesses</h2>
      <p className="text-xs sm:text-sm lg:text-xs text-slate-500 font-semibold mb-4 sm:mb-6">Businesses you&apos;ve bookmarked for later</p>

      {errorMsg && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-none px-3.5 py-2.5 mb-4 sm:mb-6">
          {errorMsg}
        </div>
      )}

      {!businesses ? (
        <p className="text-sm font-semibold text-slate-500">Loading...</p>
      ) : businesses.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-2 py-8 sm:py-12">
          <Heart className="w-8 h-8 text-slate-300" />
          <p className="text-sm text-slate-500 font-semibold max-w-xs">
            No saved businesses yet. Once business listings are live, tap the heart icon on any
            listing to bookmark it here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {businesses.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 p-3 sm:p-4 rounded-none border border-slate-200/90 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
            >
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-none bg-slate-100 border border-slate-200/90 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {b.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imageUrl} alt={b.name} className="w-full h-full object-cover" />
                ) : (
                  <Heart className="w-4 h-4 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm lg:text-xs font-bold text-slate-900 truncate">{b.name}</p>
                <div className="flex items-center gap-1.5 text-xs lg:text-[11px] text-slate-500 font-semibold mt-0.5">
                  {b.rating != null && (
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {b.rating}
                    </span>
                  )}
                  <span className="truncate">{[b.category, b.city].filter(Boolean).join(" · ")}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(b.id)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 -mr-2 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Remove saved business"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
