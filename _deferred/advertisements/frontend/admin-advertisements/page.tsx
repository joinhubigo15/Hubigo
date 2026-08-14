"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import {
  getAdminAdvertisements,
  createAdminAdvertisement,
  deleteAdminAdvertisement,
  getAdminCities,
  type AdminAdvertisement,
  type AdminCity,
} from "../lib/admin-api";

export default function AdminAdvertisementsPage() {
  const [ads, setAds] = useState<AdminAdvertisement[]>([]);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", placement: "HOME_BANNER", targetCityId: "", startDate: "", endDate: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminAdvertisements(), getAdminCities()])
      .then(([adsList, citiesList]) => {
        setAds(adsList);
        setCities(citiesList);
      })
      .catch((err) => setError(err.message ?? "Failed to load advertisements"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.placement) return;
    setSubmitting(true);
    try {
      await createAdminAdvertisement({
        title: form.title,
        placement: form.placement,
        targetCityId: form.targetCityId || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      setShowForm(false);
      setForm({ title: "", placement: "HOME_BANNER", targetCityId: "", startDate: "", endDate: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create ad campaign");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this ad campaign?")) return;
    try {
      await deleteAdminAdvertisement(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete ad campaign");
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
            <Megaphone className="w-7 h-7 text-purple-400" />
            <span>Advertisements & Promoted Slots</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage sponsored search placements, category banners, and home hero ads.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Ad Campaign</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Campaign Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <select
              value={form.placement}
              onChange={(e) => setForm({ ...form, placement: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="HOME_BANNER">Home Banner</option>
              <option value="CATEGORY_TOP">Category Top</option>
              <option value="SEARCH_SPONSORED">Search Sponsored</option>
            </select>
            <select
              value={form.targetCityId}
              onChange={(e) => setForm({ ...form, targetCityId: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 w-full"
              />
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Campaign"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <AdminDataTable
        title="Active Sponsored Campaigns"
        columns={[
          { header: "Campaign Title", cell: (r) => <span className="font-extrabold text-white text-xs">{r.title}</span> },
          { header: "Target City", cell: (r) => r.targetCityName ?? "All Cities" },
          { header: "Placement Slot", cell: (r) => <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">{r.placement}</span> },
          { header: "Impressions", cell: (r) => r.impressions.toLocaleString() },
          { header: "Clicks", cell: (r) => <span className="font-black text-emerald-400">{r.clicks.toLocaleString()}</span> },
          { header: "Status", cell: (r) => <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">{r.status}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                title="Delete Campaign"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
        data={ads}
      />
    </div>
  );
}
