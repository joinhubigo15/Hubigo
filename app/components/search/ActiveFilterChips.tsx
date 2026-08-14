"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  getCategories,
  getCities,
  type CategoryOption,
  type CityOption,
  type SearchFilters,
} from "@/app/lib/search-api";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  filters: SearchFilters;
  onChange: (patch: Partial<SearchFilters>) => void;
}

const PRICE_LABEL: Record<string, string> = {
  budget: "₹ Budget",
  moderate: "₹₹ Moderate",
  premium: "₹₹₹ Premium",
  luxury: "₹₹₹₹ Luxury",
};

const TIER_LABEL: Record<string, string> = { elite: "Elite", premium: "Premium", basic: "Basic" };

export default function ActiveFilterChips({ filters, onChange }: ActiveFilterChipsProps) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => { });
    getCities().then(setCities).catch(() => { });
  }, []);

  const categoryName = categories.find((c) => c.slug === filters.category)?.name;
  const subcategoryName = categories
    .flatMap((c) => c.subcategories)
    .find((s) => s.slug === filters.subcategory)?.name;
  const cityName = cities.find((c) => c.slug === filters.city)?.name;

  const chips: Chip[] = [];

  if (filters.category) {
    chips.push({
      key: "category",
      label: categoryName ?? filters.category,
      onRemove: () => onChange({ category: undefined, subcategory: undefined }),
    });
  }
  if (filters.subcategory) {
    chips.push({
      key: "subcategory",
      label: subcategoryName ?? filters.subcategory,
      onRemove: () => onChange({ subcategory: undefined }),
    });
  }
  if (filters.city) {
    chips.push({
      key: "city",
      label: cityName ?? filters.city,
      onRemove: () => onChange({ city: undefined, locality: undefined }),
    });
  }
  if (filters.locality) {
    chips.push({ key: "locality", label: filters.locality, onRemove: () => onChange({ locality: undefined }) });
  }
  if (filters.pincode) {
    chips.push({ key: "pincode", label: filters.pincode, onRemove: () => onChange({ pincode: undefined }) });
  }
  if (filters.openNow) {
    chips.push({ key: "openNow", label: "Open Now", onRemove: () => onChange({ openNow: undefined }) });
  }
  if (filters.verified) {
    chips.push({ key: "verified", label: "Verified", onRemove: () => onChange({ verified: undefined }) });
  }
  if (filters.offers) {
    chips.push({ key: "offers", label: "Has Offers", onRemove: () => onChange({ offers: undefined }) });
  }
  if (filters.minRating) {
    chips.push({
      key: "minRating",
      label: `${filters.minRating}+ ★`,
      onRemove: () => onChange({ minRating: undefined }),
    });
  }
  for (const p of filters.price ?? []) {
    chips.push({
      key: `price-${p}`,
      label: PRICE_LABEL[p],
      onRemove: () => onChange({ price: filters.price!.filter((x) => x !== p) }),
    });
  }
  for (const a of filters.amenities ?? []) {
    chips.push({
      key: `amenity-${a}`,
      label: a.replace(/-/g, " "),
      onRemove: () => onChange({ amenities: filters.amenities!.filter((x) => x !== a) }),
    });
  }
  for (const t of filters.tier ?? []) {
    chips.push({
      key: `tier-${t}`,
      label: TIER_LABEL[t],
      onRemove: () => onChange({ tier: filters.tier!.filter((x) => x !== t) }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {chips.map((chip) => (
        <button
          key={chip.key}
          onClick={chip.onRemove}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100/60 hover:bg-purple-100 transition-colors cursor-pointer whitespace-nowrap capitalize"
        >
          {chip.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
