"use client";

import Link from "next/link";
import { ArrowRight, Pill, Croissant, Coffee, BookOpen, Wrench, Scissors } from "lucide-react";
import { cn } from "@/app/lib/utils";

// Real subcategory slugs from the taxonomy (backend/prisma/description-templates) — links go
// straight to /search?subcategory=<slug> the same way category chips elsewhere do.
const services = [
  { name: "Pharmacies", slug: "pharmacy", icon: Pill, bgColor: "bg-emerald-100", iconColor: "text-emerald-600" },
  { name: "Bakeries", slug: "bakery", icon: Croissant, bgColor: "bg-amber-100", iconColor: "text-amber-600" },
  { name: "Cafes", slug: "cafe", icon: Coffee, bgColor: "bg-orange-100", iconColor: "text-orange-600" },
  { name: "Coaching Centers", slug: "coaching-center", icon: BookOpen, bgColor: "bg-sky-100", iconColor: "text-sky-600" },
  { name: "Mechanics", slug: "mechanic", icon: Wrench, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  { name: "Salons", slug: "salon", icon: Scissors, bgColor: "bg-pink-100", iconColor: "text-pink-600" },
];

export default function ServicesNearYouSection() {
  return (
    <section className="px-2 sm:px-4 lg:px-6 mt-5 sm:mt-8 mb-2 shrink-0">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs sm:text-sm lg:text-base font-bold text-slate-900">Services Near You</h2>
          <Link
            href="/search?q=Services"
            className="text-[10px] sm:text-[11px] lg:text-xs font-semibold text-purple-600 hover:text-purple-700 flex items-center gap-0.5 transition-colors"
          >
            <span>View More</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-4 lg:gap-8 bg-white lg:bg-transparent rounded-xl lg:rounded-none border lg:border-transparent border-slate-100 shadow-xs lg:shadow-none p-1.5 sm:p-2 lg:p-0">
          {services.map((svc, idx) => {
            const Icon = svc.icon;
            return (
              <Link
                key={svc.slug}
                href={`/search?subcategory=${svc.slug}`}
                className={cn(
                  "group flex flex-col items-center gap-1.5 p-1 rounded-lg hover:bg-slate-50 lg:hover:bg-transparent transition-all duration-200 text-center w-full",
                  idx === 5 ? "hidden lg:flex" : "flex"
                )}
              >
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full ${svc.bgColor} flex items-center justify-center transition-transform group-hover:scale-105 shadow-xs shrink-0`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 ${svc.iconColor}`} />
                </div>
                <span className="text-[9px] sm:text-[10px] lg:text-sm font-bold text-slate-700 group-hover:text-purple-600 transition-colors leading-tight text-center line-clamp-1">
                  {svc.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
