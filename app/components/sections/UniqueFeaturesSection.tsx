"use client";

import { Sparkles, Zap, ShieldCheck, Percent } from "lucide-react";

const uniqueFeatures = [
  {
    icon: Sparkles,
    title: "AI-Powered Discovery",
    description: "Smart search algorithms tailored to your exact neighborhood & preferences.",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    badge: "Smart Search",
  },
  {
    icon: Zap,
    title: "Direct WhatsApp Connect",
    description: "Instant direct chat with business owners. No middleman delays or commissions.",
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    badge: "Instant Access",
  },
  {
    icon: ShieldCheck,
    title: "100% Verified Merchants",
    description: "Rigorous multi-point verification process ensuring authentic local services.",
    bgColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    badge: "Verified Trust",
  },
  {
    icon: Percent,
    title: "Zero-Commission Deals",
    description: "Exclusive discounts & local offers passed directly from owners to you.",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
    badge: "Best Savings",
  },
];

export default function UniqueFeaturesSection() {
  return (
    <section className="px-3 lg:px-6 my-6 shrink-0">
      <div className="max-w-6xl mx-auto bg-gradient-to-br from-purple-50/80 via-white to-indigo-50/60 border border-purple-100 rounded-2xl p-5 lg:p-6 shadow-xs">
        {/* Header inside separate container */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5 pb-4 border-b border-purple-100/60">
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-100/80 px-2.5 py-0.5 rounded-full">
              Platform Advantages
            </span>
            <h2 className="text-sm sm:text-base lg:text-lg font-black text-slate-900 mt-1">
              Why Hubigo Stands Out
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-sm">
            Unique features built to revolutionize how you discover & connect with local businesses.
          </p>
        </div>

        {/* Standalone Row of 4 Cards — 2 cols Mobile, 4 cols Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          {uniqueFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-slate-100 p-4 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between gap-3 group"
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`w-9 h-9 rounded-xl ${f.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-xs`}
                  >
                    <Icon className={`w-4 h-4 ${f.iconColor}`} />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    {f.badge}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-900 text-xs group-hover:text-purple-600 transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    {f.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
