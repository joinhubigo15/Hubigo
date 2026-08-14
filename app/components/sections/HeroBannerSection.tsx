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

  return (
    <section className="px-2 sm:px-4 lg:px-6 mt-0 mb-1 lg:mb-4 shrink-0">
      <div className="max-w-6xl mx-auto relative lg:bg-transparent lg:border-transparent lg:shadow-none lg:p-0 lg:overflow-visible rounded-2xl border border-purple-100/80 shadow-2xs overflow-hidden bg-gradient-to-r from-purple-50/90 via-indigo-50/40 to-purple-50/30 p-3.5 sm:p-5">

        {/* Top Header Row in Mobile View */}
        <div className="lg:hidden flex items-center justify-between mb-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5">
            <Image src="/logo.png" alt="Hubigo" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-sm font-black tracking-tight text-slate-900">
              HUB<span className="text-purple-600">IGO</span>
            </span>
          </div>

          {/* Location & Menu */}
          <div className="flex items-center gap-1.5">
            <CityPickerPill size="xs" />
          </div>
        </div>

        {/* Hero Grid Content — Scaled & Compact Per UI Rules */}
        <div className="grid grid-cols-12 gap-3 items-start pt-2 lg:pt-0">
          {/* Left Text Column */}
          <div className="col-span-8 sm:col-span-7 space-y-2">
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
          </div>

          {/* Right 3D Location Pin & City Artwork */}
          <div className="col-span-4 sm:col-span-5 relative h-24 sm:h-32 lg:h-36 flex items-center justify-center">
            <svg viewBox="0 0 400 260" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMax meet">
              <defs>
                <radialGradient id="heroSunGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fda4af" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#fda4af" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="heroPinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#9333ea" />
                  <stop offset="55%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <linearGradient id="heroGroundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#c4b5fd" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* Sun glow, upper right */}
              <circle cx="340" cy="55" r="46" fill="url(#heroSunGlow)" />
              <circle cx="340" cy="55" r="16" fill="#fecdd3" opacity="0.9" />

              {/* Birds */}
              <path d="M110,45 q6,-8 12,0 q6,-8 12,0" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
              <path d="M260,30 q5,-7 10,0 q5,-7 10,0" stroke="#a78bfa" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />

              {/* City skyline — layered lavender buildings */}
              <g opacity="0.85">
                <rect x="14" y="95" width="28" height="145" rx="2" fill="#ddd6fe" />
                <rect x="48" y="55" width="34" height="185" rx="2" fill="#c4b5fd" />
                <rect x="86" y="110" width="24" height="130" rx="2" fill="#ddd6fe" />
                <rect x="240" y="90" width="26" height="150" rx="2" fill="#ddd6fe" />
                <rect x="270" y="40" width="34" height="200" rx="2" fill="#c4b5fd" />
                <rect x="308" y="105" width="24" height="135" rx="2" fill="#ddd6fe" />
                <rect x="336" y="65" width="28" height="175" rx="2" fill="#a78bfa" opacity="0.7" />
                {/* windows */}
                <g fill="#fff" opacity="0.5">
                  <rect x="56" y="70" width="4" height="4" /><rect x="68" y="70" width="4" height="4" />
                  <rect x="56" y="84" width="4" height="4" /><rect x="68" y="84" width="4" height="4" />
                  <rect x="56" y="98" width="4" height="4" /><rect x="68" y="98" width="4" height="4" />
                  <rect x="56" y="112" width="4" height="4" /><rect x="68" y="112" width="4" height="4" />
                  <rect x="278" y="55" width="4" height="4" /><rect x="290" y="55" width="4" height="4" />
                  <rect x="278" y="69" width="4" height="4" /><rect x="290" y="69" width="4" height="4" />
                  <rect x="278" y="83" width="4" height="4" /><rect x="290" y="83" width="4" height="4" />
                  <rect x="278" y="97" width="4" height="4" /><rect x="290" y="97" width="4" height="4" />
                  <rect x="343" y="80" width="4" height="4" /><rect x="354" y="80" width="4" height="4" />
                  <rect x="343" y="94" width="4" height="4" /><rect x="354" y="94" width="4" height="4" />
                </g>
              </g>

              {/* Ground plaza */}
              <ellipse cx="200" cy="240" rx="190" ry="16" fill="url(#heroGroundGrad)" />
              <g stroke="#a78bfa" strokeWidth="1" opacity="0.35">
                <line x1="70" y1="240" x2="140" y2="222" />
                <line x1="130" y1="240" x2="175" y2="222" />
                <line x1="200" y1="240" x2="200" y2="220" />
                <line x1="270" y1="240" x2="225" y2="222" />
                <line x1="330" y1="240" x2="260" y2="222" />
                <line x1="50" y1="232" x2="350" y2="232" />
              </g>

              {/* Trees */}
              <g>
                <circle cx="55" cy="222" r="10" fill="#86efac" opacity="0.85" />
                <rect x="53" y="230" width="4" height="10" fill="#a3a3a3" opacity="0.6" />
                <circle cx="345" cy="222" r="10" fill="#6ee7b7" opacity="0.85" />
                <rect x="343" y="230" width="4" height="10" fill="#a3a3a3" opacity="0.6" />
              </g>
            </svg>

            {/* Ground shadow beneath the pin */}
            <div className="absolute bottom-1 w-16 sm:w-20 h-3 bg-purple-500/25 rounded-full blur-sm" />

            {/* 3D Glossy Purple Map Pin */}
            <div className="relative z-10 w-11 h-14 sm:w-16 sm:h-20 lg:w-20 lg:h-24 flex items-center justify-center">
              <svg viewBox="0 0 64 80" className="w-full h-full drop-shadow-lg">
                <path
                  d="M32 2C16.5 2 4 14.5 4 30c0 20 22 40 27 46.5.6.8 1.4.8 2 0C38 70 60 50 60 30 60 14.5 47.5 2 32 2Z"
                  fill="url(#heroPinGradStandalone)"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <defs>
                  <linearGradient id="heroPinGradStandalone" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9333ea" />
                    <stop offset="55%" stopColor="#7c3aed" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
                <circle cx="32" cy="30" r="13" fill="#ffffff" />
                {/* gloss highlight */}
                <path d="M14 18c3-6 9-10 14-11" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.35" />
              </svg>
            </div>
          </div>
        </div>

        {/* Floating Search Bar — Proportionally Scaled & Positioned */}
        <div className="mt-3 sm:mt-4 max-w-2xl">
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
        </div>

      </div>
    </section>
  );
}
