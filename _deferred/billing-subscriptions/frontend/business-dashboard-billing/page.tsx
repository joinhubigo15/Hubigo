"use client";

import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { getDashboardBilling, upgradeDashboardPlan, type DashboardBilling, type DashboardSubscription } from "@/app/lib/business-dashboard-api";

const PLAN_INFO: Record<DashboardSubscription["plan"], { label: string; price: number; features: string[] }> = {
  FREE: { label: "Free", price: 0, features: ["Basic listing", "Standard search ranking"] },
  PRO: { label: "Pro", price: 999, features: ["Priority search ranking", "Unlimited CRM leads", "Offers & promotions"] },
  PREMIUM: { label: "Premium", price: 2499, features: ["Everything in Pro", "Featured placement", "Team management"] },
  ENTERPRISE: { label: "Enterprise", price: 7999, features: ["Everything in Premium", "Dedicated account manager", "Custom integrations"] },
};

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  CANCELLED: "bg-rose-100 text-rose-700",
  TRIAL: "bg-amber-100 text-amber-700",
};

export default function BusinessBillingPage() {
  const { accessToken } = useAuth();
  const [billing, setBilling] = useState<DashboardBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardBilling(accessToken)
      .then(setBilling)
      .catch(() => setBilling(null))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleUpgrade = async (plan: DashboardSubscription["plan"]) => {
    if (!accessToken) return;
    setUpgrading(plan);
    try {
      const subscription = await upgradeDashboardPlan(accessToken, plan);
      setBilling((prev) => (prev ? { ...prev, activePlan: plan, activeSubscription: subscription, history: [subscription, ...prev.history] } : prev));
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  const activePlan = billing?.activePlan ?? "FREE";
  const info = PLAN_INFO[activePlan];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm shadow-slate-200/50">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-md">
          Billing & Subscriptions
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Current Plan & History</h1>
        <p className="text-xs text-slate-500 font-semibold">Manage your Hubigo plan tier and view your subscription history.</p>
        <p className="text-[10px] text-amber-600 font-bold mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 inline-block">
          No payment gateway is connected yet — plan changes below are applied directly without a real charge.
        </p>
      </div>

      {/* Active Plan Card */}
      <div className="bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-500/30 px-3 py-1 rounded-full border border-purple-400/30">
            Current Active Plan
          </span>
          <h2 className="text-2xl font-black text-white">{info.label}</h2>
          <p className="text-xs text-slate-300 font-semibold">{info.features.join(" · ")}</p>
        </div>
        <div className="text-left md:text-right space-y-1 shrink-0">
          <div className="text-2xl font-black text-white">
            ₹{info.price.toLocaleString()} <span className="text-xs font-normal text-slate-300">/ month</span>
          </div>
        </div>
      </div>

      {/* Plan Picker */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(PLAN_INFO) as DashboardSubscription["plan"][]).map((plan) => {
          const p = PLAN_INFO[plan];
          const isActive = plan === activePlan;
          return (
            <div key={plan} className={cn("bg-white rounded-2xl border p-5 space-y-3", isActive ? "border-purple-600 shadow-md" : "border-slate-200/90 shadow-2xs")}>
              <h3 className="font-black text-sm text-slate-900">{p.label}</h3>
              <div className="text-xl font-black text-slate-900">
                ₹{p.price.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/mo</span>
              </div>
              <ul className="space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade(plan)}
                disabled={isActive || upgrading === plan}
                className={cn(
                  "w-full py-2 rounded-xl text-xs font-bold cursor-pointer transition-colors",
                  isActive ? "bg-purple-100 text-purple-700 cursor-default" : "bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60",
                )}
              >
                {isActive ? "Current Plan" : upgrading === plan ? "Switching..." : "Switch to this plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Subscription History */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm shadow-slate-200/50 space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Subscription History</h3>
        {!billing || billing.history.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold py-4 text-center">No subscription history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-black uppercase text-slate-400">
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Started</th>
                  <th className="pb-3">Expires</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {billing.history.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3.5 font-bold text-slate-900">{PLAN_INFO[s.plan].label}</td>
                    <td className="py-3.5">{new Date(s.startsAt).toLocaleDateString()}</td>
                    <td className="py-3.5">{s.expiresAt ? new Date(s.expiresAt).toLocaleDateString() : "—"}</td>
                    <td className="py-3.5">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", STATUS_COLOR[s.status])}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
