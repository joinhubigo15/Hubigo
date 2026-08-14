"use client";

import React, { useEffect, useState } from "react";
import { Tags, Plus, Trash2, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import {
  getAdminSubcategories,
  createAdminSubcategory,
  deleteAdminSubcategory,
  getAdminCategories,
  type AdminSubcategory,
  type AdminCategory,
} from "../lib/admin-api";

export default function AdminSubcategoriesPage() {
  const [subcategories, setSubcategories] = useState<AdminSubcategory[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", parentId: "", icon: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminSubcategories(), getAdminCategories()])
      .then(([subs, cats]) => {
        setSubcategories(subs);
        setCategories(cats);
      })
      .catch((err) => setError(err.message ?? "Failed to load subcategories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.parentId) return;
    setSubmitting(true);
    try {
      await createAdminSubcategory({
        name: form.name,
        slug: form.slug,
        parentId: form.parentId,
        icon: form.icon || undefined,
        description: form.description || undefined,
      });
      setShowForm(false);
      setForm({ name: "", slug: "", parentId: "", icon: "", description: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create subcategory");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this subcategory?")) return;
    try {
      await deleteAdminSubcategory(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete subcategory");
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
            <Tags className="w-7 h-7 text-purple-400" />
            <span>Subcategories Directory ({subcategories.length} Total)</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Common service tags & description templates per subcategory.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcategory</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Subcategory Name"
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
            <select
              required
              value={form.parentId}
              onChange={(e) => setForm({ ...form, parentId: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="">Select Parent Sector</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Icon (optional)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 sm:col-span-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Subcategory"}
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
        title="Subcategories & Pre-generated Common Services"
        columns={[
          { header: "Subcategory Name", cell: (r) => <span className="font-extrabold text-white text-xs">{r.name}</span> },
          { header: "Slug", accessorKey: "slug" },
          { header: "Sector", cell: (r) => <span className="text-xs font-bold text-purple-400">{r.sector}</span> },
          {
            header: "Common Service Tags",
            cell: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.commonServices.map((tag, i) => (
                  <span key={i} className="text-[10px] font-bold text-slate-300 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            ),
          },
          { header: "Templates", cell: (r) => <span className="font-extrabold text-emerald-400">{r.templatesCount} Templates</span> },
          {
            header: "Actions",
            cell: (r) => (
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                title="Delete Subcategory"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            ),
          },
        ]}
        data={subcategories}
      />
    </div>
  );
}
