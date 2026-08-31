"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

const popularBrands = [
  {
    name: "Manipal Hospitals",
    query: "Manipal",
    bgColor: "bg-emerald-600",
    borderColor: "border-emerald-600",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center text-white font-black">
        <span className="text-[7px] sm:text-[9px] tracking-tight leading-none">MANIPAL</span>
        <span className="text-[5px] font-semibold uppercase tracking-widest leading-none mt-0.5">HOSPITALS</span>
      </div>
    ),
  },
  {
    name: "Apollo Healthcare",
    query: "Apollo",
    bgColor: "bg-white",
    borderColor: "border-slate-200",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center">
        <span className="text-[7px] sm:text-[9px] font-black text-teal-800 tracking-tight leading-none">Apollo</span>
        <span className="text-[5px] font-semibold text-slate-500 uppercase tracking-widest leading-none mt-0.5">HEALTH</span>
      </div>
    ),
  },
  {
    name: "Fortis Healthcare",
    query: "Fortis",
    bgColor: "bg-blue-700",
    borderColor: "border-blue-700",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center text-white font-black">
        <span className="text-[7px] sm:text-[9px] tracking-wider leading-none">FORTIS</span>
        <span className="text-[5px] font-semibold uppercase tracking-widest leading-none mt-0.5">CARE</span>
      </div>
    ),
  },
  {
    name: "SRL Diagnostics",
    query: "SRL",
    bgColor: "bg-purple-700",
    borderColor: "border-purple-700",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex items-center justify-center text-white font-black text-[8px] sm:text-[10px] tracking-widest">
        SRL
      </div>
    ),
  },
  {
    name: "Cloudnine Care",
    query: "Cloudnine",
    bgColor: "bg-pink-600",
    borderColor: "border-pink-600",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex items-center justify-center text-white font-black text-[7px] sm:text-[9px] tracking-wider">
        CLOUD9
      </div>
    ),
  },
  {
    name: "MedPlus Pharmacy",
    query: "MedPlus",
    bgColor: "bg-red-600",
    borderColor: "border-red-600",
    logo: (
      <div aria-hidden="true" className="w-full h-full flex items-center justify-center text-white font-black text-[7px] sm:text-[9px] tracking-wider">
        MEDPLUS
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
            Popular HealthCares & Brands
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
