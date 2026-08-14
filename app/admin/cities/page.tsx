"use client";

import React, { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminCities, createAdminCity, deleteAdminCity, acknowledgeAdminCity, type AdminCity } from "../lib/admin-api";

export default function AdminCitiesPage() {
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", state: "", tier: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminCities()
      .then(setCities)
      .catch((err) => setError(err.message ?? "Failed to load cities"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.state) return;
    setSubmitting(true);
    try {
      await createAdminCity({ name: form.name, slug: form.slug, state: form.state, tier: form.tier || undefined });
      setShowForm(false);
      setForm({ name: "", slug: "", state: "", tier: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create city");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this city?")) return;
    try {
      await deleteAdminCity(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete city");
    }
  };

  const handleAcknowledge = async (id: string) => {
    setCities((prev) => prev.map((c) => (c.id === id ? { ...c, autoCreatedAcknowledged: true } : c)));
    try {
      await acknowledgeAdminCity(id);
    } catch {
      load();
    }
  };

  const pendingNewCities = cities.filter((c) => c.isAutoCreated && !c.autoCreatedAcknowledged);

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
            <MapPin className="w-7 h-7 text-purple-400" />
            <span>Cities & Metro Regions</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage tier classifications and regional listing boundaries.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New City</span>
        </button>
      </div>

      {pendingNewCities.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs font-semibold text-amber-200">
            {pendingNewCities.length} new {pendingNewCities.length === 1 ? "city was" : "cities were"} auto-added when a business owner self-listed somewhere outside the seeded set: {" "}
            <span className="font-extrabold text-white">{pendingNewCities.map((c) => c.name).join(", ")}</span>. Review tier/coordinates and acknowledge below.
          </p>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="City Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              required
              placeholder="Slug"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              required
              placeholder="State"
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              placeholder="Tier (optional, e.g. Tier 1)"
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create City"}
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
        title="Indexed Indian Cities"
        columns={[
          {
            header: "City Name",
            cell: (r) => (
              <span className="flex items-center gap-2">
                <span className="font-extrabold text-white text-xs">{r.name}</span>
                {r.isAutoCreated && !r.autoCreatedAcknowledged && (
                  <span className="text-[9px] font-black uppercase text-amber-300 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded-full">New</span>
                )}
              </span>
            ),
          },
          { header: "State", accessorKey: "state" },
          { header: "Tier Classification", cell: (r) => <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">{r.tier ?? "—"}</span> },
          { header: "Indexed Businesses", cell: (r) => <span className="font-bold text-slate-200">{r.businessesCount.toLocaleString()}</span> },
          { header: "Neighborhood Areas", cell: (r) => <span className="font-bold text-purple-400">{r.areasCount} Areas</span> },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center gap-1.5">
                {r.isAutoCreated && !r.autoCreatedAcknowledged && (
                  <button
                    onClick={() => handleAcknowledge(r.id)}
                    className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer"
                    title="Acknowledge"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete City"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        data={cities}
      />
    </div>
  );
}
