"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Store, ChevronRight } from "lucide-react";
import CategoryStrip from "@/app/components/sections/CategoryStrip";
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

      {/* Search Bar Container */}
      <div className="bg-white border-b border-slate-200/90 py-2.5 px-4 shadow-2xs w-full flex items-center justify-center rounded-none">
        <div className="w-full max-w-xl relative">
          <Search className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search categories (e.g. Hospital, Spa)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Category Strip Carousel */}
      <div className="bg-white border-b border-slate-200/90 -mt-[1px] py-2.5 w-full space-y-1.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-4">Featured Categories</h3>
        <CategoryStrip roundedNone />
      </div>

      {/* Large Grid of All Categories */}
      <div className="bg-white rounded-none border-b border-slate-200/90 -mt-[1px] py-4 w-full space-y-3 flex-1">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-6">
          Browse All Categories
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
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-4 h-4" />
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
