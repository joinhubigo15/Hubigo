"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Sparkles, Menu, MessageSquare } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import CityPickerPill from "@/app/components/layout/CityPickerPill";
import NotificationBell from "@/app/components/ui/NotificationBell";
import { resolveTopSearchOrFallback, TOP_X_IN_Y_PATTERN } from "@/app/lib/search-api";

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

  const goToSearch = (query: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = () => {
    const query = searchQuery.trim();

    // "Top X in Y" / "Best X in Y" queries route straight to the matching pSEO page instead of
    // the search results page — this is the only entry point into those pages besides a direct
    // link, so it has to be wired here as well as in SearchInputBar (used on the /search page).
    if (TOP_X_IN_Y_PATTERN.test(query)) {
      resolveTopSearchOrFallback(query).then((result) => {
        if (result.path !== null) router.push(result.path);
        else goToSearch(result.fallback);
      });
      return;
    }

    goToSearch(query);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  // Starts with a fixed, locale/time-independent value so server and client render identically on
  // first paint — the server's clock (Railway, UTC) and the browser's (local) can disagree on
  // which hour it is right around day/night boundaries, which caused a hydration mismatch here.
  // The real greeting is filled in immediately after mount via the effect below.
  const [currentGreeting, setCurrentGreeting] = useState("Welcome to Hubigo! ✨");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing greeting to the current name/hour on mount is intentional
    setCurrentGreeting(getGreetingPhraseForTime(user?.name));
    const interval = setInterval(() => {
      setCurrentGreeting(getGreetingPhraseForTime(user?.name));
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.name]);

  const searchBarCard = (
    <div className="bg-white rounded-2xl shadow-sm border border-purple-300/80 hover:border-purple-400 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/10 p-1.5 sm:p-2 flex items-center gap-2 transition-all">
      <div className="flex-1 flex items-center px-3.5 py-1">
        <input
          type="text"
          placeholder="Search Doctors, Hospitals, Clinics, Diagnostic Labs, Pharmacies..."
          value={searchQuery}
          onChange={(e) => {
            const v = e.target.value;
            setSearchQuery(v ? v.charAt(0).toUpperCase() + v.slice(1) : "");
          }}
          onKeyDown={handleSearchKeyDown}
          autoCapitalize="words"
          className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none capitalize"
        />
      </div>

      <div className="h-6 w-px bg-slate-200 shrink-0 hidden sm:block" />

      <div className="shrink-0 hidden sm:block">
        <CityPickerPill size="sm" />
      </div>

      <button
        onClick={handleSearch}
        aria-label="Search"
        className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs px-5 sm:px-6 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shrink-0"
      >
        <Search className="w-4 h-4 stroke-[2.5]" />
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

          {/* Location & Website Notification Center */}
          <div className="flex items-center gap-2 mt-0.5">
            <CityPickerPill size="xs" />
            <NotificationBell size="sm" />
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
                Find Top Hospitals,
                <br />
                Doctors & <span className="text-purple-600">Healthcare.</span>
              </h1>
              <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-slate-500 max-w-sm lg:max-w-md leading-snug">
                Discover trusted hospitals, clinics, specialist doctors, diagnostic labs & pharmacies near you.
              </p>
            </div>

            {/* Desktop-only search bar */}
            <div className="hidden lg:block max-w-2xl mt-6">
              {searchBarCard}
            </div>
          </div>

          {/* Right Hero Image — Vector Healthcare Illustration with Real Foreign Doctor Face */}
          <div className="col-span-5 relative flex items-center justify-center overflow-visible">
            <Image
              src="/healthcare-hero-v4.jpg"
              alt="Hubigo Healthcare - Verified Doctors & Hospitals"
              width={900}
              height={667}
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 340px, (min-width: 640px) 300px, 240px"
              className="w-full h-auto max-h-[220px] sm:max-h-[250px] lg:max-h-[240px] object-contain mix-blend-multiply scale-110 sm:scale-115 lg:scale-100 lg:translate-x-0 transition-transform duration-300"
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
