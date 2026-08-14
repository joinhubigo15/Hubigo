"use client";

import React, { useEffect, useState } from "react";
import { Zap, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminLeads, deleteAdminLead, type AdminLeadRow } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<AdminLeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminLeads({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setLeads(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load leads"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state before a page-change fetch is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only closes over `page`, already listed below
  }, [page]);

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Delete ${ids.length} lead(s)? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminLead(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete leads");
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
            <Zap className="w-7 h-7 text-purple-400" />
            <span>Lead System Telemetry</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Real-time tracking of calls, WhatsApp clicks, email inquiries, and quote requests.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Live Lead Inquiries Stream"
        columns={[
          { header: "Target Listing", cell: (r) => <span className="font-extrabold text-white text-xs">{r.businessName}</span> },
          { header: "Lead Type", cell: (r) => <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">{r.type}</span> },
          { header: "Contact", cell: (r) => r.phone ?? r.email ?? "Anonymous" },
          { header: "Inquiry Message", cell: (r) => r.message ?? "—" },
          { header: "Status", cell: (r) => <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">{r.status}</span> },
        ]}
        data={leads}
        onBulkDelete={handleBulkDelete}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
