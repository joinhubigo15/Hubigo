"use client";

import React, { useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminSubscriptions, type AdminSubscriptionRow } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<AdminSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAdminSubscriptions({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setSubs(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load subscriptions"))
      .finally(() => setLoading(false));
  }, [page]);

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
            <CreditCard className="w-7 h-7 text-purple-400" />
            <span>Subscriptions & Monetization</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage paid plans (Pro, Premium, Enterprise) and billing renewal cycles.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Active Subscription Billing"
        columns={[
          {
            header: "Account Owner",
            cell: (r) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-white text-xs block">{r.ownerName}</span>
                <span className="text-[11px] text-slate-400">{r.ownerEmail ?? "—"}</span>
              </div>
            ),
          },
          { header: "Plan Tier", cell: (r) => <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">{r.plan}</span> },
          { header: "Payment Provider", cell: (r) => r.paymentProvider ?? "—" },
          { header: "Amount", cell: (r) => <span className="font-black text-emerald-400">₹{r.amountInr.toLocaleString()}</span> },
          { header: "Starts", cell: (r) => r.startsAt.split("T")[0] },
          { header: "Expires", cell: (r) => (r.expiresAt ? r.expiresAt.split("T")[0] : "—") },
          { header: "Status", cell: (r) => <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">{r.status}</span> },
        ]}
        data={subs}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
