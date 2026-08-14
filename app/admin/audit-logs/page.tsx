"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminAuditLogs, type AdminAuditLog } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    getAdminAuditLogs({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setLogs(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load audit logs"))
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
            <ShieldAlert className="w-7 h-7 text-purple-400" />
            <span>Security & Compliance Audit Trail</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Immutable log of all administrative actions, claim approvals, user suspensions, and settings changes.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Admin Audit Logs"
        columns={[
          {
            header: "Admin User",
            cell: (r) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-white text-xs block">{r.adminName}</span>
                <span className="text-[11px] text-slate-400">{r.adminEmail}</span>
              </div>
            ),
          },
          {
            header: "Action Performed",
            cell: (r) => (
              <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                {r.action}
              </span>
            ),
          },
          { header: "Details", cell: (r) => r.details ?? "—" },
          { header: "IP Address", cell: (r) => <span className="font-mono text-xs text-slate-300">{r.ipAddress ?? "—"}</span> },
          { header: "Timestamp", cell: (r) => <span className="text-slate-400 text-xs">{r.timestamp.replace("T", " ").replace("Z", "")}</span> },
        ]}
        data={logs}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
