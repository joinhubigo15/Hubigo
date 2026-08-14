"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, Ticket, X, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardOffers, createDashboardOffer, deleteDashboardOffer, type DashboardOffer } from "@/app/lib/business-dashboard-api";

function isActive(offer: DashboardOffer): boolean {
  return !offer.endDate || new Date(offer.endDate) >= new Date();
}

export default function DealsManagementPage() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const isBusinessAccount = !!user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    if (initializing) return;
    if (!user) router.replace("/login?next=/deals-management");
    else if (!isBusinessAccount) router.replace("/");
  }, [initializing, user, isBusinessAccount, router]);

  const [offers, setOffers] = useState<DashboardOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Active");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newDiscount, setNewDiscount] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  useEffect(() => {
    if (!accessToken) return;
    getDashboardOffers(accessToken)
      .then(setOffers)
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newTitle.trim()) return;
    setSubmitting(true);
    try {
      const offer = await createDashboardOffer(accessToken, {
        title: newTitle.trim(),
        discountLabel: newDiscount.trim() || undefined,
        description: newDescription.trim() || undefined,
        endDate: newEndDate ? new Date(newEndDate).toISOString() : undefined,
      });
      setOffers((prev) => [offer, ...prev]);
      setShowCreateModal(false);
      setNewTitle("");
      setNewDiscount("");
      setNewDescription("");
      setNewEndDate("");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    await deleteDashboardOffer(accessToken, id);
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  const filteredDeals = offers.filter((o) => {
    if (activeTab === "Active") return isActive(o);
    if (activeTab === "Expired") return !isActive(o);
    return true;
  });

  if (initializing || !user || !isBusinessAccount || loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">

      {/* Header & Create Offer CTA */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            Deals & Offers Management
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Publish promotional offers for customers browsing your listing.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Offer</span>
        </button>
      </div>

      {/* Stats row — only real, derivable counts (no fabricated redemption/revenue numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Offers</div>
          <div className="text-xl font-black text-slate-900 mt-1">{offers.length}</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Offers</div>
          <div className="text-xl font-black text-emerald-600 mt-1">{offers.filter(isActive).length}</div>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {["Active", "Expired", "All Offers"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap",
              activeTab === tab
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-slate-400 hover:text-slate-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Offers Cards List */}
      {filteredDeals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center text-xs text-slate-500 font-semibold">
          No offers in this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeals.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-[10px] font-extrabold px-2 py-0.5 rounded-md",
                      isActive(d) ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    )}
                  >
                    ● {isActive(d) ? "Active" : "Expired"}
                  </span>
                  {d.discountLabel && (
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                      {d.discountLabel}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-slate-900 text-sm leading-snug">{d.title}</h3>
                {d.description && <p className="text-xs text-slate-600 font-medium leading-relaxed">{d.description}</p>}

                {d.endDate && (
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1">
                    <Ticket className="w-3.5 h-3.5 text-purple-400" />
                    <span>Valid until {new Date(d.endDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-slate-100 pt-3">
                <button
                  onClick={() => handleDelete(d.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  title="Delete offer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Offer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-600" />
                <span>Create New Offer</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Offer Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 25% OFF on Weekend Dining"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Discount Label
                  </label>
                  <input
                    type="text"
                    placeholder="25% OFF"
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Description (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Terms & description..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-600 font-semibold resize-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim()}
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish Offer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
