"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  PhoneCall,
  MessageSquare,
  Eye,
  Download,
  Filter,
  TrendingUp,
  Search,
  Loader2,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardLeads, updateDashboardLeadStatus, type DashboardLead } from "@/app/lib/business-dashboard-api";

const SOURCE_LABEL: Record<string, string> = {
  VIEW: "Profile View",
  CALL: "Phone Click",
  EMAIL: "Email Enquiry",
  WHATSAPP: "WhatsApp Click",
  FORM: "Contact Form",
};

const STATUS_COLOR: Record<DashboardLead["status"], string> = {
  NEW: "bg-purple-100 text-purple-700",
  CONTACTED: "bg-emerald-100 text-emerald-700",
  CLOSED: "bg-slate-100 text-slate-600",
};

export default function LeadsPage() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const isBusinessAccount = !!user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) router.replace("/login?next=/leads");
    else if (!isBusinessAccount) router.replace("/");
  }, [initializing, user, isBusinessAccount, router]);

  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("All Time");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    getDashboardLeads(accessToken)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  // Date.now() is impure, so the cutoff is computed in the select's onChange handler (an event,
  // not render) and stored as state — never called during rendering.
  const [cutoffMs, setCutoffMs] = useState(0);
  const applyDateFilter = (value: string) => {
    setDateFilter(value);
    const windowMs =
      value === "Today" ? 24 * 60 * 60 * 1000 :
      value === "This Week" ? 7 * 24 * 60 * 60 * 1000 :
      value === "This Month" ? 30 * 24 * 60 * 60 * 1000 :
      Infinity;
    setCutoffMs(windowMs === Infinity ? 0 : Date.now() - windowMs);
  };

  const withinFilter = (createdAt: string) => {
    if (cutoffMs === 0) return true;
    return new Date(createdAt).getTime() >= cutoffMs;
  };

  const filteredLeads = leads.filter((lead) => {
    const name = lead.user?.name ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.message ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.phone ?? "").includes(searchTerm);
    return matchesSearch && withinFilter(lead.createdAt);
  });

  const stats = [
    { label: "Total Leads", value: filteredLeads.length, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Phone Clicks", value: filteredLeads.filter((l) => l.type === "CALL").length, icon: PhoneCall, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "WhatsApp Clicks", value: filteredLeads.filter((l) => l.type === "WHATSAPP").length, icon: MessageSquare, color: "text-green-600", bg: "bg-green-50" },
    { label: "Profile Views", value: filteredLeads.filter((l) => l.type === "VIEW").length, icon: Eye, color: "text-sky-600", bg: "bg-sky-50" },
  ];

  const handleStatusChange = async (leadId: string, status: DashboardLead["status"]) => {
    if (!accessToken) return;
    const updated = await updateDashboardLeadStatus(accessToken, leadId, status);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Phone,Email,Source,Message,Status,Date"]
        .concat(
          filteredLeads.map(
            (l) =>
              `"${l.user?.name ?? "Anonymous"}",${l.phone ?? ""},${l.email ?? ""},${l.type},"${(l.message ?? "").replace(/"/g, "'")}",${l.status},${l.createdAt}`,
          ),
        )
        .join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "hubigo_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (initializing || !user || !isBusinessAccount || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">

      {/* Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            Leads & Enquiries
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Track customer interactions, direct phone clicks, WhatsApp inquiries & profile views.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => applyDateFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>All Time</option>
            </select>
          </div>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Lead Overview Stats Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", stat.bg)}>
                <Icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <div className="text-lg lg:text-xl font-black text-slate-900 leading-none">{stat.value}</div>
                <div className="text-[11px] font-semibold text-slate-400 mt-1">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Leads Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Enquiries & Clicks
          </h3>
          <div className="w-full sm:w-64 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredLeads.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-8 text-center">
              No leads yet — they&apos;ll show up here as customers call, message, or view your listing.
            </p>
          ) : (
            <table className="w-full text-left text-xs font-semibold text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Interaction Type</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">{lead.user?.name ?? "Anonymous"}</td>
                    <td className="py-3.5 px-4 text-purple-600 font-bold">{lead.phone ?? lead.email ?? "—"}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{SOURCE_LABEL[lead.type] ?? lead.type}</td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">{new Date(lead.createdAt).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value as DashboardLead["status"])}
                        className={cn("text-[10px] font-bold px-2 py-1 rounded-md border-0 cursor-pointer focus:outline-none", STATUS_COLOR[lead.status])}
                      >
                        <option value="NEW">New</option>
                        <option value="CONTACTED">Contacted</option>
                        <option value="CLOSED">Closed</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-600 font-bold rounded-lg transition-colors cursor-pointer text-[11px] inline-block"
                        >
                          Contact
                        </a>
                      ) : lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-600 font-bold rounded-lg transition-colors cursor-pointer text-[11px] inline-block"
                        >
                          Contact
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
