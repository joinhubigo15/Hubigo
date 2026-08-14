"use client";

import React, { useEffect, useRef, useState } from "react";
import { UploadCloud, RefreshCw, Loader2 } from "lucide-react";
import { AdminDataTable } from "../components/AdminDataTable";
import { getAdminImports, uploadAdminImport, retryAdminImport, type AdminImportJob } from "../lib/admin-api";

const POLL_INTERVAL_MS = 3000;

export default function AdminImportsPage() {
  const [jobs, setJobs] = useState<AdminImportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectorInputRef = useRef<HTMLInputElement>(null);

  const load = () =>
    getAdminImports()
      .then(setJobs)
      .catch((err) => setError(err.message ?? "Failed to load import jobs"))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === "RUNNING");
    if (!hasRunning) return;
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [jobs]);

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("Choose a CSV file to upload first.");
      return;
    }
    setUploading(true);
    try {
      await uploadAdminImport(file, sectorInputRef.current?.value || undefined);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (sectorInputRef.current) sectorInputRef.current.value = "";
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to upload CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await retryAdminImport(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to retry import job");
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
            <UploadCloud className="w-7 h-7 text-purple-400" />
            <span>CSV Importer Jobs Console</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium pt-1">
            Monitor bulk PostgreSQL import tasks, batch logs, and failed row retries.
          </p>
        </div>
      </div>

      {/* UPLOAD FORM */}
      <div className="bg-[#0c101c] rounded-3xl border border-slate-800/90 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="text-xs text-slate-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-purple-600 file:text-white file:font-bold file:text-xs file:cursor-pointer"
        />
        <input
          ref={sectorInputRef}
          type="text"
          placeholder="Sector (optional)"
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-full sm:w-56"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-900/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span>{uploading ? "Uploading..." : "Upload CSV File"}</span>
        </button>
      </div>

      <AdminDataTable
        title="Batch Import Execution Log"
        columns={[
          { header: "Filename", cell: (r) => <span className="font-extrabold text-white text-xs">{r.filename}</span> },
          { header: "Target Sector", cell: (r) => <span className="text-xs font-bold text-purple-400">{r.sector ?? "—"}</span> },
          { header: "Total Rows", cell: (r) => r.totalRows.toLocaleString() },
          { header: "Processed Rows", cell: (r) => <span className="font-extrabold text-emerald-400">{r.processedRows.toLocaleString()}</span> },
          {
            header: "Failed Rows",
            cell: (r) =>
              r.failedRows > 0 ? (
                <span className="font-extrabold text-rose-400">{r.failedRows} failed</span>
              ) : (
                <span className="text-slate-500 font-semibold">0</span>
              ),
          },
          {
            header: "Status",
            cell: (r) => (
              <span
                className={
                  r.status === "COMPLETED"
                    ? "text-[10px] font-extrabold uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full"
                    : r.status === "RUNNING"
                    ? "text-[10px] font-extrabold uppercase text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2.5 py-0.5 rounded-full"
                    : r.status === "FAILED"
                    ? "text-[10px] font-extrabold uppercase text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full"
                    : "text-[10px] font-extrabold uppercase text-slate-400 bg-slate-800/50 border border-slate-700 px-2.5 py-0.5 rounded-full"
                }
              >
                {r.status}
              </span>
            ),
          },
          {
            header: "Actions",
            cell: (r) =>
              r.status === "FAILED" ? (
                <button
                  onClick={() => handleRetry(r.id)}
                  className="px-3 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry Job</span>
                </button>
              ) : (
                <span className="text-xs text-slate-500 font-semibold">{r.status === "RUNNING" ? "In progress" : "—"}</span>
              ),
          },
        ]}
        data={jobs}
      />
    </div>
  );
}
