"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, Loader2 } from "lucide-react";
import { AdminMetricCard, type AdminMetric } from "../components/AdminMetricCard";
import { getAdminAnalytics, type AdminAnalytics } from "../lib/admin-api";

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminAnalytics()
      .then(setAnalytics)
      .catch((err) => setError(err.message ?? "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error || !analytics) {
    return <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">{error ?? "No analytics data"}</div>;
  }

  const metrics: AdminMetric[] = [
    { title: "Total Search Queries", value: analytics.totalSearches.toLocaleString(), description: "Total recorded search volume", icon: "Building2" },
    { title: "Profile Views", value: analytics.totalProfileViews.toLocaleString(), description: "Business detail page impressions", icon: "Users" },
    { title: "Total Leads", value: analytics.totalLeads.toLocaleString(), description: "Calls, WhatsApp, email & form leads", icon: "Zap" },
    { title: "Claim Conversion Rate", value: `${analytics.claimConversionRate.toFixed(1)}%`, description: "Unclaimed to verified claims", icon: "ShieldCheck" },
  ];

  const subcategoriesHeading = analytics.topSubcategoriesSource === "listing_counts" ? "Top Subcategories by Listings" : "Top Searched Subcategories";
  const citiesHeading = analytics.topCitiesSource === "listing_counts" ? "Top Cities by Listings" : "Top Active Cities by Traffic";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            <span>Platform Telemetry & Search Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Aggregated platform performance, top search terms, and category conversion rates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <AdminMetricCard key={idx} metric={m} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <h2 className="text-base font-black text-white">{subcategoriesHeading}</h2>
          <div className="space-y-3 text-xs font-semibold">
            {analytics.topSubcategories.length === 0 && <p className="text-slate-500">No data available yet.</p>}
            {analytics.topSubcategories.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-white font-extrabold">{item.name}</span>
                <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <h2 className="text-base font-black text-white">{citiesHeading}</h2>
          <div className="space-y-3 text-xs font-semibold">
            {analytics.topCities.length === 0 && <p className="text-slate-500">No data available yet.</p>}
            {analytics.topCities.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800">
                <span className="text-white font-extrabold">{item.name}</span>
                <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">{item.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
