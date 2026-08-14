"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Loader2, CheckCircle2, Circle } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminContactMessages, markAdminContactMessageRead, deleteAdminContactMessage, type AdminContactMessageRow } from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminContactMessageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminContactMessages({ page, pageSize: PAGE_SIZE })
      .then((res) => {
        setMessages(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state before a page-change fetch is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only closes over `page`, already listed below
  }, [page]);

  async function handleMarkRead(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    try {
      await markAdminContactMessageRead(id);
    } catch {
      load();
    }
  }

  async function handleBulkDelete(ids: string[]) {
    if (!confirm(`Delete ${ids.length} message(s)? This can't be undone.`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminContactMessage(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete messages");
    }
  }

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
            <MessageSquare className="w-7 h-7 text-purple-400" />
            <span>Contact Messages</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Submissions from the public /contact form — every sender is a logged-in Hubigo account.
          </p>
        </div>
      </div>

      <AdminDataTable
        title="Inbox"
        columns={[
          {
            header: "Status",
            cell: (r) =>
              r.isRead ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-slate-400">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Read
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase text-purple-300">
                  <Circle className="w-3.5 h-3.5 fill-purple-400 text-purple-400" /> New
                </span>
              ),
          },
          { header: "From", cell: (r) => <span className="font-extrabold text-white text-xs">{r.name}</span> },
          { header: "Email", cell: (r) => r.email },
          { header: "Sender Account", cell: (r) => r.sender ? `${r.sender.name}${r.sender.phone ? ` · ${r.sender.phone}` : ""}` : "Deleted account" },
          { header: "Subject", cell: (r) => <span className="font-bold text-slate-200">{r.subject}</span> },
          { header: "Message", cell: (r) => <span className="line-clamp-2 max-w-xs block">{r.message}</span> },
          { header: "Received", cell: (r) => new Date(r.createdAt).toLocaleString("en-IN") },
          {
            header: "Action",
            cell: (r) =>
              !r.isRead && (
                <button
                  onClick={() => handleMarkRead(r.id)}
                  className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-[10px] transition-colors cursor-pointer"
                >
                  Mark Read
                </button>
              ),
          },
        ]}
        data={messages}
        onBulkDelete={handleBulkDelete}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
      />
    </div>
  );
}
