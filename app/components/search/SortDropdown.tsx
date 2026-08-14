"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { SortOption } from "@/app/lib/search-api";

const SORT_LABELS: Record<SortOption, string> = {
  best_match: "Best Match",
  distance: "Distance",
  rating: "Highest Rated",
  reviews: "Most Reviewed",
  newest: "Newest",
  alphabetical: "Alphabetical",
};

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  /** Overrides the trigger's visible label (defaults to "Sort: {current option}"). */
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
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 text-xs font-bold cursor-pointer transition-colors",
          bare
            ? "text-slate-600 py-2.5"
            : "px-2 sm:px-3 py-1 bg-white text-slate-600 border border-slate-200 font-bold rounded-full hover:bg-slate-50 shadow-2xs text-[10px] sm:text-xs justify-center w-full",
          className
        )}
      >
        <span className="truncate">{label ?? `Sort: ${SORT_LABELS[value]}`}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0 mt-1.5 w-48 bg-white border border-slate-100 rounded-xl shadow-lg py-1 z-40">
          {visibleOptions.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer",
                value === option ? "text-purple-600 font-bold" : "text-slate-700"
              )}
            >
              {SORT_LABELS[option]}
              {value === option && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
