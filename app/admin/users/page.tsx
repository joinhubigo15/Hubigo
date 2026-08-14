"use client";

import React, { useEffect, useState } from "react";
import { Users, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { cn } from "@/app/lib/utils";
import { getAdminUsers, suspendAdminUser, activateAdminUser, type AdminUserRow } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminUsers({ page, pageSize: PAGE_SIZE, search: search || undefined })
      .then((res) => {
        setUsers(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const toggleSuspend = async (u: AdminUserRow) => {
    try {
      if (u.status === "ACTIVE") await suspendAdminUser(u.id);
      else await activateAdminUser(u.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update user status");
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
            <Users className="w-7 h-7 text-purple-400" />
            <span>User Accounts Console</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage {total.toLocaleString()} user profiles, business owner roles, and account status.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Registered Users & Business Owners"
        columns={[
          {
            header: "User Details",
            cell: (r) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-white text-xs block">{r.name}</span>
                <span className="text-[11px] text-slate-400">{r.email ?? "—"}</span>
              </div>
            ),
          },
          { header: "Phone", cell: (r) => r.phone ?? "—" },
          {
            header: "Role",
            cell: (r) => (
              <span
                className={cn(
                  "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                  r.role === "BUSINESS_OWNER"
                    ? "bg-purple-500/10 text-purple-300 border border-purple-500/30"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                )}
              >
                {r.role}
              </span>
            ),
          },
          {
            header: "Account Status",
            cell: (r) => (
              <span
                className={cn(
                  "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                  r.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                )}
              >
                {r.status}
              </span>
            ),
          },
          { header: "Listings Owned", cell: (r) => <span className="font-bold text-slate-200">{r.businessesCount}</span> },
          {
            header: "Last Active",
            cell: (r) => <span className="text-slate-400 text-xs">{r.lastActiveAt ? r.lastActiveAt.split("T")[0] : "Never"}</span>,
          },
          {
            header: "Actions",
            cell: (r) => (
              <button
                onClick={() => toggleSuspend(r)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  r.status === "ACTIVE"
                    ? "bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30"
                    : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                )}
              >
                {r.status === "ACTIVE" ? "Suspend Account" : "Activate Account"}
              </button>
            ),
          },
        ]}
        data={users}
        onSearchChange={setSearch}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
