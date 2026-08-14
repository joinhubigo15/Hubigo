"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("yearly");

  const plans = [
    {
      name: "Starter",
      priceMonthly: 0,
      priceYearly: 0,
      subtitle: "Basic listing with limited features",
      features: [
        "Basic Listing",
        "1 Photo",
        "Business Info",
        "Location on Map",
      ],
      popular: false,
      cta: "Get Started",
    },
    {
      name: "Growth",
      priceMonthly: 499,
      priceYearly: 399, // 20% discount on yearly
      subtitle: "For growing businesses",
      features: [
        "Everything in Starter",
        "5 Photos",
        "Featured Listing",
        "Customer Reviews",
        "Insights",
      ],
      popular: true,
      cta: "Get Started",
    },
    {
      name: "Premium",
      priceMonthly: 1499,
      priceYearly: 1199, // 20% discount on yearly
      subtitle: "For premium businesses",
      features: [
        "Everything in Growth",
        "Unlimited Photos",
        "Top Priority Listing",
        "Leads & Analytics",
        "Priority Support",
      ],
      popular: false,
      cta: "Get Started",
    },
  ];

  return (
    <div className="bg-slate-50/60 min-h-screen px-4 lg:px-8 py-6 flex flex-col gap-6">
      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs text-center space-y-3 relative overflow-hidden">
        <div className="absolute left-0 top-0 w-24 h-24 bg-purple-50 rounded-full blur-2xl opacity-75" />
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60" />

        <div className="space-y-1.5 z-10 relative">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight">
            List Your Business on Hubigo
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed font-semibold">
            Choose the perfect plan to grow your business and reach more customers.
          </p>
        </div>

        {/* Billing Period Switcher Toggle */}
        <div className="flex items-center justify-center pt-2 z-10 relative">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                billingPeriod === "monthly"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("yearly")}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                billingPeriod === "yearly"
                  ? "bg-white text-slate-900 shadow-sm"
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
      </div>

      {/* Pricing Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const price = billingPeriod === "yearly" ? p.priceYearly : p.priceMonthly;
          return (
            <div
              key={p.name}
              className={cn(
                "bg-white rounded-2xl border p-5 flex flex-col justify-between relative shadow-xs transition-all duration-300 hover:shadow-md",
                p.popular
                  ? "border-purple-600 ring-2 ring-purple-100"
                  : "border-slate-100"
              )}
            >
              {/* Popular Pill Label */}
              {p.popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2 bg-purple-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  <span>Popular</span>
                </div>
              )}

              <div>
                {/* Plan Header details */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-base">{p.name}</h3>
                  <p className="text-[11px] font-semibold text-slate-400">{p.subtitle}</p>
                </div>

                {/* Price Label */}
                <div className="my-5 flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">
                    {price === 0 ? "Free" : `₹${price}`}
                  </span>
                  {price !== 0 && (
                    <span className="text-slate-400 text-xs font-bold">/ Month</span>
                  )}
                  {price === 0 && (
                    <span className="text-slate-400 text-xs font-bold">/ Lifetime</span>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-3.5 border-t border-slate-100 pt-5">
                  {p.features.map((f, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-600 font-semibold">
                      <div className="w-4 h-4 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action CTA Button */}
              <div className="mt-8">
                <button
                  className={cn(
                    "w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer",
                    p.popular
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-md"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                  )}
                >
                  {p.cta}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtext info */}
      <div className="text-center text-[10px] sm:text-xs text-slate-400 font-semibold mt-2">
        All plans come with a 7-day free trial. Cancel anytime.
      </div>
    </div>
  );
}
