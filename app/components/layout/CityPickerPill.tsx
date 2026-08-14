"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, Loader2, Search, AlertTriangle, ChevronDown } from "lucide-react";
import { useCity } from "@/app/lib/city-context";
import { searchCities, type GeocodedCity } from "@/app/lib/geocoding";
import { cn } from "@/app/lib/utils";

const DEBOUNCE_MS = 350;

/** Homepage city pill — click to open a Justdial-style popover: a "Detect my location" action up
 * top, then a search box with live autocomplete suggestions for any city in the world (via
 * OpenStreetMap, since this is display-only and never touches our own limited city dataset).
 * Reused across the desktop header and the hero placements, so the behavior only needs to be
 * right in one place. */
export default function CityPickerPill({
  size = "sm",
  theme = "light",
}: {
  size?: "xs" | "sm" | "md";
  theme?: "light" | "dark";
}) {
  const { selectedCity, locationStatus, requestLocation, setManualCityName } = useCity();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodedCity[]>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const wasDetecting = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const dims =
    size === "xs"
      ? { icon: "w-3 h-3", text: "text-[10px]", pad: "px-2 py-1" }
      : size === "md"
      ? { icon: "w-4 h-4", text: "text-sm", pad: "px-4 py-2" }
      : { icon: "w-3.5 h-3.5", text: "text-xs", pad: "px-3.5 py-1.5" };

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Debounced live autocomplete as the user types — cancels the previous in-flight request so a
  // slow earlier keystroke can't clobber a faster later one.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clearing stale suggestions when the query is cleared/too short is intentional
      setSuggestions([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(() => {
      const controller = new AbortController();
      abortRef.current = controller;
      searchCities(trimmed, controller.signal)
        .then((results) => {
          if (!controller.signal.aborted) setSuggestions(results);
        })
        .catch(() => {
          if (!controller.signal.aborted) setSuggestions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Auto-close once a "Detect my location" click actually resolves to a city.
  useEffect(() => {
    if (locationStatus === "detecting") wasDetecting.current = true;
    if (locationStatus === "granted" && wasDetecting.current) {
      wasDetecting.current = false;
      setOpen(false);
    }
  }, [locationStatus]);

  function handlePick(city: GeocodedCity) {
    setManualCityName(city.name);
    setOpen(false);
    setQuery("");
    setSuggestions([]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (suggestions.length > 0) {
      handlePick(suggestions[0]);
    } else if (query.trim()) {
      setManualCityName(query);
      setOpen(false);
      setQuery("");
    }
  }

  const isDark = theme === "dark";

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "border shadow-xs rounded-xl font-medium flex items-center gap-1.5 transition-all cursor-pointer",
          dims.pad,
          dims.text,
          isDark
            ? "bg-[#1c1f36] border-purple-500/20 text-slate-200 hover:text-white hover:border-purple-500/40"
            : "bg-white border-slate-200/90 hover:border-slate-300 text-slate-700"
        )}
      >
        {locationStatus === "detecting" ? (
          <Loader2 className={cn(dims.icon, "animate-spin", isDark ? "text-purple-400" : "text-slate-500")} />
        ) : (
          <MapPin className={cn(dims.icon, isDark ? "text-purple-400" : "text-slate-500")} />
        )}
        <span>{selectedCity.name}</span>
        <ChevronDown className={cn(dims.icon, "text-slate-400")} />
      </button>

      {open && (
        <div
          className={cn(
            "absolute right-0 mt-2 w-72 max-w-[85vw] rounded-2xl border shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95",
            isDark ? "bg-[#181a2e] border-purple-500/30" : "bg-white border-slate-100"
          )}
        >
          {/* Detect Location */}
          <button
            onClick={requestLocation}
            disabled={locationStatus === "detecting"}
            className={cn(
              "w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors cursor-pointer border-b",
              isDark ? "border-purple-500/20 hover:bg-white/5" : "border-slate-100 hover:bg-purple-50"
            )}
          >
            {locationStatus === "detecting" ? (
              <Loader2 className="w-4 h-4 text-purple-500 animate-spin shrink-0" />
            ) : (
              <LocateFixed className="w-4 h-4 text-purple-500 shrink-0" />
            )}
            <span className={cn("text-xs font-bold", isDark ? "text-purple-300" : "text-purple-700")}>
              {locationStatus === "detecting" ? "Detecting your location..." : "Detect my location"}
            </span>
          </button>

          {(locationStatus === "denied" || locationStatus === "unsupported") && (
            <div className={cn("flex items-start gap-2 px-4 py-2.5 border-b", isDark ? "border-purple-500/20 bg-amber-500/10" : "border-slate-100 bg-amber-50")}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <p className={cn("text-[11px] font-semibold leading-snug", isDark ? "text-amber-300" : "text-amber-800")}>
                {locationStatus === "unsupported"
                  ? "Your browser doesn't support location detection — search for your city below instead."
                  : "Location is turned off. Enable it in your browser's site settings to auto-detect your city."}
              </p>
            </div>
          )}

          {/* Search box */}
          <form onSubmit={handleSubmit} className={cn("flex items-center gap-2 px-3 py-2 border-b", isDark ? "border-purple-500/20" : "border-slate-100")}>
            {searching ? (
              <Loader2 className={cn("w-3.5 h-3.5 shrink-0 animate-spin", isDark ? "text-slate-500" : "text-slate-400")} />
            ) : (
              <Search className={cn("w-3.5 h-3.5 shrink-0", isDark ? "text-slate-500" : "text-slate-400")} />
            )}
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for any city"
              className={cn(
                "w-full bg-transparent text-xs font-medium focus:outline-none",
                isDark ? "text-slate-100 placeholder-slate-500" : "text-slate-800 placeholder-slate-400"
              )}
            />
          </form>

          {/* Suggestions */}
          {query.trim().length >= 2 && (
            <div className="max-h-56 overflow-y-auto py-1">
              {suggestions.length === 0 ? (
                <p className={cn("px-4 py-3 text-xs font-semibold text-center", isDark ? "text-slate-500" : "text-slate-400")}>
                  {searching ? "Searching..." : "No matching cities — press Enter to use this name anyway"}
                </p>
              ) : (
                suggestions.map((c, i) => (
                  <button
                    key={`${c.name}-${c.subtitle}-${i}`}
                    onClick={() => handlePick(c)}
                    className={cn(
                      "w-full flex items-center gap-2 text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer",
                      isDark ? "text-slate-200 hover:bg-white/5" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <MapPin className="w-3 h-3 shrink-0 opacity-60" />
                    <span className="truncate">{c.name}</span>
                    {c.subtitle && <span className="text-[10px] opacity-50 truncate">, {c.subtitle}</span>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
