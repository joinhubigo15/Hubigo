"use client";

import { useEffect, useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  getCategories,
  getCities,
  getLocalities,
  type CategoryOption,
  type CityOption,
  type LocalityOption,
  type SearchFilters,
} from "@/app/lib/search-api";

interface FiltersPanelProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
  onReset: () => void;
  /** Whether any platform-verified business matches the current filters — disables the
   * "Verified Only" checkbox rather than offering a filter that would zero out results. */
  hasVerifiedMatches?: boolean;
  className?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 border-b border-slate-100 last:border-b-0">
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
      {children}
    </div>
  );
}

export default function FiltersPanel({ filters, onChange, onReset, hasVerifiedMatches, className }: FiltersPanelProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [localities, setLocalities] = useState<LocalityOption[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
    getCities().then(setCities).catch(() => {});
  }, []);

  const displayLocalities = filters.city ? localities : [];

  useEffect(() => {
    if (!filters.city) return;
    getLocalities(filters.city).then(setLocalities).catch(() => {});
  }, [filters.city]);

  const selectedCategory = categories.find((c) => c.slug === filters.category);
  // Never disable a checkbox the user has already turned on — only gates newly enabling it.
  const verifiedDisabled = hasVerifiedMatches === false && !filters.verified;

  return (
    <aside className={cn("bg-white rounded-2xl lg:rounded-none border border-slate-100 lg:border-r lg:border-slate-100 lg:border-y-0 lg:border-l-0 shadow-xs lg:shadow-none p-5 flex flex-col", className)}>
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-purple-600" />
          Filters
        </h3>
        <button onClick={onReset} className="text-xs font-semibold text-purple-600 hover:underline cursor-pointer">
          Reset All
        </button>
      </div>

      <Section title="Category">
        <div className="relative">
          <select
            value={filters.category ?? ""}
            onChange={(e) => onChange({ category: e.target.value || undefined, subcategory: undefined })}
            className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-purple-500 cursor-pointer pr-8"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </Section>

      {selectedCategory && selectedCategory.subcategories.length > 0 && (
        <Section title="Subcategory">
          <div className="flex flex-wrap gap-1.5">
            {selectedCategory.subcategories.map((sub) => (
              <button
                key={sub.slug}
                onClick={() =>
                  onChange({ subcategory: filters.subcategory === sub.slug ? undefined : sub.slug })
                }
                className={cn(
                  "px-2.5 py-1 text-[11px] font-semibold rounded-full border transition-colors cursor-pointer",
                  filters.subcategory === sub.slug
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                {sub.name}
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Location">
        <div className="relative">
          <select
            value={filters.city ?? ""}
            onChange={(e) => onChange({ city: e.target.value || undefined, locality: undefined })}
            className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-purple-500 cursor-pointer pr-8"
          >
            <option value="">All Cities</option>
            {cities.map((city) => (
              <option key={city.slug} value={city.slug}>
                {city.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {displayLocalities.length > 0 && (
          <div className="relative mt-2">
            <select
              value={filters.locality ?? ""}
              onChange={(e) => onChange({ locality: e.target.value || undefined })}
              className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 outline-none focus:border-purple-500 cursor-pointer pr-8"
            >
              <option value="">All Areas</option>
              {displayLocalities.map((loc) => (
                <option key={loc.slug} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        <input
          type="text"
          value={filters.pincode ?? ""}
          onChange={(e) => onChange({ pincode: e.target.value || undefined })}
          placeholder="Pincode"
          maxLength={6}
          className="w-full mt-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-purple-500"
        />
      </Section>

      <Section title="Availability">
        <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.openNow ?? false}
            onChange={(e) => onChange({ openNow: e.target.checked || undefined })}
            className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
          />
          Open Now
        </label>
        <label
          className={cn(
            "flex items-center gap-2.5 text-xs font-medium select-none",
            verifiedDisabled ? "text-slate-400 cursor-not-allowed" : "text-slate-700 cursor-pointer"
          )}
          title={verifiedDisabled ? "No platform-verified businesses match these filters yet" : undefined}
        >
          <input
            type="checkbox"
            checked={filters.verified ?? false}
            disabled={verifiedDisabled}
            onChange={(e) => onChange({ verified: e.target.checked || undefined })}
            className="w-4 h-4 rounded accent-purple-600 cursor-pointer disabled:cursor-not-allowed"
          />
          Verified Businesses Only
        </label>
      </Section>

      <Section title="Minimum Rating">
        <div className="grid grid-cols-4 gap-1.5">
          {[4.5, 4.0, 3.5, 3.0].map((star) => (
            <button
              key={star}
              onClick={() => onChange({ minRating: filters.minRating === star ? undefined : star })}
              className={cn(
                "py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer",
                filters.minRating === star
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-purple-200"
              )}
            >
              {star}+★
            </button>
          ))}
        </div>
      </Section>

    </aside>
  );
}
