"use client";

import React, { useEffect, useState } from "react";
import { ShieldCheck, Plus, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminRoles, createAdminRole, type AdminRole } from "../lib/admin-api";

export default function AdminRolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", permissions: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    getAdminRoles()
      .then(setRoles)
      .catch((err) => setError(err.message ?? "Failed to load roles"))
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
      await createAdminRole({
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        permissions: form.permissions.split(",").map((p) => p.trim()).filter(Boolean),
      });
      setShowForm(false);
      setForm({ name: "", slug: "", description: "", permissions: "" });
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create role");
    } finally {
      setSubmitting(false);
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
            <ShieldCheck className="w-7 h-7 text-purple-400" />
            <span>Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Configure permission matrices for admin roles across the platform.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Role</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Role Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              required
              placeholder="Slug (e.g. content_manager)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 sm:col-span-2"
            />
            <input
              placeholder="Permissions (comma-separated, e.g. businesses:read, claims:approve)"
              value={form.permissions}
              onChange={(e) => setForm({ ...form, permissions: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500 sm:col-span-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Role"}
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
        title="Admin Roles & Permissions Matrix"
        columns={[
          { header: "Role Name", cell: (r) => <span className="font-extrabold text-white text-xs">{r.name}</span> },
          { header: "Slug", accessorKey: "slug" },
          { header: "Description", accessorKey: "description" },
          { header: "Assigned Admins", cell: (r) => <span className="font-bold text-purple-400">{r.adminsCount} Admins</span> },
          {
            header: "Granted Permissions",
            cell: (r) => (
              <div className="flex flex-wrap gap-1">
                {r.permissions.map((p, i) => (
                  <span key={i} className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    {p}
                  </span>
                ))}
              </div>
            ),
          },
        ]}
        data={roles}
      />
    </div>
  );
}
