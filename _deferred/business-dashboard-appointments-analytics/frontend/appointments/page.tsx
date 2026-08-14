"use client";

import { useEffect, useState } from "react";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import {
  getDashboardAppointments,
  createDashboardAppointment,
  updateDashboardAppointment,
  deleteDashboardAppointment,
  type DashboardAppointment,
} from "@/app/lib/business-dashboard-api";

const STATUS_TABS = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"] as const;
const STATUS_COLOR: Record<string, string> = {
  PENDING: "text-amber-700 bg-amber-100",
  CONFIRMED: "text-emerald-700 bg-emerald-100",
  COMPLETED: "text-blue-700 bg-blue-100",
  CANCELLED: "text-slate-500 bg-slate-100",
  NO_SHOW: "text-rose-700 bg-rose-100",
};

export default function BusinessAppointmentsPage() {
  const { accessToken } = useAuth();
  const [statusTab, setStatusTab] = useState<string>("PENDING");
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ customerName: "", customerPhone: "", serviceName: "", scheduledAt: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardAppointments(accessToken)
      .then(setAppointments)
      .catch(() => setAppointments([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filtered = appointments.filter((b) => b.status === statusTab);

  const handleCreate = async () => {
    if (!accessToken || !form.customerName.trim() || !form.customerPhone.trim() || !form.scheduledAt) return;
    setSubmitting(true);
    try {
      const created = await createDashboardAppointment(accessToken, {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        serviceName: form.serviceName.trim() || undefined,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      });
      setAppointments((prev) => [created, ...prev]);
      setShowForm(false);
      setForm({ customerName: "", customerPhone: "", serviceName: "", scheduledAt: "" });
    } finally {
      setSubmitting(false);
    }
  };

  const changeStatus = async (id: string, status: DashboardAppointment["status"]) => {
    if (!accessToken) return;
    const updated = await updateDashboardAppointment(accessToken, id, { status });
    setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    await deleteDashboardAppointment(accessToken, id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 lg:gap-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-5 shadow-none lg:shadow-sm shadow-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-md">
            Booking Manager
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Appointments & Bookings</h1>
          <p className="text-xs text-slate-500 font-semibold">Manage customer reservations and appointment status.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Appointment
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-none lg:rounded-2xl border-b lg:border border-purple-200 p-5 shadow-none lg:shadow-sm space-y-3 -mt-[1px] lg:mt-0 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900">New Appointment</h3>
            <button onClick={() => setShowForm(false)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Customer name"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="10-digit phone"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input
              value={form.serviceName}
              onChange={(e) => setForm({ ...form, serviceName: e.target.value })}
              placeholder="Service (optional)"
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              className="px-3.5 py-2.5 bg-[#f8fafc] border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-purple-600"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={submitting}
            className="px-5 py-2.5 bg-purple-600 text-white font-bold text-xs rounded-xl cursor-pointer disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Appointment"}
          </button>
        </div>
      )}

      {/* Filter Tabs & Bookings Grid */}
      <div className="bg-white rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 p-0 lg:p-5 shadow-none lg:shadow-sm shadow-slate-200/50 space-y-0 lg:space-y-4 -mt-[1px] lg:mt-0 relative z-10">
        <div className="flex items-center gap-2 border-b border-slate-100 p-4 lg:p-0 lg:pb-3 overflow-x-auto scrollbar-none bg-white lg:bg-transparent rounded-none lg:rounded-2xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusTab(tab)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                statusTab === tab ? "bg-purple-600 text-white shadow-xs" : "bg-[#f8fafc] text-slate-600 hover:bg-slate-100",
              )}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase().replace("_", " ")}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold p-6 text-center bg-white lg:bg-transparent">No appointments in this status.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 lg:gap-4 relative z-10">
            {filtered.map((b) => (
              <div key={b.id} className="p-5 lg:p-4 bg-white lg:bg-[#f8fafc] rounded-none lg:rounded-2xl border-b lg:border border-slate-200/90 space-y-3 shadow-none lg:shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <span className={cn("text-[10px] font-black px-2 py-0.5 rounded", STATUS_COLOR[b.status])}>{b.status}</span>
                  <span className="text-xs font-extrabold text-slate-900">{new Date(b.scheduledAt).toLocaleString()}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-sm text-slate-900">{b.customerName}</h4>
                  {b.serviceName && <p className="text-xs text-slate-600 font-semibold">{b.serviceName}</p>}
                  <p className="text-[11px] text-slate-400 font-medium">📞 {b.customerPhone}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs font-bold gap-1 flex-wrap">
                  <div className="flex gap-1">
                    {b.status === "PENDING" && (
                      <button onClick={() => changeStatus(b.id, "CONFIRMED")} className="text-emerald-600 hover:underline cursor-pointer">
                        Confirm
                      </button>
                    )}
                    {b.status === "CONFIRMED" && (
                      <button onClick={() => changeStatus(b.id, "COMPLETED")} className="text-blue-600 hover:underline cursor-pointer">
                        Mark Done
                      </button>
                    )}
                    {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                      <button onClick={() => changeStatus(b.id, "CANCELLED")} className="text-rose-600 hover:underline cursor-pointer">
                        Cancel
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`tel:${b.customerPhone}`} className="text-purple-600 hover:underline">
                      Call
                    </a>
                    <button onClick={() => handleDelete(b.id)} className="text-slate-300 hover:text-rose-500 cursor-pointer">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
