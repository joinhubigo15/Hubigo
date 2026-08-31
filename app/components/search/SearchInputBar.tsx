"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Clock, TrendingUp, Store, Tag, MapPin, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useDebounce } from "@/app/hooks/useDebounce";
import { getSuggestions, getPopularSearches, resolveTopSearchOrFallback, TOP_X_IN_Y_PATTERN, type Suggestion } from "@/app/lib/search-api";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "@/app/lib/recent-searches";

interface SearchInputBarProps {
  value: string;
  onSubmit: (query: string) => void;
  placeholder?: string;
  className?: string;
  /** Renders just the icon+input+clear row with no background/border of its own — for embedding
   * inside a parent that already supplies its own boxed container (e.g. the homepage hero bar),
   * so the suggestions dropdown doesn't end up nested inside a second visible box. */
  bare?: boolean;
}

export interface SearchInputBarHandle {
  /** Commits whatever is currently typed, same as pressing Enter — lets an external "Search"
   * button trigger the same submit path without the parent needing to track the live draft text. */
  submit: () => void;
}

const TYPE_ICON: Record<Suggestion["type"], React.ElementType> = {
  business: Store,
  category: Tag,
  locality: MapPin,
  city: MapPin,
};

const SearchInputBar = forwardRef<SearchInputBarHandle, SearchInputBarProps>(function SearchInputBar(
  {
    value,
    onSubmit,
    placeholder = "Search Doctors, Hospitals, Clinics, Diagnostic Labs, Pharmacies...",
    className,
    bare = false,
  },
  ref
) {
  const [draft, setDraft] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>(() => getRecentSearches());
  const [popular, setPopular] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedDraft = useDebounce(draft, 300);
  const displaySuggestions = debouncedDraft.trim() ? suggestions : [];

  // Keep the local draft in sync when the `value` prop changes externally (e.g. browser
  // back/forward). Adjusting state during render, not in an effect, per React's guidance for
  // "resetting state when a prop changes".
  if (value !== prevValue) {
    setPrevValue(value);
    setDraft(value);
  }

  useEffect(() => {
    getPopularSearches().then(setPopular).catch(() => {});
  }, []);

  useEffect(() => {
    if (!debouncedDraft.trim()) return;
    let cancelled = false;
    getSuggestions(debouncedDraft)
      .then((res) => {
        if (!cancelled) setSuggestions(res);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [debouncedDraft]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const router = useRouter();

  function commit(query: string) {
    const trimmed = query.trim();
    setDraft(trimmed);
    setIsOpen(false);
    if (trimmed) {
      addRecentSearch(trimmed);
      setRecent(getRecentSearches());
    }

    // "Top X in Y" / "Best X in Y" queries route straight to the matching pSEO page instead of
    // the search results page — this is the only entry point into those pages besides a direct
    // link, so it has to be wired here as well as in HeroBannerSection.
    if (TOP_X_IN_Y_PATTERN.test(trimmed)) {
      resolveTopSearchOrFallback(trimmed).then((result) => {
        if (result.path !== null) router.push(result.path);
        else onSubmit(result.fallback);
      });
      return;
    }

    onSubmit(trimmed);
  }

  useImperativeHandle(ref, () => ({
    submit: () => commit(draft),
  }));

  const showEmptyState = !draft.trim();

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "flex items-center gap-2.5",
          bare
            ? "flex-1"
            : "rounded-2xl px-4 py-2.5 bg-white border border-purple-300/80 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/10 shadow-sm transition-all"
        )}
      >
        <Search className="w-4 h-4 text-purple-600 shrink-0 stroke-[2.5]" />
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit(draft);
            if (e.key === "Escape") setIsOpen(false);
          }}
          placeholder={placeholder}
          autoCapitalize="words"
          className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder-slate-400 border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 shadow-none capitalize"
          style={{ outline: "none", border: "none", boxShadow: "none" }}
        />
        {draft && (
          <button
            type="button"
            onClick={() => commit("")}
            className="text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-100 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto py-2">
          {showEmptyState ? (
            <>
              {recent.length > 0 && (
                <div className="px-3 pb-2">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Recent Searches
                    </span>
                    <button
                      onClick={() => {
                        clearRecentSearches();
                        setRecent([]);
                      }}
                      className="text-[10px] font-semibold text-purple-600 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  {recent.map((q) => (
                    <button
                      key={q}
                      onClick={() => commit(q)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs lg:text-sm font-medium text-slate-700 truncate">{q}</span>
                    </button>
                  ))}
                </div>
              )}
              {popular.length > 0 && (
                <div className="px-3 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Popular Searches
                  </span>
                  <div className="flex flex-wrap gap-1.5 px-1 pt-1.5">
                    {popular.map((q) => (
                      <button
                        key={q}
                        onClick={() => commit(q)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        <TrendingUp className="w-3 h-3" />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recent.length === 0 && popular.length === 0 && (
                <p className="px-4 py-3 text-xs text-slate-400">Start typing to search businesses...</p>
              )}
            </>
          ) : displaySuggestions.length > 0 ? (
            displaySuggestions.map((s, i) => {
              const Icon = TYPE_ICON[s.type];
              return (
                <button
                  key={`${s.type}-${s.slug}-${i}`}
                  onClick={() => commit(s.label)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-left cursor-pointer"
                >
                  <Icon className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="text-xs lg:text-sm font-semibold text-slate-800 truncate">{s.label}</span>
                  {s.sublabel && <span className="text-[11px] lg:text-xs text-slate-400 truncate">· {s.sublabel}</span>}
                </button>
              );
            })
          ) : (
            <p className="px-4 py-3 text-xs text-slate-400">No matches — press Enter to search anyway.</p>
          )}
        </div>
      )}
    </div>
  );
});

export default SearchInputBar;
