"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Users,
  Star,
  ShieldCheck,
  Edit,
  Camera,
  MessageSquare,
  MessageCircle,
  CreditCard,
  Phone,
  Loader2,
  RefreshCw,
  MapPin,
  Zap,
  ChevronRight,
  Megaphone,
  Building2,
} from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { ApiClientError } from "@/app/lib/api";
import {
  getDashboardProfile,
  getDashboardLeads,
  getDashboardReviews,
  type DashboardProfile,
  type DashboardLead,
  type DashboardReview,
} from "@/app/lib/business-dashboard-api";
import NoBusinessClaimed from "@/app/components/ui/NoBusinessClaimed";
import VerifiedBadge from "@/app/components/ui/VerifiedBadge";
import { cn } from "@/app/lib/utils";

const PLAN_LABEL: Record<string, string> = { basic: "Basic Plan", premium: "Premium Plan", elite: "Elite Plan" };

const LEAD_TYPE_ICON: Record<string, typeof Phone> = { CALL: Phone, WHATSAPP: MessageCircle, EMAIL: MessageSquare, FORM: MessageSquare };

/** Real per-day lead counts for the last 7 days (including today) — no fabricated data, days
 * with zero leads just show zero. */
function buildDailyActivity(leads: DashboardLead[], daysBack: number, offsetDays = 0) {
  const days: { key: string; label: string; count: number; isToday: boolean }[] = [];
  const now = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i - offsetDays);
    const key = d.toDateString();
    days.push({ key, label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: 0, isToday: i === 0 && offsetDays === 0 });
  }
  const byKey = new Map(days.map((d) => [d.key, d]));
  for (const lead of leads) {
    const key = new Date(lead.createdAt).toDateString();
    const bucket = byKey.get(key);
    if (bucket) bucket.count += 1;
  }
  return days;
}

export default function BusinessOverviewPage() {
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

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;
    const checks = [
      Boolean(profile.description),
      Boolean(profile.logoUrl),
      Boolean(profile.coverImageUrl),
      profile.media.length > 0,
      profile.services.length > 0,
      profile.amenities.length > 0,
      profile.hours.some((h) => !h.isClosed),
      Boolean(profile.phone),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const recentLeads = leads.slice(0, 2);
  const recentReviews = reviews.slice(0, 2);
  const pendingReplyCount = reviews.filter((r) => !r.ownerReply).length;
  const callLeadsCount = leads.filter((l) => l.type === "CALL").length;
  const activity = useMemo(() => buildDailyActivity(leads, 7), [leads]);
  const previousWeekActivity = useMemo(() => buildDailyActivity(leads, 7, 7), [leads]);
  const maxActivity = Math.max(1, ...activity.map((d) => d.count));
  const weekTotal = activity.reduce((sum, d) => sum + d.count, 0);
  const previousWeekTotal = previousWeekActivity.reduce((sum, d) => sum + d.count, 0);
  const weekTrendPct = previousWeekTotal > 0 ? Math.round(((weekTotal - previousWeekTotal) / previousWeekTotal) * 100) : weekTotal > 0 ? 100 : 0;

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
          title="Welcome to your Business Hub"
          description="You haven't claimed or listed a business yet. Add your business to start tracking views, leads, and reviews here."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 sm:gap-4 relative z-10">
          {[
            { icon: Eye, label: "Profile Views", color: "text-purple-600" },
            { icon: Users, label: "Total Leads", color: "text-emerald-600" },
            { icon: Star, label: "Average Rating", color: "text-amber-500" },
            { icon: MessageSquare, label: "Total Reviews", color: "text-indigo-600" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="bg-white p-4 lg:p-3.5 rounded-none border border-slate-200/90 shadow-none space-y-1 opacity-70 -mt-[1px] -ml-[1px] lg:mt-0 lg:ml-0">
              <Icon className={`w-4 h-4 ${color}`} />
              <div className="text-lg font-black text-slate-400">—</div>
              <div className="text-[10px] font-bold text-slate-400">{label}</div>
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
          className="flex items-center gap-2 px-4 py-2 rounded-none bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-none cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  /** Real line chart of the last 7 days of lead activity — shared by mobile and desktop. */
  const LeadActivityChart = ({ height = 128 }: { height?: number }) => {
    if (leadsError) return <SectionError message={leadsError} />;
    if (weekTotal === 0) {
      return (
        <p className="text-xs text-slate-400 font-semibold py-4 text-center">
          No leads yet this week — once a customer calls, messages, or fills your enquiry form, it&apos;ll show up here.
        </p>
      );
    }

    const points = activity.map((d) => d);
    const chartX = (i: number) => 30 + (i / (points.length - 1)) * (700 - 30);
    const chartY = (count: number) => 100 - (count / maxActivity) * 90;
    const linePoints = points.map((p, i) => `${chartX(i)},${chartY(p.count)}`).join(" ");
    const areaPoints = `${chartX(0)},100 ${linePoints} ${chartX(points.length - 1)},100`;

    return (
      <svg viewBox="0 0 720 140" className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="leadActivityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t) => (
          <line key={t} x1="30" x2="700" y1={10 + t * 90} y2={10 + t * 90} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        {[0, 0.5, 1].map((t) => (
          <text key={t} x="5" y={14 + t * 90} fontSize="10" fill="#94a3b8" fontWeight="600">
            {Math.ceil(maxActivity * (1 - t))}
          </text>
        ))}
        <polygon points={areaPoints} fill="url(#leadActivityFill)" />
        <polyline points={linePoints} fill="none" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => {
          const x = chartX(i);
          const y = chartY(p.count);
          return (
            <g key={p.key}>
              {p.count > 0 && (
                <text x={x} y={y - 8} fontSize="10" fontWeight="700" fill="#7c3aed" textAnchor="middle">
                  {p.count}
                </text>
              )}
              <circle cx={x} cy={y} r={p.isToday ? 3.5 : 2.5} fill={p.isToday ? "#7c3aed" : "#ffffff"} stroke="#7c3aed" strokeWidth="1.5" />
              <text x={x} y="112" fontSize="9.5" fill={p.isToday ? "#7c3aed" : "#94a3b8"} fontWeight={p.isToday ? "700" : "500"} textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const SectionError = ({ message }: { message: string }) => (
    <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center justify-between gap-3">
      <span>{message}</span>
      <button
        onClick={() => load(true)}
        disabled={refreshing}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-rose-100 hover:bg-rose-200 transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
        <span>Retry</span>
      </button>
    </div>
  );

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/business/${profile.slug}` : `/business/${profile.slug}`;
  const whatsappShareHref = `https://wa.me/?text=${encodeURIComponent(`Check out ${profile.name} on Hubigo: ${shareUrl}`)}`;

  return (
    <div className="flex flex-col gap-0 lg:gap-6 font-sans">
      {/* ================= Mobile Layout (<lg) — matches the reference design ================= */}
      <div className="lg:hidden flex flex-col gap-4 p-4 bg-[#f8fafc]">
        {/* Business Photo Card */}
        <div className="bg-white rounded-none border border-slate-200/60 p-4 shadow-none space-y-3">
          <div className="flex gap-4">
            <Link href="/business-dashboard/media" className="relative w-24 h-24 rounded-none overflow-hidden bg-slate-100 shrink-0 group">
              {profile.coverImageUrl ? (
                <img src={profile.coverImageUrl} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300">
                  <Building2 className="w-8 h-8" />
                </div>
              )}
              <span className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-none bg-black/60 flex items-center justify-center text-white backdrop-blur-md">
                <Camera className="w-3.5 h-3.5" />
              </span>
            </Link>
            <div className="flex-1 min-w-0 space-y-1.5 pt-1">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-extrabold text-base text-slate-900 truncate tracking-tight">{profile.name}</h1>
                {profile.isVerified && <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded-none whitespace-nowrap">Verified</span>}
              </div>
              <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{profile.address}</span>
              </p>
              <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-purple-600 text-purple-600" />
                <span className="text-purple-600">{profile.avgRating.toFixed(1)}</span>
                <span className="text-slate-500 font-medium">({profile.reviewCount.toLocaleString()} Reviews)</span>
              </p>
            </div>
          </div>

          {profile.planTier !== "basic" && (
            <div className="flex items-center justify-between bg-emerald-50/50 text-emerald-600 rounded-none px-3 py-2.5 mt-2">
              <span className="flex items-center gap-2 font-bold text-[11px]">
                <Zap className="w-3.5 h-3.5 fill-current" />
                30 Days {PLAN_LABEL[profile.planTier] ?? profile.planTier} Active
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        {/* Stat Tiles */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-purple-50/50 rounded-none p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-1.5">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <div className="text-[13px] font-black text-slate-900 leading-tight">{leadsError ? "—" : leads.length}</div>
              <div className="text-[9px] font-bold text-slate-500 leading-tight">Total Leads</div>
            </div>
          </div>
          <div className="bg-emerald-50/50 rounded-none p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-1.5">
            <Phone className="w-5 h-5 text-emerald-600" />
            <div>
              <div className="text-[13px] font-black text-slate-900 leading-tight">{leadsError ? "—" : callLeadsCount}</div>
              <div className="text-[9px] font-bold text-slate-500 leading-tight">Phone Clicks</div>
            </div>
          </div>
          <div className="bg-blue-50/50 rounded-none p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-1.5">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <div className="text-[13px] font-black text-slate-900 leading-tight">{profile.viewCount.toLocaleString()}</div>
              <div className="text-[9px] font-bold text-slate-500 leading-tight">Profile Views</div>
            </div>
          </div>
          <div className="bg-orange-50/50 rounded-none p-2 sm:p-2.5 flex flex-col items-center justify-center text-center space-y-1.5">
            <MessageSquare className="w-5 h-5 text-orange-600" />
            <div>
              <div className="text-[13px] font-black text-slate-900 leading-tight">{profile.reviewCount.toLocaleString()}</div>
              <div className="text-[9px] font-bold text-slate-500 leading-tight">Reviews</div>
            </div>
          </div>
        </div>

        {/* Lead Activity Chart — real per-day counts from actual leads, last 7 days */}
        <div className="bg-white rounded-none border border-slate-200/60 p-5 shadow-none space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[10px]">🔥</span>
              Lead Activity
            </span>
            <span className="text-[10px] font-bold text-slate-500">Last 7 Days</span>
          </div>

          {!leadsError && (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">{weekTotal}</span>
              <span className="text-[11px] font-semibold text-slate-500">{weekTotal === 1 ? "lead" : "leads"} this week</span>
              {previousWeekTotal > 0 && (
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-none", weekTrendPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                  {weekTrendPct >= 0 ? "+" : ""}{weekTrendPct}% vs last week
                </span>
              )}
            </div>
          )}

          <LeadActivityChart height={128} />
        </div>

        {/* Boost Visibility / Share on WhatsApp */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/business-dashboard/profile" className="flex items-center justify-between bg-purple-50/70 rounded-none p-3 hover:bg-purple-100 transition-colors">
            <span className="flex items-center gap-2.5 min-w-0">
              <Megaphone className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="min-w-0">
                <span className="block font-bold text-[11px] text-slate-900 truncate">Boost Visibility</span>
                <span className="block text-[9px] font-semibold text-slate-500 truncate">Get more customers</span>
              </span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-900 shrink-0 opacity-60" />
          </Link>
          <a href={whatsappShareHref} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-purple-50/70 rounded-none p-3 hover:bg-purple-100 transition-colors">
            <span className="flex items-center gap-2.5 min-w-0">
              <MessageCircle className="w-5 h-5 text-purple-600 shrink-0" />
              <span className="min-w-0">
                <span className="block font-bold text-[11px] text-slate-900 truncate">Share on WhatsApp</span>
                <span className="block text-[9px] font-semibold text-slate-500 truncate">Bring more leads</span>
              </span>
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-purple-900 shrink-0 opacity-60" />
          </a>
        </div>

        {/* Recent Enquiries */}
        <div className="space-y-3 pb-16">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-[15px] text-slate-900">Recent Enquiries</h3>
            <Link href="/business-dashboard/leads" className="text-[11px] font-bold text-purple-700">
              View All
            </Link>
          </div>

          {leadsError ? (
            <SectionError message={leadsError} />
          ) : recentLeads.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold text-center py-6 bg-white rounded-none border border-slate-200/90">No enquiries yet.</p>
          ) : (
            recentLeads.map((l) => {
              const Icon = LEAD_TYPE_ICON[l.type] ?? MessageSquare;
              const isCall = l.type === "CALL";
              const isWhatsapp = l.type === "WHATSAPP";
              return (
                <div key={l.id} className="bg-white rounded-none border border-slate-200/60 p-3.5 flex items-center gap-3 shadow-none">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", isCall || isWhatsapp ? "bg-emerald-50/70 text-emerald-600" : "bg-purple-50/70 text-purple-600")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <p className="font-bold text-[13px] text-slate-900 truncate">{l.user?.name ?? "Anonymous"}</p>
                    <p className="text-[11px] text-slate-500 font-medium truncate">{l.message ?? `Sent a ${l.type.toLowerCase()} enquiry`}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {l.status === "NEW" && (
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-none">New</span>
                    )}
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      {new Date(l.createdAt).toLocaleDateString() === new Date().toLocaleDateString()
                        ? new Date(l.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "Yesterday"}
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ================= Desktop Layout (≥lg) — Unified Split View ================= */}
      <div className="hidden lg:flex flex-col w-full bg-white flex-1 min-h-[calc(100vh-64px)]">
        {/* Top Banner: Business Health Header */}
        <div className="px-8 py-8 border-b border-slate-200/90 bg-white sticky top-0 z-10 flex flex-row items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {profile.isVerified && (
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-none flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Verified Business
                </span>
              )}
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 border border-purple-200 px-2.5 py-0.5 rounded-none">
                {PLAN_LABEL[profile.planTier] ?? profile.planTier}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 mt-1">{profile.name}</h1>
            <p className="text-xs text-slate-500 font-semibold">{profile.address}</p>
          </div>

          {/* Profile Completion Bar */}
          <div className="w-72 space-y-2 shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-800">Profile Completion</span>
              <span className="font-black text-purple-600">{profileCompletion}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold flex items-center justify-between pt-0.5">
              <span>Fill in missing details to reach 100%</span>
              <Link href="/business-dashboard/profile" className="text-purple-600 font-bold hover:underline">
                Complete
              </Link>
            </p>
          </div>
        </div>

        {/* Main Split Layout */}
        <div className="flex flex-row flex-1 min-h-0">
          
          {/* Left Column: Metrics & Actions */}
          <div className="flex-1 flex flex-col bg-white">
            
            {/* Core Metric Cards Grid (Unified Borders) */}
            <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 bg-white">
              <div className="p-6 space-y-2 group hover:bg-slate-50/50 transition-colors">
                <Eye className="w-5 h-5 text-purple-600 mb-2" />
                <div className="text-2xl font-black text-slate-900 leading-none">{profile.viewCount.toLocaleString()}</div>
                <div className="text-xs font-bold text-slate-500">Profile Views</div>
              </div>
              <div className="p-6 space-y-2 group hover:bg-slate-50/50 transition-colors">
                <Users className="w-5 h-5 text-emerald-600 mb-2" />
                <div className="text-2xl font-black text-slate-900 leading-none">{leadsError ? "—" : leads.length}</div>
                <div className="text-xs font-bold text-slate-500">{leadsError ? "Leads unavailable" : "Total Leads"}</div>
              </div>
              <div className="p-6 space-y-2 group hover:bg-slate-50/50 transition-colors">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500 mb-2" />
                <div className="text-2xl font-black text-slate-900 leading-none">{profile.avgRating.toFixed(1)}★</div>
                <div className="text-xs font-bold text-slate-500">Average Rating</div>
              </div>
              <div className="p-6 space-y-2 group hover:bg-slate-50/50 transition-colors">
                <MessageSquare className="w-5 h-5 text-indigo-600 mb-2" />
                <div className="text-2xl font-black text-slate-900 leading-none">{profile.reviewCount}</div>
                <div className="text-xs font-bold text-slate-500">Total Reviews</div>
              </div>
            </div>

            {/* Lead Activity Chart — real per-day counts from actual leads, last 7 days */}
            <div className="p-8 border-b border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[10px]">🔥</span>
                  Lead Activity
                </h3>
                <span className="text-[11px] font-bold text-slate-500">Last 7 Days</span>
              </div>

              {!leadsError && (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{weekTotal}</span>
                  <span className="text-xs font-semibold text-slate-500">{weekTotal === 1 ? "lead" : "leads"} this week</span>
                  {previousWeekTotal > 0 && (
                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-none", weekTrendPct >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600")}>
                      {weekTrendPct >= 0 ? "+" : ""}{weekTrendPct}% vs last week
                    </span>
                  )}
                </div>
              )}

              <div className="max-w-xl">
                <LeadActivityChart height={160} />
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="p-8 flex-1 flex flex-col gap-6">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-4">
                <Link href="/business-dashboard/profile" className="p-4 bg-slate-50 border border-slate-200/60 rounded-none hover:border-purple-300 hover:bg-purple-50 transition-all flex flex-row items-center gap-4 group">
                  <div className="w-10 h-10 rounded-none bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Edit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Edit Profile</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Update details & hours</p>
                  </div>
                </Link>

                <Link href="/business-dashboard/media" className="p-4 bg-slate-50 border border-slate-200/60 rounded-none hover:border-purple-300 hover:bg-purple-50 transition-all flex flex-row items-center gap-4 group">
                  <div className="w-10 h-10 rounded-none bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-200 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Upload Photos</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{profile.media.length} photos so far</p>
                  </div>
                </Link>

                <Link href="/business-dashboard/reviews" className="p-4 bg-slate-50 border border-slate-200/60 rounded-none hover:border-purple-300 hover:bg-purple-50 transition-all flex flex-row items-center gap-4 group">
                  <div className="w-10 h-10 rounded-none bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Reply Reviews</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{pendingReplyCount} pending replies</p>
                  </div>
                </Link>

                <Link href="/business-dashboard/leads" className="p-4 bg-slate-50 border border-slate-200/60 rounded-none hover:border-purple-300 hover:bg-purple-50 transition-all flex flex-row items-center gap-4 group">
                  <div className="w-10 h-10 rounded-none bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">View CRM Leads</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{leads.filter((l) => l.status === "NEW").length} new leads</p>
                  </div>
                </Link>

                <Link href="/business-dashboard/settings" className="p-4 bg-slate-50 border border-slate-200/60 rounded-none hover:border-purple-300 hover:bg-purple-50 transition-all flex flex-row items-center gap-4 group">
                  <div className="w-10 h-10 rounded-none bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">Account Settings</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{PLAN_LABEL[profile.planTier] ?? profile.planTier}</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Recent Activity Split */}
          <div className="w-80 lg:w-96 bg-slate-50/50 border-l border-slate-200/90 p-8 shrink-0 flex flex-col h-full sticky top-[105px]">
            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 mb-6">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Recent Activity</h3>
              <Link href="/business-dashboard/leads" className="text-[11px] font-bold text-purple-600 hover:underline">
                View All
              </Link>
            </div>

            {leadsError || reviewsError ? (
              <SectionError message={[leadsError, reviewsError].filter(Boolean).join(" ")} />
            ) : recentLeads.length === 0 && recentReviews.length === 0 ? (
              <p className="text-sm text-slate-500 font-semibold py-8 text-center">No activity yet.</p>
            ) : (
              <div className="space-y-6">
                {recentLeads.map((l) => (
                  <div key={l.id} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{l.user?.name ?? "Anonymous"} sent a {l.type.toLowerCase()} lead</p>
                      {l.message && <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">{l.message}</p>}
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{new Date(l.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
                {recentReviews.map((r) => (
                  <div key={r.id} className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
                      <Star className="w-4 h-4 fill-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="font-extrabold text-sm text-slate-900 truncate">New {r.rating}-star review from {r.user?.name ?? r.authorName ?? "Anonymous"}</p>
                      {r.comment && <p className="text-xs text-slate-500 font-semibold truncate mt-0.5">&ldquo;{r.comment}&rdquo;</p>}
                      <span className="text-[10px] text-slate-400 font-medium block mt-1">{new Date(r.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
