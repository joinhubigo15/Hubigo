"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  FileCheck,
  ChevronRight,
  Activity,
  UploadCloud,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { AdminMetricCard, type AdminMetric } from "./components/AdminMetricCard";
import { AdminDataTable } from "./components/AdminDataTable";
import { cn } from "@/app/lib/utils";
import {
  getAdminDashboardMetrics,
  getAdminClaims,
  getAdminAuditLogs,
  getAdminBusinesses,
  type AdminDashboardMetrics,
  type AdminClaim,
  type AdminAuditLog,
  type AdminBusinessRow,
} from "./lib/admin-api";

// One flaky section (e.g. a transient DB blip) must never blank the whole dashboard — each
// section fetches and fails independently via Promise.allSettled, with its own inline retry.
export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [claims, setClaims] = useState<AdminClaim[]>([]);
  const [claimsError, setClaimsError] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [businessesError, setBusinessesError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    Promise.allSettled([
      getAdminDashboardMetrics(),
      getAdminClaims(),
      getAdminAuditLogs({ pageSize: 5 }),
      getAdminBusinesses({ pageSize: 10 }),
    ]).then(([m, c, logs, biz]) => {
      if (m.status === "fulfilled") { setMetrics(m.value); setMetricsError(null); }
      else setMetricsError(m.reason?.message ?? "Couldn't load platform metrics");

      if (c.status === "fulfilled") { setClaims(c.value); setClaimsError(null); }
      else setClaimsError(c.reason?.message ?? "Couldn't load the claims queue");

      if (logs.status === "fulfilled") { setAuditLogs(logs.value.items); setAuditError(null); }
      else setAuditError(logs.reason?.message ?? "Couldn't load the audit trail");

      if (biz.status === "fulfilled") { setBusinesses(biz.value.items); setBusinessesError(null); }
      else setBusinessesError(biz.reason?.message ?? "Couldn't load recent listings");
    }).finally(() => {
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingClaims = claims.filter((c) => c.status === "PENDING");

  const metricCards: AdminMetric[] = metrics
    ? [
        { title: "Total Businesses", value: metrics.totalBusinesses.toLocaleString(), description: "Across all sectors & subcategories", icon: "Building2" },
        { title: "Verified Businesses", value: metrics.verifiedBusinesses.toLocaleString(), description: "Businesses with the Verified trust badge", icon: "ShieldCheck" },
        { title: "Pending Business Claims", value: metrics.pendingClaims.toLocaleString(), description: "Requires manual admin review", icon: "FileCheck" },
        { title: "Pending Reviews Moderation", value: metrics.pendingReviews.toLocaleString(), description: "Reported or spam flagged", icon: "Star" },
        { title: "Registered Users", value: metrics.registeredUsers.toLocaleString(), description: `${metrics.activeBusinessOwners.toLocaleString()} active Business Owners`, icon: "Users" },
        { title: "Monthly Active Revenue", value: `₹${metrics.monthlyRevenueInr.toLocaleString()}`, description: "Pro & Premium subscriptions", icon: "CreditCard" },
      ]
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  const SectionError = ({ message }: { message: string }) => (
    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-between gap-3">
      <span>{message}</span>
      <button
        onClick={() => load(true)}
        disabled={refreshing}
        className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
      >
        <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
        <span>Retry</span>
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Executive Overview
            </h1>
            <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Real-time platform metrics, claims queue, user activity, and security audit logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/claims"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all"
          >
            <FileCheck className="w-4 h-4" />
            <span>Moderate Claims ({pendingClaims.length})</span>
          </Link>

          <Link
            href="/admin/imports"
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-extrabold text-xs flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4 text-purple-400" />
            <span>CSV Importer</span>
          </Link>
        </div>
      </div>

      {/* METRIC STAT CARDS GRID */}
      {metricsError ? (
        <SectionError message={metricsError} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricCards.map((metric, idx) => (
            <AdminMetricCard key={idx} metric={metric} />
          ))}
        </div>
      )}

      {/* TWO-COLUMN GRID: PENDING CLAIMS MODERATION & RECENT AUDIT LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT 7 COLS: PENDING CLAIMS MODERATION QUEUE */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-amber-400" />
              <span>Pending Business Claims Queue</span>
            </h2>
            <Link
              href="/admin/claims"
              className="text-xs font-extrabold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
            >
              <span>View All ({claims.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {claimsError ? (
            <SectionError message={claimsError} />
          ) : (
          <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 shadow-xl overflow-hidden divide-y divide-slate-800/60">
            {pendingClaims.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500 font-semibold">No pending claims.</div>
            )}
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-white truncate">
                      {claim.business?.name ?? "Unknown Business"}
                    </h3>
                    <span
                      className={cn(
                        "text-[9px] font-black uppercase px-2 py-0.5 rounded border",
                        claim.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      )}
                    >
                      {claim.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-semibold">
                    <span>Applicant: <strong className="text-slate-200">{claim.user.name}</strong></span>
                    <span>•</span>
                    <span className="uppercase text-purple-400">Method: {claim.verificationMethod}</span>
                    {claim.proofValue && <span>• Ref: <strong className="text-slate-300">{claim.proofValue}</strong></span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/claims`}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-extrabold transition-colors"
                  >
                    Inspect & Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* RIGHT 5 COLS: SECURITY AUDIT TRAIL FEED */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span>Live Audit Trail</span>
            </h2>
            <Link
              href="/admin/audit-logs"
              className="text-xs font-extrabold text-purple-400 hover:text-purple-300 transition-colors"
            >
              All Logs →
            </Link>
          </div>

          {auditError ? (
            <SectionError message={auditError} />
          ) : (
          <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 shadow-xl p-5 space-y-4">
            {auditLogs.length === 0 && (
              <div className="text-center text-xs text-slate-500 font-semibold">No audit log entries yet.</div>
            )}
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-white">{log.adminName}</span>
                  <span className="text-[10px] font-bold text-slate-500">{log.timestamp.split("T")[0]}</span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {log.details ?? "—"}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold pt-1 border-t border-slate-800/60">
                  <span className="font-mono">{log.ipAddress ?? "—"}</span>
                  <span className="text-purple-400 uppercase font-black">{log.action}</span>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

      </div>

      {/* RECENT BUSINESSES DATATABLE PREVIEW */}
      <div className="space-y-4">
        {businessesError ? (
          <SectionError message={businessesError} />
        ) : (
        <AdminDataTable
          title="Recently Added & Verified Listings"
          description="Real-time view of newly indexed businesses in Hubigo PostgreSQL."
          columns={[
            {
              header: "Business Name",
              cell: (r) => (
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-white text-xs">{r.name}</span>
                    {r.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  </div>
                  <span className="text-[10px] font-bold text-purple-400 block">{r.category ?? "—"}</span>
                </div>
              ),
            },
            { header: "City / Area", cell: (r) => `${r.city}${r.area ? `, ${r.area}` : ""}` },
            { header: "Subcategory", cell: (r) => r.subcategory ?? "—" },
            {
              header: "Plan Tier",
              cell: (r) => (
                <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                  {r.planTier}
                </span>
              ),
            },
            {
              header: "Status",
              cell: (r) => (
                <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {r.status}
                </span>
              ),
            },
          ]}
          data={businesses}
        />
        )}
      </div>

    </div>
  );
}
