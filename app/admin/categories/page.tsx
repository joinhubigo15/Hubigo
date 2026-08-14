"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FolderTree, Plus, Trash2, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminCategories, createAdminCategory, deleteAdminCategory, type AdminCategory } from "../lib/admin-api";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminCategories()
      .then(setCategories)
      .catch((err) => setError(err.message ?? "Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSubmitting(true);
    try {
      await createAdminCategory({ name: form.name, slug: form.slug, icon: form.icon || undefined, description: form.description || undefined });
      setShowForm(false);
      setForm({ name: "", slug: "", icon: "", description: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create sector");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this sector? This cannot be undone.")) return;
    try {
      await deleteAdminCategory(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete sector");
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
            <FolderTree className="w-7 h-7 text-purple-400" />
            <span>Sectors & Categories Taxonomy</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage {categories.length} top-level sectors and taxonomy hierarchy.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Sector</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Sector Name"
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
              placeholder="Icon (lucide-react name, optional)"
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Sector"}
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
        title="Taxonomy Sectors"
        columns={[
          { header: "Sector Name", cell: (r) => <span className="font-extrabold text-white text-xs">{r.name}</span> },
          { header: "Canonical Slug", accessorKey: "slug" },
          { header: "Subcategories", cell: (r) => <span className="font-bold text-purple-400">{r.subcategoriesCount} Subcategories</span> },
          { header: "Description", cell: (r) => r.description ?? "—" },
          {
            header: "Actions",
            cell: (r) => (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/subcategories"
                  className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-bold text-slate-300 transition-colors"
                >
                  Manage Subcategories
                </Link>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                  title="Delete Sector"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ),
          },
        ]}
        data={categories}
      />
    </div>
  );
}
