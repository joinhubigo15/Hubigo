"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, Plus } from "lucide-react";
import Button from "@/app/components/ui/Button";
import {
  getSavedSearchesRequest,
  saveSearchRequest,
  removeSavedSearchRequest,
  type SavedSearch,
} from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";

export default function SavedSearchesCard() {
  const { accessToken } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getSavedSearchesRequest(accessToken)
      .then(setSearches)
      .catch((err) =>
        setErrorMsg(err instanceof ApiClientError ? err.message : "Could not load saved searches")
      );
  }, [accessToken]);

  if (!accessToken) return null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await saveSearchRequest(accessToken, {
        label,
        keyword: keyword || undefined,
        city: city || undefined,
      });
      setSearches((prev) => [created, ...(prev ?? [])]);
      setLabel("");
      setKeyword("");
      setCity("");
      setShowForm(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not save search");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!accessToken) return;
    setSearches((prev) => prev?.filter((s) => s.id !== id) ?? null);
    try {
      await removeSavedSearchRequest(accessToken, id);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not remove search");
    }
  }

  return (
    <div className="bg-transparent rounded-none shadow-none p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h2 className="text-base sm:text-lg lg:text-base font-black text-slate-900">Saved Searches</h2>
          <p className="text-xs sm:text-sm lg:text-xs text-slate-500 font-semibold mt-0.5">Quickly re-run searches you use often</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)} className="rounded-none font-bold text-xs">
          <Plus className="w-3.5 h-3.5" /> New
        </Button>
      </div>

      {errorMsg && (
        <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-none px-3.5 py-2.5 mb-4 sm:mb-6">
          {errorMsg}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 sm:mb-6 p-3 sm:p-4 bg-slate-50 rounded-none border border-slate-200/90"
        >
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
            placeholder="Name (e.g. Weekend brunch spots)"
            className="flex-1 px-3 py-2 bg-white border border-slate-200/90 rounded-none text-sm font-semibold text-slate-900 outline-none focus:border-purple-600 transition-colors"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Keyword"
            className="flex-1 px-3 py-2 bg-white border border-slate-200/90 rounded-none text-sm font-semibold text-slate-900 outline-none focus:border-purple-600 transition-colors"
          />
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="flex-1 px-3 py-2 bg-white border border-slate-200/90 rounded-none text-sm font-semibold text-slate-900 outline-none focus:border-purple-600 transition-colors"
          />
          <Button variant="primary" size="sm" disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </Button>
        </form>
      )}

      {!searches ? (
        <p className="text-sm font-semibold text-slate-500">Loading...</p>
      ) : searches.length === 0 ? (
        <p className="text-sm font-semibold text-slate-500 py-4 sm:py-8 text-center bg-slate-50 border border-slate-200/90">
          No saved searches yet. Save one above to get started.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {searches.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-none border border-slate-200/90 hover:border-purple-300 hover:bg-purple-50/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm lg:text-xs font-bold text-slate-900 truncate">{s.label}</p>
                  <p className="text-xs lg:text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                    {[s.keyword, s.category, s.city].filter(Boolean).join(" · ") || "All results"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(s.id)}
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2 transition-colors cursor-pointer flex-shrink-0"
                aria-label="Remove saved search"
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
