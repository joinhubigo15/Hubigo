"use client";

import React, { useEffect, useState } from "react";
import { Flag, Loader2, CheckCircle2, XCircle, Circle } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import {
  getAdminEditSuggestions,
  resolveAdminEditSuggestion,
  deleteAdminEditSuggestion,
  getAdminListingReports,
  resolveAdminListingReport,
  deleteAdminListingReport,
  type AdminEditSuggestionRow,
  type AdminListingReportRow,
} from "../lib/admin-api";
import { cn } from "@/app/lib/utils";

const PAGE_SIZE = 20;
type Tab = "suggestions" | "reports";

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-purple-300">
        <Circle className="w-3.5 h-3.5 fill-purple-400 text-purple-400" /> Pending
      </span>
    );
  }
  if (status === "applied" || status === "resolved") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-emerald-300">
        <CheckCircle2 className="w-3.5 h-3.5" /> {status === "applied" ? "Applied" : "Resolved"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-slate-400">
      <XCircle className="w-3.5 h-3.5" /> Dismissed
    </span>
  );
}

export default function AdminListingFeedbackPage() {
  const [tab, setTab] = useState<Tab>("suggestions");
  const [suggestions, setSuggestions] = useState<AdminEditSuggestionRow[]>([]);
  const [reports, setReports] = useState<AdminListingReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    const req = tab === "suggestions" ? getAdminEditSuggestions({ page, pageSize: PAGE_SIZE }) : getAdminListingReports({ page, pageSize: PAGE_SIZE });
    req
      .then((res) => {
        if (tab === "suggestions") setSuggestions(res.items as AdminEditSuggestionRow[]);
        else setReports(res.items as AdminListingReportRow[]);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state before a tab/page-change fetch is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only closes over tab/page, already listed below
  }, [tab, page]);

  function switchTab(next: Tab) {
    setTab(next);
    setPage(1);
  }

  async function handleResolveSuggestion(id: string, status: "applied" | "dismissed") {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
    try {
      await resolveAdminEditSuggestion(id, status);
    } catch {
      load();
    }
  }

  async function handleResolveReport(id: string, status: "resolved" | "dismissed") {
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await resolveAdminListingReport(id, status);
    } catch {
      load();
    }
  }

  async function handleBulkDeleteSuggestions(ids: string[]) {
    if (!confirm(`Delete ${ids.length} suggestion(s)? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminEditSuggestion(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function handleBulkDeleteReports(ids: string[]) {
    if (!confirm(`Delete ${ids.length} report(s)? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminListingReport(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Flag className="w-7 h-7 text-purple-400" />
            <span>Listing Feedback</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            &ldquo;Suggest an Edit&rdquo; and &ldquo;Report Listing&rdquo; submissions from business detail pages.
          </p>
        </div>

        <div className="inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-1">
          <button
            onClick={() => switchTab("suggestions")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              tab === "suggestions" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            Suggested Edits
          </button>
          <button
            onClick={() => switchTab("reports")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
              tab === "reports" ? "bg-purple-600 text-white shadow-md" : "text-slate-400 hover:text-white"
            )}
          >
            Reported Listings
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">{error}</div>
      ) : tab === "suggestions" ? (
        <AdminDataTable
          title="Suggested Edits"
          columns={[
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Business",
              cell: (r) => r.business ? <span className="font-extrabold text-white text-xs">{r.business.name}</span> : <span className="text-slate-500">Deleted listing</span>,
            },
            { header: "Submitted By", cell: (r) => (r.user ? `${r.user.name}${r.user.phone ? ` · ${r.user.phone}` : ""}` : "Anonymous") },
            { header: "Field", cell: (r) => <span className="font-bold text-slate-200">{r.type}</span> },
            { header: "Suggested Change", cell: (r) => <span className="line-clamp-2 max-w-xs block">{r.details}</span> },
            { header: "Received", cell: (r) => new Date(r.createdAt).toLocaleString("en-IN") },
            {
              header: "Action",
              cell: (r) =>
                r.status === "pending" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResolveSuggestion(r.id, "applied")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition-colors cursor-pointer"
                    >
                      Mark Applied
                    </button>
                    <button
                      onClick={() => handleResolveSuggestion(r.id, "dismissed")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10px] transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                ),
            },
          ]}
          data={suggestions}
          onBulkDelete={handleBulkDeleteSuggestions}
          serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
        />
      ) : (
        <AdminDataTable
          title="Reported Listings"
          columns={[
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Business",
              cell: (r) => r.business ? <span className="font-extrabold text-white text-xs">{r.business.name}</span> : <span className="text-slate-500">Deleted listing</span>,
            },
            { header: "Submitted By", cell: (r) => (r.user ? `${r.user.name}${r.user.phone ? ` · ${r.user.phone}` : ""}` : "Anonymous") },
            { header: "Reason", cell: (r) => <span className="font-bold text-rose-300">{r.reason}</span> },
            { header: "Details", cell: (r) => <span className="line-clamp-2 max-w-xs block">{r.details}</span> },
            { header: "Received", cell: (r) => new Date(r.createdAt).toLocaleString("en-IN") },
            {
              header: "Action",
              cell: (r) =>
                r.status === "pending" && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleResolveReport(r.id, "resolved")}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] transition-colors cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() => handleResolveReport(r.id, "dismissed")}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-extrabold text-[10px] transition-colors cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                ),
            },
          ]}
          data={reports}
          onBulkDelete={handleBulkDeleteReports}
          serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
        />
      )}
    </div>
  );
}
