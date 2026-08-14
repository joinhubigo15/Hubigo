"use client";

import { ShieldCheck, MessageCircle, Star, Compass } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "100% Verified Businesses",
    description: "Every business profile is manually checked and verified for authenticity.",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    icon: MessageCircle,
    title: "Direct WhatsApp & Call",
    description: "Connect directly with owners without middlemen or hidden booking fees.",
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    icon: Star,
    title: "Genuine Customer Reviews",
    description: "Read real feedback and ratings from customers who visited the business.",
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: Compass,
    title: "Smart Distance Discovery",
    description: "Locate services in your exact neighborhood within custom kilometer radii.",
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
  },
];

export default function WhyChooseSection() {
  return (
    <section className="px-4 lg:px-6 my-6 shrink-0">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-xl mx-auto mb-6 space-y-1">
          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest bg-purple-50 px-2.5 py-1 rounded-full">
            Why Choose Us
          </span>
          <h2 className="text-lg lg:text-xl font-black text-slate-900">
            Why Millions Trust Hubigo
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Discover how Hubigo helps you find verified local businesses with ease.
          </p>
        </div>

        {/* 4 Feature Cards Grid — 2 cols Mobile, 4 cols Desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col gap-3 group"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${f.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs`}
                >
                  <Icon className={`w-5 h-5 ${f.iconColor}`} />
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
