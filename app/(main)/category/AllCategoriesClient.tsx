"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Stethoscope, ChevronRight } from "lucide-react";
import CategoryStrip from "@/app/components/sections/CategoryStrip";
import CityPickerPill from "@/app/components/layout/CityPickerPill";
import { type CategoryOption } from "@/app/lib/search-api";

export default function AllCategoriesPage({
  initialCategories,
}: {
  initialCategories: CategoryOption[];
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [categories] = useState<CategoryOption[]>(initialCategories);
  const [loading] = useState(false);

  const filteredCategories = categories.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="bg-slate-50/60 min-h-screen flex flex-col w-full">

      {/* Search Bar Container — Homepage Pattern */}
      <div className="bg-white border-b border-slate-200/90 py-3 px-4 shadow-2xs w-full flex items-center justify-center rounded-none">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-purple-300/80 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/10 p-1.5 sm:p-2 flex items-center gap-2 transition-all">
          <div className="flex-1 flex items-center px-3.5 py-1">
            <input
              type="text"
              placeholder="Search Doctors, Hospitals, Clinics, Diagnostic Labs, Pharmacies..."
              value={searchTerm}
              onChange={(e) => {
                const v = e.target.value;
                setSearchTerm(v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
              }}
              autoCapitalize="words"
              className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none capitalize"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 shrink-0 hidden sm:block" />

          <div className="shrink-0 hidden sm:block">
            <CityPickerPill size="sm" />
          </div>

          <button
            aria-label="Search"
            className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Category Strip Carousel */}
      <div className="bg-white border-b border-slate-200/90 -mt-[1px] py-2.5 w-full space-y-1.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Featured Healthcare Sectors</h3>
        <CategoryStrip roundedNone />
      </div>

      {/* Large Grid of All Categories */}
      <div className="bg-white rounded-none border-b border-slate-200/90 -mt-[1px] py-4 w-full space-y-3 flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-6">
          Browse All Healthcare Specialties & Categories
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-slate-100 overflow-hidden w-full">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 border-r border-b border-slate-100 rounded-none animate-pulse" />
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-slate-100 overflow-hidden w-full">
            {filteredCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="flex items-center justify-between px-6 py-5 rounded-none border-r border-b border-slate-100 hover:border-purple-200 hover:bg-purple-50/20 transition-all duration-300 group cursor-pointer shadow-2xs hover:shadow-xs min-w-0"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Stethoscope className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 pr-2">
                    <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                      {cat.name}
                    </h4>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 group-hover:text-purple-600 transition-colors" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 font-medium px-6">No categories match &quot;{searchTerm}&quot;.</p>
        )}
      </div>

    </div>
  );
}
