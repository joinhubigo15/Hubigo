"use client";

import { useState } from "react";
import {
  Sparkles,
  Check,
  CreditCard,
  Download,
  Calendar,
  Zap,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function SubscriptionManagementPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const currentPlan = {
    name: "Growth Plan",
    price: billingPeriod === "yearly" ? 399 : 499,
    billingCycle: billingPeriod === "yearly" ? "Yearly (Billed ₹4,788/yr)" : "Monthly",
    status: "Active",
    renewsOn: "15 August 2026",
    daysRemaining: 18,
    progressPercentage: 60,
  };

  const invoices = [
    { id: "INV-2026-004", date: "15 Jul 2026", amount: "₹499.00", status: "Paid", pdf: "#" },
    { id: "INV-2026-003", date: "15 Jun 2026", amount: "₹499.00", status: "Paid", pdf: "#" },
    { id: "INV-2026-002", date: "15 May 2026", amount: "₹499.00", status: "Paid", pdf: "#" },
  ];

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">
      
      {/* Page Title Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Business Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            Subscription Management
          </h1>
          <p className="text-xs text-slate-500 font-semibold">
            Manage your plan, upgrade capabilities, check billing history & invoices.
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            onClick={() => setBillingPeriod("monthly")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              billingPeriod === "monthly"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod("yearly")}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              billingPeriod === "yearly"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            )}
          >
            <span>Yearly</span>
            <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded-md">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Current Plan Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 via-[#130d2a] to-slate-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        <div className="md:col-span-8 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              ● {currentPlan.status} Plan
            </span>
            <span className="text-xs text-slate-300 font-semibold">
              Renews on {currentPlan.renewsOn}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">{currentPlan.name}</h2>
          <p className="text-xs text-slate-300 font-medium max-w-lg leading-relaxed">
            Your plan includes Featured Listings, 5 High-Res Photos, Customer Review Analytics, and Direct WhatsApp Leads.
          </p>

          {/* Days remaining progress bar */}
          <div className="space-y-1.5 pt-2 max-w-md">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
              <span>Billing Cycle Progress</span>
              <span>{currentPlan.daysRemaining} days remaining</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all"
                style={{ width: `${currentPlan.progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="md:col-span-4 flex flex-col gap-2 justify-center items-start md:items-end">
          <div className="text-right">
            <span className="text-3xl font-black text-white">₹{currentPlan.price}</span>
            <span className="text-xs text-slate-400 font-semibold"> / month</span>
          </div>
          <button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer">
            <span>Upgrade to Premium</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button className="text-[11px] font-semibold text-slate-400 hover:text-rose-400 transition-colors pt-1">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Feature Comparison & Upgrade Plans */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-6">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Available Subscription Plans
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "Free",
              period: "Lifetime",
              subtitle: "Basic listing for new businesses",
              features: ["Basic Listing", "1 Photo", "Business Info", "Map Location"],
              active: false,
            },
            {
              name: "Growth",
              price: `₹${billingPeriod === "yearly" ? 399 : 499}`,
              period: "/ Month",
              subtitle: "For growing local businesses",
              features: [
                "Everything in Starter",
                "5 High-Res Photos",
                "Featured Listing Pill",
                "Customer Reviews Reply",
                "WhatsApp Leads Analytics",
              ],
              active: true,
            },
            {
              name: "Premium",
              price: `₹${billingPeriod === "yearly" ? 1199 : 1499}`,
              period: "/ Month",
              subtitle: "Top priority visibility & max leads",
              features: [
                "Everything in Growth",
                "Unlimited Photos",
                "Top Priority Search Spot",
                "Lead Export & Analytics",
                "24/7 Dedicated Support",
              ],
              active: false,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-2xl border p-5 flex flex-col justify-between space-y-4 transition-all duration-300",
                plan.active
                  ? "border-purple-600 bg-purple-50/20 ring-2 ring-purple-100"
                  : "border-slate-100 bg-white hover:border-slate-200"
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-base">{plan.name}</h4>
                  {plan.active && (
                    <span className="text-[9px] font-black uppercase text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-semibold leading-tight">{plan.subtitle}</p>

                <div className="pt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-400 font-bold">{plan.period}</span>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={plan.active}
                className={cn(
                  "w-full py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  plan.active
                    ? "bg-slate-100 text-slate-400 cursor-default"
                    : "bg-purple-600 hover:bg-purple-700 text-white shadow-xs"
                )}
              >
                {plan.active ? "Active Plan" : "Upgrade to " + plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History & Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Payment History & Invoices
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-semibold text-slate-700">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50">
                <th className="py-3 px-4">Invoice ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Invoice PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-extrabold text-slate-900">{inv.id}</td>
                  <td className="py-3.5 px-4 text-slate-500">{inv.date}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{inv.amount}</td>
                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => alert("Downloading invoice PDF...")}
                      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-bold transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
