"use client";

import React, { useEffect, useState } from "react";
import { Star, Loader2, Trash2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { cn } from "@/app/lib/utils";
import { getAdminReviews, approveAdminReview, flagAdminReview, spamAdminReview, deleteAdminReview, type AdminReviewRow } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminReviews({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setReviews(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load reviews"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state before a page-change fetch is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only closes over `page`, already listed below
  }, [page]);

  const handleApprove = async (id: string) => {
    try {
      await approveAdminReview(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve review");
    }
  };

  const handleFlag = async (id: string) => {
    const reason = prompt("Reason for flagging this review:");
    if (!reason) return;
    try {
      await flagAdminReview(id, reason);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to flag review");
    }
  };

  const handleSpam = async (id: string) => {
    try {
      await spamAdminReview(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to mark review as spam");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this review from Hubigo? This can't be undone.")) return;
    try {
      await deleteAdminReview(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete review");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Permanently delete ${ids.length} review(s) from Hubigo? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminReview(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete reviews");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Star className="w-7 h-7 text-amber-400" />
            <span>Reviews Moderation Console</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Moderate reported reviews, spam links, and customer feedback.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Customer Reviews & Ratings"
        columns={[
          {
            header: "Target Listing",
            cell: (r) => <span className="font-extrabold text-white text-xs">{r.businessName}</span>,
          },
          {
            header: "Reviewer & Rating",
            cell: (r) => (
              <div className="space-y-0.5">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-amber-400">★ {r.rating}</span>
                  <span className="text-slate-300 font-extrabold text-xs">• {r.userName}</span>
                </div>
                <div className="text-[11px] text-slate-500">{r.userEmail ?? "—"}</div>
              </div>
            ),
          },
          {
            header: "Review Comment Content",
            cell: (r) => (
              <div className="max-w-md space-y-1">
                <p className="text-xs text-slate-300 line-clamp-2">{r.comment ?? "—"}</p>
                {r.flaggedReason && (
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded inline-block">
                    Flagged: {r.flaggedReason}
                  </span>
                )}
              </div>
            ),
          },
          {
            header: "Status",
            cell: (r) => (
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                  r.status === "APPROVED"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : r.status === "FLAGGED"
                    ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                )}
              >
                {r.status}
              </span>
            ),
          },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(r.id)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleFlag(r.id)}
                  className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Flag
                </button>
                <button
                  onClick={() => handleSpam(r.id)}
                  className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Spam
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete Review Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        data={reviews}
        onBulkDelete={handleBulkDelete}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
