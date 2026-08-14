"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { searchCities, type GeocodedCity } from "@/app/lib/geocoding";
import { cn } from "@/app/lib/utils";

const DEBOUNCE_MS = 350;

/** Free-text city input with live real-world autocomplete (same OpenStreetMap-backed lookup as
 * the homepage's CityPickerPill) — lets a user type/pick any real city rather than being limited
 * to a fixed dropdown of only the cities Hubigo currently operates in. This is a personalization
 * field only (not used for search filtering), so any real city name is a valid value. */
export default function CityAutocompleteInput({
  value,
  onChange,
  placeholder = "e.g. Bangalore",
  className,
  inputClassName,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<GeocodedCity[]>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortRef.current) abortRef.current.abort();

    const trimmed = value.trim();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only the text value should re-trigger the lookup
  }, [value]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
      />
      {open && value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-[#181a2e] border border-purple-500/30 rounded-lg shadow-lg z-50 py-1">
          {searching ? (
            <p className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Searching...
            </p>
          ) : suggestions.length === 0 ? (
            <p className="px-3.5 py-2.5 text-xs font-semibold text-slate-500">No matching cities found</p>
          ) : (
            suggestions.map((c, i) => (
              <button
                key={`${c.name}-${c.subtitle}-${i}`}
                type="button"
                onClick={() => {
                  onChange(c.name);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2 text-left px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
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
  );
}
