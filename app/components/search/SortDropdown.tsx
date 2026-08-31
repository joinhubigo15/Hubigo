"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { SortOption } from "@/app/lib/search-api";

const SORT_LABELS: Record<SortOption, string> = {
  best_match: "Related",
  distance: "Distance",
  rating: "Verified",
  reviews: "Most Reviewed",
  newest: "Newest",
  alphabetical: "Alphabetical",
};

const SORT_SUBTEXTS: Record<string, string> = {
  best_match: "Show specific specialist healthcare listings",
  distance: "Show healthcare centers within 10 kms",
  rating: "Show platform-verified listings first",
};

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  /** Overrides the trigger's visible label (defaults to "Sort by"). */
  label?: string;
  /** Strips the pill background/border so it can sit flush inside another bar (e.g. the mobile
   * quick action bar), instead of looking like its own standalone control. */
  bare?: boolean;
  className?: string;
  /** Restricts the dropdown to a subset of sort options, in the given order. Defaults to all of them. */
  options?: SortOption[];
}

// Most Reviewed / Newest / Alphabetical were removed from every sort control app-wide — only
// Best Match, Distance, and Highest Rated are meaningful/useful sort orders for this launch.
const DEFAULT_VISIBLE_OPTIONS: SortOption[] = ["best_match", "distance", "rating"];

export default function SortDropdown({ value, onChange, label, bare = false, className, options }: SortDropdownProps) {
  const visibleOptions = options ?? DEFAULT_VISIBLE_OPTIONS;

  return (
    <div className="relative shrink-0">
      {/* Visual Button Display */}
      <button
        type="button"
        className={cn(
          "flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold transition-colors cursor-pointer pointer-events-none",
          bare
            ? "text-slate-600 py-2.5"
            : "px-2 py-0.5 bg-white text-slate-700 border border-slate-200 font-bold rounded-full hover:bg-slate-50 shadow-2xs justify-center w-full",
          className
        )}
      >
        <span className="truncate">{label ?? "Sort by"}</span>
        <ChevronDown className="w-2.5 h-2.5 text-slate-400 shrink-0" />
      </button>

      {/* Invisible overlay native select — works 100% reliably on mobile iOS & Android without overflow clipping */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 text-[10px]"
      >
        {visibleOptions.map((opt) => (
          <option key={opt} value={opt} className="text-slate-900 bg-white font-medium text-[10px]">
            {SORT_LABELS[opt]}
          </option>
        ))}
      </select>
    </div>
  );
}
