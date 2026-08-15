"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Menu } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import CityPickerPill from "@/app/components/layout/CityPickerPill";

/** Strictly 3-4 words + name (if authenticated) */
function getGreetingPhraseForTime(userName?: string | null): string {
  const firstName = userName ? userName.trim().split(" ")[0] : null;
  const hour = new Date().getHours();

  if (firstName) {
    if (hour >= 4 && hour < 12) return `Good morning, ${firstName}! ☀️`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${firstName}! 🌤️`;
    if (hour >= 17 && hour < 22) return `Good evening, ${firstName}! 🌆`;
    return `Welcome back, ${firstName}! 👋`;
  }

  if (hour >= 4 && hour < 12) return "Good morning! ☀️";
  if (hour >= 12 && hour < 17) return "Good afternoon! 🌤️";
  if (hour >= 17 && hour < 22) return "Good evening! 🌆";
  return "Welcome to Hubigo! ✨";
}

export default function HeroBannerSection() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const router = useRouter();

  const handleSearch = () => {
    const query = searchQuery.trim();
    const params = new URLSearchParams();
    if (query) params.set("q", query);

    router.push(`/search?${params.toString()}`);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const [currentGreeting, setCurrentGreeting] = useState(() => getGreetingPhraseForTime(user?.name));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing greeting to the current name/hour on mount is intentional
    setCurrentGreeting(getGreetingPhraseForTime(user?.name));
    const interval = setInterval(() => {
      setCurrentGreeting(getGreetingPhraseForTime(user?.name));
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.name]);

  const searchBarCard = (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200/90 p-1.5 sm:p-2 flex items-center gap-1.5">
      <div className="flex-1 flex items-center px-3.5 py-1">
        <input
          type="text"
          placeholder="Search for businesses, services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
        />
      </div>

      <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

      <div className="shrink-0 hidden sm:block">
        <CityPickerPill size="sm" />
      </div>

      <button
        onClick={handleSearch}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center gap-1.5 shadow-sm shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
      >
        <Search className="w-3.5 h-3.5 stroke-[2.5]" />
        <span className="hidden sm:inline">Search</span>
      </button>
    </div>
  );

  return (
    <section className="px-4 sm:px-4 lg:px-6 mt-2 lg:mt-0 mb-1 lg:mb-2 shrink-0">
      <div className="max-w-6xl mx-auto relative">

        {/* Top Header Row in Mobile View */}
        <div className="lg:hidden flex items-center justify-between mb-3 pt-1">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <Image src="/logo.png" alt="Hubigo" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-sm font-black tracking-tight text-slate-900">
              HUB<span className="text-purple-600">IGO</span>
            </span>
          </div>

          {/* Location & Menu */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <CityPickerPill size="xs" />
          </div>
        </div>

        {/* Hero Grid Content — Scaled & Compact Per UI Rules */}
        <div className="grid grid-cols-12 gap-3 items-start pt-2 lg:pt-0">
          {/* Left Text Column */}
          <div className="col-span-7 space-y-2">
            {/* Greeting Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 lg:px-3 py-1 rounded-full bg-white/90 border border-purple-200/80 text-purple-900 text-[10px] sm:text-xs font-extrabold shadow-2xs">
              <Sparkles className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-purple-600 shrink-0" />
              <span className="truncate">{currentGreeting}</span>
            </div>

            {/* Clean HTML Headline with ZERO Overlap */}
            <div className="space-y-1 lg:space-y-2">
              <h1 className="text-base sm:text-xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Find. Connect.
                <br />
                Grow with <span className="text-purple-600">Hubigo.</span>
              </h1>
              <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-slate-500 max-w-sm lg:max-w-md leading-snug">
                Discover trusted local businesses and services near you.
              </p>
            </div>

            {/* Desktop-only search bar — lives directly under the paragraph in normal document
                flow (not a separate grid row), so it isn't pushed down by the taller image
                column on the right. See the lg:hidden copy below for mobile/tablet. */}
            <div className="hidden lg:block max-w-2xl mt-6">
              {searchBarCard}
            </div>
          </div>

          {/* Right Hero Image — hosted on R2 (profile-pics bucket), pure white background
              blended flat via mix-blend-multiply against the page's off-white background.
              This is the page's LCP element, so it goes through next/image (responsive
              srcset + WebP/AVIF + priority preload) instead of a raw <img> — the raw tag was
              shipping the full 900x667 JPEG (134KB) at a ~170px-tall display size, tanking
              mobile PageSpeed's LCP score. */}
          <div className="col-span-5 relative flex items-center justify-center overflow-visible">
            <Image
              src="https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/whitehero-crop.jpeg"
              alt="Discover local businesses"
              width={900}
              height={667}
              priority
              sizes="(min-width: 1024px) 320px, (min-width: 640px) 260px, 200px"
              className="w-full h-auto max-h-[170px] sm:max-h-[200px] lg:max-h-[250px] object-contain mix-blend-multiply lg:scale-105 lg:translate-x-2 transition-transform duration-300"
            />
          </div>
        </div>

        {/* Floating Search Bar — Mobile/Tablet only (own full-width row below the grid);
            desktop uses the copy nested under the paragraph above. */}
        <div className="lg:hidden mt-3 sm:mt-4 max-w-2xl">
          {searchBarCard}
        </div>

      </div>
    </section>
  );
}
