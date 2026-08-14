"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, Users, Star, MessageSquare, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { ApiClientError } from "@/app/lib/api";
import { getDashboardProfile, getDashboardLeads, getDashboardReviews, type DashboardProfile, type DashboardLead, type DashboardReview } from "@/app/lib/business-dashboard-api";
import NoBusinessClaimed from "@/app/components/ui/NoBusinessClaimed";

const LEAD_TYPE_LABEL: Record<string, string> = { CALL: "Calls", EMAIL: "Emails", WHATSAPP: "WhatsApp", FORM: "Form Enquiries" };
const LEAD_STATUS_LABEL: Record<string, string> = { NEW: "New", CONTACTED: "Contacted", CLOSED: "Closed" };

export default function BusinessAnalyticsPage() {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [noBusiness, setNoBusiness] = useState(false);
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [leadsError, setLeadsError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<DashboardReview[]>([]);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (isRefresh = false) => {
    if (!accessToken) return;
    if (isRefresh) setRefreshing(true);
    Promise.allSettled([getDashboardProfile(accessToken), getDashboardLeads(accessToken), getDashboardReviews(accessToken)])
      .then(([p, l, r]) => {
        if (p.status === "fulfilled") { setProfile(p.value); setProfileError(null); setNoBusiness(false); }
        else {
          const isNotFound = p.reason instanceof ApiClientError && p.reason.code === "NOT_FOUND";
          setNoBusiness(isNotFound);
          setProfileError(isNotFound ? null : (p.reason?.message ?? "Couldn't load your business profile."));
        }

        if (l.status === "fulfilled") { setLeads(l.value); setLeadsError(null); }
        else setLeadsError(l.reason?.message ?? "Couldn't load leads.");

        if (r.status === "fulfilled") { setReviews(r.value); setReviewsError(null); }
        else setReviewsError(r.reason?.message ?? "Couldn't load reviews.");
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const leadsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => (counts[l.type] = (counts[l.type] ?? 0) + 1));
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([type, count]) => ({ type, count, pct: Math.round((count / max) * 100) }));
  }, [leads]);

  const leadsByStatus = useMemo(() => {
    const counts: Record<string, number> = { NEW: 0, CONTACTED: 0, CLOSED: 0 };
    leads.forEach((l) => (counts[l.status] = (counts[l.status] ?? 0) + 1));
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).map(([status, count]) => ({ status, count, pct: Math.round((count / max) * 100) }));
  }, [leads]);

  const ratingHistogram = useMemo(() => {
    return [5, 4, 3, 2, 1].map((stars) => {
      const count = reviews.filter((r) => r.rating === stars).length;
      return { stars, count, pct: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0 };
    });
  }, [reviews]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (!profile && noBusiness) {
    return (
      <div className="flex flex-col gap-0 lg:gap-6 font-sans">
        <NoBusinessClaimed
          title="No analytics to show yet"
          description="Once you list or claim a business, profile views, lead sources, and rating trends will appear here."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-4 relative z-10">
          {[
            { icon: Eye, label: "Profile Views (all time)" },
            { icon: Users, label: "Total Leads" },
            { icon: Star, label: "Average Rating" },
            { icon: MessageSquare, label: "Total Reviews" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="bg-white p-5 lg:p-4 rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 shadow-none lg:shadow-2xs space-y-2 opacity-70 -mt-[1px] lg:mt-0">
              <Icon className="w-4 h-4 text-slate-400" />
              <div className="text-2xl font-black text-slate-400">—</div>
              <p className="text-[10px] text-slate-400 font-semibold">{label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-center">
        <p className="text-sm font-bold text-slate-700">{profileError ?? "Couldn't load your business profile."}</p>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const SectionError = ({ message }: { message: string }) => (
    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-3">
      <span>{message}</span>
      <button
        onClick={() => load(true)}
        disabled={refreshing}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
        <span>Retry</span>
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-0 lg:gap-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-5 shadow-none lg:shadow-sm shadow-slate-200/50 relative z-10">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-md">
          Business Insights
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Analytics & Insights</h1>
        <p className="text-xs text-slate-500 font-semibold">Real totals from your listing's activity — profile views, leads, and reviews.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 lg:gap-4 relative z-10">
        <div className="bg-white p-5 lg:p-4 rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 shadow-none lg:shadow-2xs space-y-2 -mt-[1px] lg:mt-0">
          <Eye className="w-4 h-4 text-purple-600" />
          <div className="text-2xl font-black text-slate-900">{profile.viewCount.toLocaleString()}</div>
          <p className="text-[10px] text-slate-400 font-semibold">Profile Views (all time)</p>
        </div>
        <div className="bg-white p-5 lg:p-4 rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 shadow-none lg:shadow-2xs space-y-2 -mt-[1px] lg:mt-0">
          <Users className="w-4 h-4 text-emerald-600" />
          <div className="text-2xl font-black text-slate-900">{leadsError ? "—" : leads.length}</div>
          <p className="text-[10px] text-slate-400 font-semibold">{leadsError ? "Leads unavailable" : "Total Leads"}</p>
        </div>
        <div className="bg-white p-5 lg:p-4 rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 shadow-none lg:shadow-2xs space-y-2 -mt-[1px] lg:mt-0">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <div className="text-2xl font-black text-slate-900">{profile.avgRating.toFixed(1)}★</div>
          <p className="text-[10px] text-slate-400 font-semibold">Average Rating</p>
        </div>
        <div className="bg-white p-5 lg:p-4 rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 shadow-none lg:shadow-2xs space-y-2 -mt-[1px] lg:mt-0">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <div className="text-2xl font-black text-slate-900">{profile.reviewCount}</div>
          <p className="text-[10px] text-slate-400 font-semibold">Total Reviews</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-6 relative z-10">
        {/* Leads by Type */}
        <div className="lg:col-span-6 bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-5 shadow-none lg:shadow-sm shadow-slate-200/50 space-y-4 -mt-[1px] lg:mt-0">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Leads by Source</h3>
          {leadsError ? (
            <SectionError message={leadsError} />
          ) : leadsByType.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-4 text-center">No leads yet.</p>
          ) : (
            <div className="space-y-2.5">
              {leadsByType.map((row) => (
                <div key={row.type} className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-28 text-slate-600">{LEAD_TYPE_LABEL[row.type] ?? row.type}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div className="bg-purple-600 h-3 rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-slate-500">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads by Status */}
        <div className="lg:col-span-6 bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-5 shadow-none lg:shadow-sm shadow-slate-200/50 space-y-4 -mt-[1px] lg:mt-0">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Leads by Status</h3>
          {leadsError ? (
            <SectionError message={leadsError} />
          ) : (
          <div className="space-y-2.5">
            {leadsByStatus.map((row) => (
              <div key={row.status} className="flex items-center gap-2 text-xs font-bold">
                <span className="w-28 text-slate-600">{LEAD_STATUS_LABEL[row.status]}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-indigo-500 h-3 rounded-full" style={{ width: `${row.pct}%` }} />
                </div>
                <span className="w-8 text-right text-slate-500">{row.count}</span>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Rating Distribution */}
        <div className="lg:col-span-12 bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-5 shadow-none lg:shadow-sm shadow-slate-200/50 space-y-4 -mt-[1px] lg:mt-0">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-3">Rating Distribution</h3>
          {reviewsError ? (
            <SectionError message={reviewsError} />
          ) : reviews.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-4 text-center">No reviews yet.</p>
          ) : (
            <div className="space-y-2 max-w-xl">
              {ratingHistogram.map((row) => (
                <div key={row.stars} className="flex items-center gap-2 text-xs font-bold">
                  <span className="w-8 text-slate-500">{row.stars}★</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-slate-400">{row.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
