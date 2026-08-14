"use client";

import { useEffect, useState } from "react";
import { Store, Building2, LayoutGrid, Users } from "lucide-react";
import { request } from "@/app/lib/api";

export interface PlatformStats {
  businessCount: number;
  userCount: number;
  cityCount: number;
  reviewCount: number;
  categoryCount: number;
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
  if (n >= 1_000) return `${Math.floor(n / 1000)}K+`;
  return `${n}+`;
}

export default function StatsStripBanner({
  initialStats,
}: {
  initialStats?: PlatformStats | null;
} = {}) {
  const [stats, setStats] = useState<PlatformStats | null>(initialStats ?? null);

  useEffect(() => {
    // page.tsx (server) already fetched this — skip the redundant client fetch.
    if (initialStats !== undefined) return;
    request<PlatformStats>("/api/v1/stats")
      .then(setStats)
      .catch(() => setStats(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialStats is only read once, to decide whether to skip this effect entirely
  }, []);

  const items = [
    { icon: Store, value: "800,000+", label: "Businesses" },
    { icon: Building2, value: "500+", label: "Areas Covered" },
    { icon: LayoutGrid, value: stats ? `${stats.categoryCount}+` : "50+", label: "Categories" },
  ];

  return (
    <section className="px-3 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-4xl mx-auto bg-gradient-to-r from-purple-50/90 via-indigo-50/70 to-purple-50/90 border border-purple-100 rounded-lg lg:rounded-xl p-2 lg:p-3.5 shadow-xs">
        <div className="grid grid-cols-3 gap-2 lg:gap-6 divide-x divide-purple-200/50">
          {items.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex items-center justify-center gap-2 lg:gap-3 ${
                  idx !== 0 ? "pl-2 lg:pl-6" : ""
                }`}
              >
                <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-lg bg-purple-100/90 flex items-center justify-center text-purple-600 shrink-0 shadow-2xs">
                  <Icon className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5" />
                </div>
                <div className="overflow-hidden text-left">
                  <div className="text-xs sm:text-sm lg:text-base font-black text-slate-900 leading-none truncate">
                    {stat.value}
                  </div>
                  <div className="text-[9px] sm:text-[11px] font-semibold text-slate-500 mt-0.5 truncate">
                    {stat.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
