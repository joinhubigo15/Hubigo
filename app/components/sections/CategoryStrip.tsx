"use client";

import Link from "next/link";
import {
  Building2,
  Stethoscope,
  TestTube,
  Pill,
  HeartPulse,
  LayoutGrid,
} from "lucide-react";

import { cn } from "@/app/lib/utils";

const mainCategories = [
  {
    name: "Hospitals",
    href: "/category/hospitals",
    icon: Building2,
    bgColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
  },
  {
    name: "Doctors & Clinics",
    href: "/category/doctors-clinics",
    icon: Stethoscope,
    bgColor: "bg-sky-100",
    iconColor: "text-sky-600",
  },
  {
    name: "Diagnostics & Labs",
    href: "/category/diagnostic-labs",
    icon: TestTube,
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    name: "Pharmacies",
    href: "/category/pharmacies",
    icon: Pill,
    bgColor: "bg-rose-100",
    iconColor: "text-rose-600",
  },
  {
    name: "Dentists & Dental",
    href: "/category/dentists",
    icon: HeartPulse,
    bgColor: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    name: "All Specialties",
    href: "/category",
    icon: LayoutGrid,
    bgColor: "bg-slate-100",
    iconColor: "text-slate-600",
  },
];

interface CategoryStripProps {
  roundedNone?: boolean;
}

export default function CategoryStrip({ roundedNone = false }: CategoryStripProps) {
  return (
    <section className={cn("relative z-20 shrink-0", roundedNone ? "w-full my-0" : "my-1 px-2 sm:px-4 lg:px-6")}>
      <div className={cn(
        "max-w-5xl mx-auto p-2 lg:bg-transparent lg:border-transparent lg:shadow-none lg:p-0 bg-white",
        roundedNone
          ? "rounded-none border-0 shadow-none p-0 max-w-full"
          : "rounded-xl border border-slate-100 shadow-xs lg:rounded-none"
      )}>
        <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-6 lg:gap-8 text-center justify-items-center">
          {mainCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.name}
                href={cat.href}
                className={cn(
                  "group flex flex-col items-center gap-1.5 p-1 hover:bg-slate-50 lg:hover:bg-transparent transition-all duration-200 w-full min-w-0",
                  roundedNone ? "rounded-none" : "rounded-xl",
                  idx === 5 ? "hidden lg:flex" : "flex"
                )}
              >
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 rounded-full ${cat.bgColor} flex items-center justify-center transition-transform group-hover:scale-110 shadow-2xs lg:shadow-sm shrink-0`}
                >
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 ${cat.iconColor}`} />
                </div>
                <span className="text-[9px] sm:text-[11px] lg:text-xs font-bold text-slate-700 group-hover:text-purple-600 transition-colors leading-tight text-center truncate max-w-full px-1 w-full">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
