"use client";

import React from "react";
import {
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  FileCheck,
  Star,
  Users,
  CreditCard,
  Zap,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export interface AdminMetric {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
  description: string;
  icon: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Building2,
  ShieldCheck,
  FileCheck,
  Star,
  Users,
  CreditCard,
  Zap,
};

export const AdminMetricCard: React.FC<{ metric: AdminMetric }> = ({ metric }) => {
  const Icon = ICON_MAP[metric.icon] || Building2;
  const isUp = metric.trend === "up";

  return (
    <div className="p-5 rounded-3xl bg-[#0c101c] border border-slate-800/90 shadow-xl space-y-3.5 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors pointer-events-none" />

      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
          {metric.title}
        </span>
        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between pt-1">
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {metric.value}
        </h3>

        {metric.change && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full border",
              isUp
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            )}
          >
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{metric.change}</span>
          </div>
        )}
      </div>

      <p className="text-[11px] text-slate-500 font-semibold leading-relaxed border-t border-slate-800/60 pt-2">
        {metric.description}
      </p>
    </div>
  );
};
