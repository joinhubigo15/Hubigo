"use client";

import React, { useEffect, useState } from "react";
import { Compass, Plus, Trash2, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminAreas, createAdminArea, deleteAdminArea, getAdminCities, type AdminArea, type AdminCity } from "../lib/admin-api";

export default function AdminAreasPage() {
  const [areas, setAreas] = useState<AdminArea[]>([]);
  const [cities, setCities] = useState<AdminCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ cityId: "", name: "", slug: "", pincode: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminAreas(), getAdminCities()])
      .then(([areasList, citiesList]) => {
        setAreas(areasList);
        setCities(citiesList);
      })
      .catch((err) => setError(err.message ?? "Failed to load areas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cityId || !form.name || !form.slug) return;
    setSubmitting(true);
    try {
      await createAdminArea({ cityId: form.cityId, name: form.name, slug: form.slug, pincode: form.pincode || undefined });
      setShowForm(false);
      setForm({ cityId: "", name: "", slug: "", pincode: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create area");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this area?")) return;
    try {
      await deleteAdminArea(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete area");
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
            <Compass className="w-7 h-7 text-purple-400" />
            <span>Neighborhood Areas & Pincodes</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Local locality mapping for geo searches & radius filtering.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Locality Area</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              required
              value={form.cityId}
              onChange={(e) => setForm({ ...form, cityId: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="">Select City</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              required
              placeholder="Area Name"
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
              placeholder="Pincode (optional)"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Area"}
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
        title="Neighborhood Areas"
        columns={[
          { header: "Area Name", cell: (r) => <span className="font-extrabold text-white text-xs">{r.name}</span> },
          { header: "City", accessorKey: "city" },
          { header: "Pincode", cell: (r) => <span className="font-mono text-purple-400 font-bold">{r.pincode ?? "—"}</span> },
          { header: "Businesses Count", cell: (r) => <span className="font-bold text-slate-200">{r.businessesCount}</span> },
          {
            header: "Actions",
            cell: (r) => (
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                title="Delete Area"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
        data={areas}
      />
    </div>
  );
}
