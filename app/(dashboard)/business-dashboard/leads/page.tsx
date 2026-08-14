"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Download,
  Phone,
  Mail,
  MessageSquare,
  X,
  Loader2,
  Target,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardLeads, updateDashboardLeadStatus, type DashboardLead } from "@/app/lib/business-dashboard-api";

const statusColors: Record<DashboardLead["status"], string> = {
  NEW: "bg-purple-100 text-purple-700 border-purple-200",
  CONTACTED: "bg-blue-100 text-blue-700 border-blue-200",
  CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
};

const SOURCE_LABEL: Record<string, string> = {
  VIEW: "Profile View",
  CALL: "Phone Call",
  EMAIL: "Email Enquiry",
  WHATSAPP: "WhatsApp Click",
  FORM: "Contact Form",
};

export default function BusinessLeadsPage() {
  const { accessToken } = useAuth();
  const [leads, setLeads] = useState<DashboardLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [selectedLead, setSelectedLead] = useState<DashboardLead | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardLeads(accessToken)
      .then(setLeads)
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const filteredLeads = leads.filter((lead) => {
    const name = lead.user?.name ?? "";
    const matchesSearch =
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.message ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone ?? "").includes(searchQuery);
    const matchesStatus = statusFilter === "All" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (leadId: string, status: DashboardLead["status"]) => {
    if (!accessToken) return;
    const updated = await updateDashboardLeadStatus(accessToken, leadId, status);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    setSelectedLead(updated);
  };

  const exportCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Name,Phone,Email,Source,Competitor Of,Message,Status,Date"]
        .concat(
          filteredLeads.map(
            (l) =>
              `"${l.user?.name ?? "Anonymous"}",${l.phone ?? ""},${l.email ?? ""},${l.type},"${l.sourceBusiness?.name ?? ""}","${(l.message ?? "").replace(/"/g, "'")}",${l.status},${l.createdAt}`,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-none">
              Lead CRM Portal
            </span>
            <span className="text-[10px] font-bold text-slate-400">{filteredLeads.length} Leads Total</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Customer Leads & Inquiries</h1>
          <p className="text-xs text-slate-500 font-semibold">Track calls, emails, WhatsApp clicks, and form enquiries from your listing.</p>
        </div>

        <button
          onClick={exportCSV}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-50/50 border-b border-slate-200/90 p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search lead name, phone, or message..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none w-full md:w-auto px-1">
          {["All", "NEW", "CONTACTED", "CLOSED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-none text-xs font-bold transition-all cursor-pointer",
                statusFilter === st ? "bg-purple-600 text-white shadow-none" : "bg-[#f8fafc] text-slate-600 hover:bg-slate-100",
              )}
            >
              {st === "All" ? "All" : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* CRM Leads Table */}
      <div className="bg-white p-6 lg:p-8 flex-1 w-full overflow-x-auto">
        {filteredLeads.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold py-8 text-center">No leads yet — they'll show up here as customers call, message, or fill out your contact form.</p>
        ) : (
          <table className="w-full text-left text-xs text-slate-700">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="pb-2 sm:pb-3 px-2">Lead</th>
                <th className="hidden sm:table-cell pb-3 px-2">Message</th>
                <th className="hidden sm:table-cell pb-3 px-2">Source</th>
                <th className="pb-2 sm:pb-3 px-2">Status</th>
                <th className="hidden md:table-cell pb-3 px-2">Date</th>
                <th className="pb-2 sm:pb-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-purple-50/30 transition-colors">
                  <td className="py-2.5 sm:py-3.5 px-2 min-w-[100px]">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-1.5">
                      <span className="font-extrabold text-slate-900 truncate">{lead.user?.name ?? "Anonymous"}</span>
                      {lead.sourceBusiness && (
                        <span
                          title={`Was checking out ${lead.sourceBusiness.name} nearby`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-none text-[9px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-700 border border-amber-200 self-start"
                        >
                          <Target className="w-2.5 h-2.5" /> Competitor
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate max-w-[100px] sm:max-w-none">{lead.phone ?? lead.email ?? "—"}</div>
                  </td>
                  <td className="hidden sm:table-cell py-3.5 px-2 text-slate-600 font-medium max-w-[120px] lg:max-w-xs truncate">{lead.message ?? "—"}</td>
                  <td className="hidden sm:table-cell py-3.5 px-2 text-slate-500 font-medium">{SOURCE_LABEL[lead.type] ?? lead.type}</td>
                  <td className="py-2.5 sm:py-3.5 px-2">
                    <span className={cn("px-1.5 sm:px-2.5 py-0.5 rounded-none text-[9px] sm:text-[10px] font-extrabold border whitespace-nowrap", statusColors[lead.status])}>{lead.status}</span>
                  </td>
                  <td className="hidden md:table-cell py-3.5 px-2 text-slate-500 font-medium">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="py-2.5 sm:py-3.5 px-2 text-right">
                    <button
                      onClick={() => setSelectedLead(lead)}
                      className="px-2 py-1.5 sm:px-3 sm:py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[10px] sm:text-xs rounded-none sm:rounded-none transition-colors cursor-pointer whitespace-nowrap"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Slide-Over Drawer for Lead Details */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white h-full p-6 space-y-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-purple-600 uppercase">{SOURCE_LABEL[selectedLead.type] ?? selectedLead.type}</span>
                <h3 className="text-lg font-black text-slate-900">{selectedLead.user?.name ?? "Anonymous"}</h3>
              </div>
              <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-none text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedLead.sourceBusiness && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-none">
                <Target className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 font-semibold leading-snug">
                  Competitor lead — this person was checking out <span className="font-black">{selectedLead.sourceBusiness.name}</span>, a nearby business in your category. You&apos;re one of the 2 closest paid listings, so they might be worth reaching out to.
                </p>
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-[10px]">Contact Info</h4>
                {selectedLead.phone && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.phone}</span>
                  </div>
                )}
                {selectedLead.email && (
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{selectedLead.email}</span>
                  </div>
                )}
                {!selectedLead.phone && !selectedLead.email && <p className="text-slate-400">No contact details captured.</p>}
              </div>

              {selectedLead.message && (
                <div className="space-y-2">
                  <h4 className="font-extrabold text-slate-900 uppercase text-[10px] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Message
                  </h4>
                  <p className="p-3 bg-[#f8fafc] rounded-none border border-slate-200 text-slate-700">{selectedLead.message}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase text-[10px]">Update Status</h4>
                <div className="flex gap-2">
                  {(["NEW", "CONTACTED", "CLOSED"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(selectedLead.id, s)}
                      className={cn(
                        "flex-1 py-2 rounded-none text-[11px] font-bold border cursor-pointer transition-colors",
                        selectedLead.status === s ? statusColors[s] : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50",
                      )}
                    >
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-2">
              {selectedLead.phone && (
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-none flex items-center justify-center gap-1.5 shadow-none"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Lead</span>
                </a>
              )}
              <button onClick={() => setSelectedLead(null)} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none cursor-pointer">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
