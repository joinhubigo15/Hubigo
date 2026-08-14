"use client";

import React, { useEffect, useState } from "react";
import { Settings, Cloud, Server, Mail, Flag, Info, Loader2 } from "lucide-react";
import { getAdminSettings, type AdminSettings } from "../lib/admin-api";
import { cn } from "@/app/lib/utils";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-800/60 last:border-b-0">
      <span className="text-slate-400 font-bold">{label}</span>
      <span className="font-semibold text-white text-right">{value}</span>
    </div>
  );
}

function BoolPill({ value }: { value: boolean }) {
  return (
    <span
      className={cn(
        "text-[10px] font-black uppercase px-2 py-0.5 rounded",
        value ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-slate-900 text-slate-500 border border-slate-800"
      )}
    >
      {value ? "Enabled" : "Disabled"}
    </span>
  );
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminSettings()
      .then(setSettings)
      .catch((err) => setError(err.message ?? "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error || !settings) {
    return <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold">{error ?? "No settings data"}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-purple-400" />
            <span>Platform Settings & Infrastructure</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Live values from the backend&apos;s environment configuration.
          </p>
        </div>
      </div>

      <div className="p-4 bg-purple-950/20 border border-purple-800/40 rounded-2xl flex items-start gap-2.5 text-xs text-purple-200 font-semibold">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
        <span>
          These values are read-only and reflect the current server environment configuration. To change any of them,
          update the backend&apos;s <code className="px-1 py-0.5 bg-slate-900 rounded font-mono">.env</code> file and redeploy —
          there is no save action on this screen.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GENERAL */}
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-1 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <Server className="w-5 h-5 text-indigo-400" />
            <h2 className="font-extrabold text-sm text-white">Environment</h2>
          </div>
          <Row label="Environment Stage" value={settings.environment} />
          <Row label="Backend URL" value={settings.backendUrl} />
          <Row label="Frontend URL" value={settings.frontendUrl} />
        </div>

        {/* DATABASE */}
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-1 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <Server className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-sm text-white">Database</h2>
          </div>
          <Row label="Provider" value={settings.database.provider} />
          <Row label="Pool Connection Limit" value={settings.database.poolLimit ?? "Default"} />
        </div>

        {/* STORAGE */}
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-1 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <Cloud className="w-5 h-5 text-purple-400" />
            <h2 className="font-extrabold text-sm text-white">Storage & Cloudflare R2</h2>
          </div>
          <Row label="R2 Enabled" value={<BoolPill value={settings.storage.r2Enabled} />} />
          <Row label="Bucket" value={settings.storage.bucket ?? "—"} />
          <Row label="Public CDN URL" value={settings.storage.publicUrl ?? "—"} />
        </div>

        {/* EMAIL */}
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-1 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <Mail className="w-5 h-5 text-amber-400" />
            <h2 className="font-extrabold text-sm text-white">Email</h2>
          </div>
          <Row label="Email Enabled" value={<BoolPill value={settings.email.enabled} />} />
          <Row label="From Address" value={settings.email.from} />
        </div>

        {/* FEATURE FLAGS */}
        <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-6 space-y-1 text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-2">
            <Flag className="w-5 h-5 text-rose-400" />
            <h2 className="font-extrabold text-sm text-white">Feature Flags</h2>
          </div>
          <Row label="Google OAuth" value={<BoolPill value={settings.featureFlags.googleOAuthEnabled} />} />
          <Row label="Admin Auth" value={<BoolPill value={settings.featureFlags.adminAuthEnabled} />} />
        </div>
      </div>
    </div>
  );
}
