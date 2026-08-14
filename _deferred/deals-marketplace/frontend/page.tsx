"use client";

import { useState } from "react";
import { Search, Clock, Sparkles, Tag } from "lucide-react";

export default function PublicDealsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">

      {/* Deals Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#130d2a] to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-purple-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Exclusive Marketplace Deals</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
            Deals & Offers Marketplace
          </h1>
          <p className="text-xs text-slate-300 font-semibold max-w-md">
            Save big with verified coupons, limited-time discounts, and direct merchant offers.
          </p>
        </div>

        {/* Search Input Bar */}
        <div className="w-full sm:w-80 relative z-10">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search deals, coupons, stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-purple-400 font-semibold"
          />
        </div>
      </div>

      {/* Empty State — no business has published an offer yet */}
      <div className="space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-purple-600" />
          <span>Limited-Time Deals</span>
        </h2>

        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Tag className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black text-slate-900">No active deals right now</h3>
            <p className="text-xs text-slate-500 font-semibold max-w-sm mx-auto">
              Businesses haven't published any offers yet. Check back soon, or explore the full directory in the meantime.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
