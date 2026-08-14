"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Phone, Building2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { AdBusiness } from "@/app/lib/search-api";

const AUTO_ADVANCE_MS = 4500;

interface AdCarouselProps {
  ads: AdBusiness[];
}

export default function AdCarousel({ ads }: AdCarouselProps) {
  if (ads.length === 0) return null;
  // Keying on the actual ad ids (not just array identity) remounts the slides below whenever the
  // ad set genuinely changes, which resets to the first slide "for free" — no ref/effect needed
  // to detect the change, avoiding the render-time ref mutation React Compiler disallows here.
  return <AdCarouselSlides key={ads.map((ad) => ad.id).join(",")} ads={ads} />;
}

function AdCarouselSlides({ ads }: AdCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || ads.length <= 1) return;
    timerRef.current = setInterval(() => {
      setIndex((prev) => (prev + 1) % ads.length);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused, ads.length]);

  return (
    <div
      className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-3 left-3 z-20 bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-wider text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
        Sponsored
      </div>

      {ads.map((ad, i) => (
        <Link
          key={ad.id}
          href={`/business/${ad.slug}`}
          className={cn(
            "absolute inset-0 transition-opacity duration-500",
            i === index ? "opacity-100 z-10" : "opacity-0 pointer-events-none"
          )}
        >
          {ad.coverImageUrl ? (
            <img src={ad.coverImageUrl} alt={ad.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
              <Building2 className="w-10 h-10 text-purple-300" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/85 via-slate-900/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-white font-black text-sm sm:text-base truncate drop-shadow-sm">{ad.name}</h3>
              <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold mt-0.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{ad.phone}</span>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 bg-white text-purple-700 text-[11px] font-extrabold rounded-lg shadow-md">
              View
            </span>
          </div>
        </Link>
      ))}

      {ads.length > 1 && (
        <div className="absolute bottom-2 right-3 z-20 flex items-center gap-1.5">
          {ads.map((ad, i) => (
            <button
              key={ad.id}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              aria-label={`Show ad ${i + 1}`}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all cursor-pointer",
                i === index ? "bg-white w-4" : "bg-white/50"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
