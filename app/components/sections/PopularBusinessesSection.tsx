"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

const popularBrands = [
  {
    name: "Domino's Pizza",
    query: "Domino's",
    bgColor: "bg-white",
    borderColor: "border-slate-100",
    logo: (
      <div className="w-full h-full flex items-center justify-center p-0.5">
        <svg viewBox="0 0 100 100" className="w-5 h-5 sm:w-6 sm:h-6">
          <rect x="25" y="25" width="50" height="50" rx="10" transform="rotate(45 50 50)" fill="#0078AE" />
          <path d="M 25,25 L 75,75" stroke="#FFFFFF" strokeWidth="4" transform="rotate(45 50 50)" />
          <circle cx="40" cy="35" r="5" fill="#E31837" />
          <circle cx="65" cy="60" r="5" fill="#E31837" />
        </svg>
      </div>
    ),
  },
  {
    name: "Reliance SMART",
    query: "Reliance",
    bgColor: "bg-white",
    borderColor: "border-slate-100",
    logo: (
      <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center">
        <span className="text-[6px] font-black text-red-600 tracking-tighter leading-none">Reliance</span>
        <span className="text-[7px] font-extrabold text-blue-800 tracking-tight leading-none mt-0.5">SMART</span>
      </div>
    ),
  },
  {
    name: "KFC",
    query: "KFC",
    bgColor: "bg-red-600",
    borderColor: "border-red-600",
    logo: (
      <div className="w-full h-full flex items-center justify-center text-white font-black text-[9px] sm:text-xs tracking-wider">
        KFC
      </div>
    ),
  },
  {
    name: "Apollo Pharmacy",
    query: "Apollo",
    bgColor: "bg-white",
    borderColor: "border-slate-100",
    logo: (
      <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center">
        <span className="text-[7px] font-black text-teal-600 tracking-tight leading-none">Apollo</span>
        <span className="text-[5px] font-semibold text-slate-500 uppercase tracking-widest leading-none mt-0.5">PHARMACY</span>
      </div>
    ),
  },
  {
    name: "Decathlon",
    query: "Decathlon",
    bgColor: "bg-[#0082C3]",
    borderColor: "border-[#0082C3]",
    logo: (
      <div className="w-full h-full flex items-center justify-center text-white font-black text-[7px] sm:text-[8px] tracking-wider italic px-0.5">
        DECATHLON
      </div>
    ),
  },
  {
    name: "Starbucks",
    query: "Starbucks",
    bgColor: "bg-[#00704A]",
    borderColor: "border-[#00704A]",
    logo: (
      <div className="w-full h-full flex items-center justify-center text-white font-black text-[7px] sm:text-[9px] tracking-widest uppercase">
        SB
      </div>
    ),
  },
];

export default function PopularBusinessesSection() {
  return (
    <section className="px-2 sm:px-4 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900">
            Popular Businesses
          </h2>
          <Link
            href="/search"
            className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* 6 Brand Logos Row */}
        <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 lg:gap-8 justify-items-center">
          {popularBrands.map((brand, idx) => (
            <Link
              key={brand.name}
              href={`/search?q=${encodeURIComponent(brand.query)}`}
              className={cn(
                "group flex flex-col items-center gap-1.5 text-center w-full",
                idx === 5 ? "hidden lg:flex" : "flex"
              )}
            >
              {/* Circle Logo Badge */}
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-14 lg:h-14 rounded-full ${brand.bgColor} border ${brand.borderColor} shadow-xs lg:shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 flex items-center justify-center overflow-hidden p-0.5 shrink-0`}
              >
                {brand.logo}
              </div>

              {/* Brand Name */}
              <span className="text-[8px] min-[380px]:text-[9px] sm:text-[10px] lg:text-sm font-bold text-slate-700 group-hover:text-purple-600 transition-colors leading-tight text-center">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
