"use client";

import React, { useEffect, useState } from "react";
import { UserCheck, Plus, X, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import {
  getAdminTeam,
  createAdminTeamMember,
  deactivateAdminTeamMember,
  getAdminRoles,
  type AdminTeamMember,
  type AdminRole,
} from "../lib/admin-api";

export default function AdminTeamPage() {
  const [admins, setAdmins] = useState<AdminTeamMember[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", roleId: "" });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([getAdminTeam(), getAdminRoles()])
      .then(([team, roleList]) => {
        setAdmins(team);
        setRoles(roleList);
      })
      .catch((err) => setError(err.message ?? "Failed to load admin team"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.roleId) return;
    setSubmitting(true);
    try {
      const result = await createAdminTeamMember(form);
      setShowForm(false);
      setForm({ name: "", email: "", password: "", roleId: "" });
      if (result.note) setBanner(result.note);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to invite admin user");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this admin account?")) return;
    try {
      await deactivateAdminTeamMember(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to deactivate admin account");
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
            <UserCheck className="w-7 h-7 text-purple-400" />
            <span>Admin Team User Accounts</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Manage administrative personnel, 2FA security enforcement, and role assignments.
          </p>
        </div>

        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Invite Admin User</span>
        </button>
      </div>

      {banner && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start justify-between gap-3 text-amber-300 text-xs font-semibold">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="shrink-0 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              required
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <input
              required
              type="password"
              placeholder="Temporary Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            />
            <select
              required
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white text-xs font-semibold focus:outline-none focus:border-purple-500"
            >
              <option value="">Select a Role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Inviting..." : "Send Invite"}
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
        title="Administrative Staff Accounts"
        columns={[
          {
            header: "Admin Name & Email",
            cell: (r) => (
              <div className="space-y-0.5">
                <span className="font-extrabold text-white text-xs block">{r.name}</span>
                <span className="text-[11px] text-slate-400">{r.email}</span>
              </div>
            ),
          },
          {
            header: "Assigned Role",
            cell: (r) => (
              <span className="text-[10px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded">
                {r.roleName}
              </span>
            ),
          },
          {
            header: "2FA Status",
            cell: (r) =>
              r.isTwoFactorEnabled ? (
                <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                  2FA Active
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                  2FA Disabled
                </span>
              ),
          },
          { header: "Last Active Login", cell: (r) => r.lastLoginAt ?? "Never" },
          {
            header: "Status",
            cell: (r) => (
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                {r.status}
              </span>
            ),
          },
          {
            header: "Actions",
            cell: (r) => (
              <button
                onClick={() => handleDeactivate(r.id)}
                className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
              >
                Deactivate
              </button>
            ),
          },
        ]}
        data={admins}
      />
    </div>
  );
}
