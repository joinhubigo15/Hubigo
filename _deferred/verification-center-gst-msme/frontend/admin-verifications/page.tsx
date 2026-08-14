"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Check, X, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { cn } from "@/app/lib/utils";
import { getAdminVerifications, approveAdminVerification, rejectAdminVerification, type AdminVerification } from "../lib/admin-api";

export default function AdminVerificationsPage() {
  const [verifications, setVerifications] = useState<AdminVerification[]>([]);
  const [selected, setSelected] = useState<AdminVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminVerifications()
      .then((data) => {
        setVerifications(data);
        setSelected((prev) => (prev ? data.find((v) => v.id === prev.id) ?? data[0] ?? null : data[0] ?? null));
      })
      .catch((err) => setError(err.message ?? "Failed to load verifications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (id: string) => {
    setBusy(true);
    try {
      await approveAdminVerification(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to approve verification");
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (id: string) => {
    const adminNotes = prompt("Reason for rejecting this verification (optional):") ?? undefined;
    setBusy(true);
    try {
      await rejectAdminVerification(id, adminNotes || undefined);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to reject verification");
    } finally {
      setBusy(false);
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
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            <span>Verified Badge Moderation Queue</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Inspect submitted GSTIN/MSME registration numbers for the "Verified" trust badge (separate from ownership claims).
          </p>
        </div>
      </div>

      {/* TWO COLUMN INSPECTOR LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT 7 COLS: VERIFICATIONS DATATABLE */}
        <div className="lg:col-span-7">
          <AdminDataTable
            title="All Verification Requests"
            columns={[
              {
                header: "Target Business",
                cell: (r) => (
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-white text-xs block">{r.business?.name ?? "Unknown Business"}</span>
                    <span className="text-[10px] text-slate-500 font-semibold">{r.submittedAt.split("T")[0]}</span>
                  </div>
                ),
              },
              {
                header: "Applicant",
                cell: (r) => (
                  <div className="space-y-0.5 text-xs">
                    <div className="font-bold text-slate-200">{r.user.name}</div>
                    <div className="text-[11px] text-slate-400">{r.user.phone ?? r.user.email ?? "—"}</div>
                  </div>
                ),
              },
              {
                header: "Method",
                cell: (r) => (
                  <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                    {r.method}
                  </span>
                ),
              },
              {
                header: "Status",
                cell: (r) => (
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border",
                      r.status === "PENDING"
                        ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                        : r.status === "APPROVED"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                    )}
                  >
                    {r.status}
                  </span>
                ),
              },
              {
                header: "Action",
                cell: (r) => (
                  <button
                    onClick={() => setSelected(r)}
                    className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                ),
              },
            ]}
            data={verifications}
          />
        </div>

        {/* RIGHT 5 COLS: SELECTED VERIFICATION INSPECTOR DRAWER */}
        <div className="lg:col-span-5">
          {selected ? (
            <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                    Verification ID: {selected.id}
                  </span>
                  <h2 className="text-lg font-black text-white pt-1">
                    {selected.business?.name ?? "Unknown Business"}
                  </h2>
                </div>

                <span
                  className={cn(
                    "text-xs font-black uppercase px-3 py-1 rounded-full border",
                    selected.status === "PENDING"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : selected.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                      : "bg-rose-500/10 text-rose-300 border-rose-500/30"
                  )}
                >
                  {selected.status}
                </span>
              </div>

              {/* APPLICANT DETAILS */}
              <div className="space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">
                  Applicant Information
                </h3>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Name:</span>
                    <span className="font-extrabold text-white">{selected.user.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mobile:</span>
                    <span className="font-extrabold text-slate-200">{selected.user.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-extrabold text-slate-200">{selected.user.email ?? "—"}</span>
                  </div>
                </div>
              </div>

              {/* VERIFICATION NUMBERS */}
              <div className="space-y-3 text-xs">
                <h3 className="font-extrabold text-slate-400 uppercase text-[10px] tracking-wider">
                  Submitted Registration Data
                </h3>
                <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-800/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-300 font-bold uppercase">Method:</span>
                    <span className="font-black text-white uppercase">{selected.method}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-purple-800/40">
                    <span className="text-slate-400">Registration Number:</span>
                    <span className="font-black text-emerald-400 font-mono text-xs">{selected.registrationNumber}</span>
                  </div>
                  {selected.providerRef && (
                    <div className="flex items-center justify-between pt-1 border-t border-purple-800/40">
                      <span className="text-slate-400">Provider Ref:</span>
                      <span className="font-black text-slate-300 font-mono text-xs">{selected.providerRef}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* NOTES */}
              {selected.adminNotes && (
                <div className="p-3 bg-slate-900/60 rounded-xl text-xs text-slate-400 font-medium">
                  📝 {selected.adminNotes}
                </div>
              )}

              {/* ACTION BUTTONS */}
              {selected.status === "PENDING" ? (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => handleApprove(selected.id)}
                    disabled={busy}
                    className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Approve Badge</span>
                  </button>

                  <button
                    onClick={() => handleReject(selected.id)}
                    disabled={busy}
                    className="py-3 px-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-900/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <X className="w-4 h-4 stroke-[3]" />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 text-center text-xs text-slate-400 font-bold">
                  This verification has been processed ({selected.status}).
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-8 shadow-xl text-center text-xs text-slate-500 font-semibold">
              No verification requests to inspect.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
