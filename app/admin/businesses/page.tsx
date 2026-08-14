"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ShieldCheck, Plus, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { cn } from "@/app/lib/utils";
import {
  getAdminBusinesses,
  verifyAdminBusiness,
  deleteAdminBusiness,
  type AdminBusinessRow,
} from "../lib/admin-api";

const PAGE_SIZE = 20;

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusinessRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [claimedOnly, setClaimedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    getAdminBusinesses({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      // Only ever sent as `true` when checked — omitted (not `false`) when off, so "show all" is
      // the unfiltered default rather than an explicit unverified/unclaimed-only filter.
      verified: verifiedOnly || undefined,
      claimed: claimedOnly || undefined,
    })
      .then((res) => {
        setBusinesses(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message ?? "Failed to load businesses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting loading state before a page-change fetch is intentional
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load only closes over `page`/`search`, already listed below
  }, [page]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (page !== 1) setPage(1);
      else load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    if (page !== 1) setPage(1);
    else load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifiedOnly, claimedOnly]);

  const handleBulkVerify = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => verifyAdminBusiness(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to verify businesses");
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (!confirm(`Are you sure you want to delete ${ids.length} business listing(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => deleteAdminBusiness(id)));
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete businesses");
    }
  };

  const handleDeleteOne = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This removes it from Hubigo — use this for illegal or unwanted listings.`)) return;
    try {
      await deleteAdminBusiness(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete business");
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
            <Building2 className="w-7 h-7 text-purple-400" />
            <span>Businesses Directory</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Enterprise management console for {total.toLocaleString()} business profiles across India.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/add-business"
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Business</span>
          </Link>
        </div>
      </div>

      {/* DATA TABLE */}
      <AdminDataTable
        title="All Business Listings"
        description="Filter by sector, city, verification badge, claim status, or subscription tier."
        columns={[
          {
            header: "Business Name & Owner",
            cell: (r) => (
              <div className="space-y-0.5 min-w-[200px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-xs">{r.name}</span>
                  {r.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">Owner: {r.ownerName ?? "Unclaimed"}</div>
              </div>
            ),
          },
          {
            header: "Taxonomy & Location",
            cell: (r) => (
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-purple-400 block">{r.category ?? "—"}</span>
                <span className="text-[11px] text-slate-400">{r.subcategory ?? "—"} • {r.city}</span>
              </div>
            ),
          },
          {
            header: "Contact Info",
            cell: (r) => (
              <div className="space-y-0.5 text-xs text-slate-300">
                <div className="text-[11px] text-slate-500">{r.ownerEmail ?? "—"}</div>
              </div>
            ),
          },
          {
            header: "Claimed & Verified",
            cell: (r) => (
              <div className="flex flex-col gap-1 items-start">
                <span
                  className={cn(
                    "text-[10px] font-black uppercase px-2 py-0.5 rounded",
                    r.isClaimed
                      ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                      : "bg-slate-900 text-slate-500 border border-slate-800"
                  )}
                >
                  {r.isClaimed ? "Claimed" : "Unclaimed"}
                </span>
              </div>
            ),
          },
          {
            header: "Plan Tier",
            cell: (r) => (
              <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                {r.planTier}
              </span>
            ),
          },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Link
                  href={`/business/${r.slug}`}
                  target="_blank"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="View Public Profile"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                {!r.isVerified && (
                  <button
                    onClick={() => verifyAdminBusiness(r.id).then(load).catch((err) => alert(err.message))}
                    className="p-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
                    title="Verify Business"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDeleteOne(r.id, r.name)}
                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete Listing"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        data={businesses}
        onBulkVerify={handleBulkVerify}
        onBulkDelete={handleBulkDelete}
        onSearchChange={setSearch}
        serverPagination={{ page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)), total, onPageChange: setPage }}
        extraFilters={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="accent-purple-500"
              />
              Verified Only
            </label>
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 cursor-pointer hover:border-slate-700 transition-colors">
              <input
                type="checkbox"
                checked={claimedOnly}
                onChange={(e) => setClaimedOnly(e.target.checked)}
                className="accent-purple-500"
              />
              Claimed Only
            </label>
          </div>
        }
      />
    </div>
  );
}
