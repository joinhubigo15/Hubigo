"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Search,
  MessageSquare,
  Building2,
  TrendingUp,
  Users,
  Compass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  Globe,
  Award,
  ChevronRight,
  PhoneCall,
  Tag,
  Star,
  Layers,
  HeartHandshake,
  BarChart3,
  Shield,
  FileCheck,
  Smartphone,
  Navigation,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

export default function AboutPage() {
  // Section 2: Problem vs Solution State
  const [problemTab, setProblemTab] = useState<"broken" | "hubigo">("hubigo");

  // Section 3: Dual Side Perspective Switcher
  const [activeSide, setActiveSide] = useState<"people" | "businesses">("people");

  // Section 4: Ecosystem Hovered Node
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Section 5: Verification Feature Selection
  const [selectedVerification, setSelectedVerification] = useState<number>(0);

  // Section 6: Journey Timeline Active Step
  const [timelineStep, setTimelineStep] = useState<number>(0);

  // Section 7: Animated Count-up Stats state
  const [statsAnimated, setStatsAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStatsAnimated(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#0e101d] text-slate-100 min-h-screen font-sans selection:bg-purple-500/30 overflow-x-hidden w-full">
      
      {/* ─────────────────────────────────────────────────────────────
         SECTION 1: HERO — "The local internet, reimagined."
         ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-20 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden">
        
        {/* Ambient Composed Purple & Indigo Backdrop Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Text Column */}
        <div className="lg:w-1/2 space-y-6 text-center lg:text-left z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-extrabold tracking-wide shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
            <span>THE NEXT GENERATION OF LOCAL DISCOVERY</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.15] text-white">
            The local internet,{" "}
            <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
              reimagined.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
            Hubigo bridges the gap between everyday consumers and authentic local businesses. 
            We build the connective tissue for local economies — making discovery instant, 
            information verified, and connections direct.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
            <Link
              href="/search"
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center gap-2 cursor-pointer group"
            >
              <span>Explore Hubigo Directory</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/business/register"
              className="px-6 py-3.5 rounded-xl bg-[#1c1f36] hover:bg-[#232742] border border-purple-500/20 text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>List Your Business Free</span>
            </Link>
          </div>
        </div>

        {/* Hero Interactive Radar Discovery Visualization */}
        <div className="lg:w-1/2 w-full flex items-center justify-center z-10">
          <div className="relative w-72 h-72 sm:w-96 sm:h-96 rounded-full border border-purple-500/25 bg-[#181a2e]/80 backdrop-blur-md flex items-center justify-center p-6 shadow-2xl shadow-purple-950/30">
            
            {/* Concentric Radar Rings */}
            <div className="absolute inset-4 rounded-full border border-purple-500/15 animate-ping opacity-30 pointer-events-none" style={{ animationDuration: "4s" }} />
            <div className="absolute inset-12 rounded-full border border-indigo-500/20" />
            <div className="absolute inset-24 rounded-full border border-purple-500/30" />

            {/* Center User Location Pin */}
            <div className="relative z-20 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-600/50 border-2 border-white/20 animate-bounce">
                <Navigation className="w-6 h-6 fill-current text-white" />
              </div>
              <span className="text-[10px] font-black tracking-widest uppercase bg-purple-950/90 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-purple-300 mt-2 shadow-xs">
                YOU ARE HERE
              </span>
            </div>

            {/* Orbiting Nearby Business Nodes */}
            <div className="absolute top-6 left-8 group cursor-pointer">
              <div className="bg-[#20233b] border border-purple-500/40 rounded-xl p-2 flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-xs">
                  🍽️
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Royal Punjab</p>
                  <p className="text-[9px] text-emerald-400 font-semibold">0.4 km • 4.9 ★</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-6 group cursor-pointer">
              <div className="bg-[#20233b] border border-purple-500/40 rounded-xl p-2 flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
                  💆🏻‍♀️
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Glow & Grace Spa</p>
                  <p className="text-[9px] text-purple-300 font-semibold">1.2 km • Verified</p>
                </div>
              </div>
            </div>

            <div className="absolute top-20 right-4 group cursor-pointer">
              <div className="bg-[#20233b] border border-purple-500/40 rounded-xl p-2 flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-bold text-xs">
                  🏋️
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">Apex Fitness</p>
                  <p className="text-[9px] text-indigo-300 font-semibold">0.8 km • Active Deal</p>
                </div>
              </div>
            </div>

            <div className="absolute bottom-10 left-6 group cursor-pointer">
              <div className="bg-[#20233b] border border-purple-500/40 rounded-xl p-2 flex items-center gap-2 shadow-lg group-hover:scale-105 transition-transform">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs">
                  🔧
                </div>
                <div>
                  <p className="text-[11px] font-bold text-white">AutoCare Express</p>
                  <p className="text-[9px] text-emerald-400 font-semibold">1.5 km • Open Now</p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 2: "The problem with finding local businesses"
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            THE LOCAL DISCOVERY CHALLENGE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Why traditional business search is broken.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            For decades, local search has suffered from noise, paid bias, and outdated phone numbers. 
            Hubigo replaces confusion with direct verified clarity.
          </p>

          {/* Interactive Switcher Buttons */}
          <div className="inline-flex p-1 bg-[#181a2e] border border-purple-500/20 rounded-2xl gap-1 mt-4">
            <button
              onClick={() => setProblemTab("broken")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                problemTab === "broken"
                  ? "bg-rose-500/20 border border-rose-500/40 text-rose-300"
                  : "text-slate-400 hover:text-white"
              )}
            >
              The Broken Traditional Search ❌
            </button>
            <button
              onClick={() => setProblemTab("hubigo")}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                problemTab === "hubigo"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              The Hubigo Solution ✨
            </button>
          </div>
        </div>

        {/* Dynamic Comparison Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problemTab === "broken" ? (
            <>
              <div className="bg-[#181a2e] border border-rose-500/30 rounded-2xl p-6 space-y-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <h3 className="font-bold text-white text-base">Outdated Listings</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Incorrect operational hours, disconnected phone numbers, and relocated addresses.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-rose-500/30 rounded-2xl p-6 space-y-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <h3 className="font-bold text-white text-base">Paid Review Noise</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Fake reviews and paid priority rankings that obscure genuinely great local providers.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-rose-500/30 rounded-2xl p-6 space-y-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <h3 className="font-bold text-white text-base">No Direct Contact</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Forced third-party lead brokers charging high fees before letting you speak to a business.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-rose-500/30 rounded-2xl p-6 space-y-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <h3 className="font-bold text-white text-base">Struggling Merchants</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  High-quality local merchants left invisible due to complex & expensive marketing platforms.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="bg-[#181a2e] border border-purple-500/30 rounded-2xl p-6 space-y-3 shadow-lg shadow-purple-950/20">
                <CheckCircle2 className="w-6 h-6 text-purple-400" />
                <h3 className="font-bold text-white text-base">100% Verified Profiles</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Every business undergoes GST/MSME and physical address verification before listing.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-purple-500/30 rounded-2xl p-6 space-y-3 shadow-lg shadow-purple-950/20">
                <CheckCircle2 className="w-6 h-6 text-indigo-400" />
                <h3 className="font-bold text-white text-base">Organic Local Ratings</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Authentic community reviews guarded against spam and artificial boosting.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-purple-500/30 rounded-2xl p-6 space-y-3 shadow-lg shadow-purple-950/20">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Direct WhatsApp & Call</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Instant direct communication with owners without intermediary delays or commission fees.
                </p>
              </div>

              <div className="bg-[#181a2e] border border-purple-500/30 rounded-2xl p-6 space-y-3 shadow-lg shadow-purple-950/20">
                <CheckCircle2 className="w-6 h-6 text-amber-400" />
                <h3 className="font-bold text-white text-base">Empowered Merchants</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  Intuitive self-serve tools to manage inventory, publish offers, and track incoming leads.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 3: "One platform. Two sides." (Interactive Split View)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            DUAL VALUE PROPOSITION
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            One platform. Two sides.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            Whether you are looking for local services or running a local business, Hubigo is designed specifically for you.
          </p>

          {/* Toggle Buttons */}
          <div className="inline-flex p-1 bg-[#181a2e] border border-purple-500/20 rounded-2xl gap-2 mt-4">
            <button
              onClick={() => setActiveSide("people")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeSide === "people"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Users className="w-4 h-4" />
              <span>For People (Consumers)</span>
            </button>

            <button
              onClick={() => setActiveSide("businesses")}
              className={cn(
                "px-6 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                activeSide === "businesses"
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white"
              )}
            >
              <Building2 className="w-4 h-4" />
              <span>For Local Businesses</span>
            </button>
          </div>
        </div>

        {/* Dynamic Split Content Grid */}
        <div className="bg-[#181a2e] border border-purple-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl">
          {activeSide === "people" ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block p-3 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  <Compass className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Discover your neighborhood with absolute confidence.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Find everything from fine dining and wellness spas to emergency plumbing and local fitness centers. Compare pricing, inspect verified photos, and connect instantly.
                </p>

                <div className="space-y-3 text-xs font-medium">
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Instant radius filter to explore businesses near your location</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Direct WhatsApp chat & call without paying booking fees</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Exclusive discount vouchers & seasonal promos</span>
                  </div>
                </div>

                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/30"
                >
                  <span>Start Exploring Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="lg:col-span-6 bg-[#20233b] border border-purple-500/20 rounded-2xl p-6 space-y-4">
                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Search "Best South Indian Filter Coffee"</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    12 Verified Nearby
                  </span>
                </div>

                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Claim 20% Off Voucher</span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    Instant Voucher Code
                  </span>
                </div>

                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Direct Owner Connection</span>
                  <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    WhatsApp Chat Active
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-block p-3 rounded-2xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  <Building2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Grow your business with modern digital visibility.
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                  Build a verified storefront, manage incoming customer leads in real-time, publish special deals, and receive direct phone enquiries without commission cuts.
                </p>

                <div className="space-y-3 text-xs font-medium">
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Dedicated Lead Management CRM & Messages Inbox</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Real-time visitor analytics & view tracking</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Verified Merchant Badge & Google Maps integration</span>
                  </div>
                </div>

                <Link
                  href="/business/register"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30"
                >
                  <span>Register Your Business</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="lg:col-span-6 bg-[#20233b] border border-purple-500/20 rounded-2xl p-6 space-y-4">
                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">New Direct Lead Received</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    +1 WhatsApp Lead
                  </span>
                </div>

                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Monthly Profile Views</span>
                  <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-md">
                    2,450 Impressions
                  </span>
                </div>

                <div className="p-3 bg-[#181a2e] rounded-xl border border-purple-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Merchant Trust Score</span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md">
                    100% Verified
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 4: "How Hubigo connects the local world" (Ecosystem Visual)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            CONNECTED ECOSYSTEM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            How Hubigo connects the local world.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            A seamless triangular flow of trust, direct communication, and local economic growth.
          </p>
        </div>

        {/* Ecosystem Nodes Canvas */}
        <div className="relative bg-[#181a2e] border border-purple-500/30 rounded-3xl p-8 sm:p-12 overflow-hidden shadow-2xl">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
            
            {/* Node 1: Consumers */}
            <div
              onMouseEnter={() => setHoveredNode("people")}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "p-6 rounded-2xl border transition-all text-center space-y-3 cursor-pointer",
                hoveredNode === "people"
                  ? "bg-purple-900/40 border-purple-500 shadow-xl shadow-purple-500/20 scale-105"
                  : "bg-[#20233b] border-purple-500/20"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center mx-auto font-black text-lg">
                👥
              </div>
              <h3 className="font-bold text-white text-base">Local Consumers</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Searching for verified nearby services, comparing pricing, and contacting owners directly.
              </p>
            </div>

            {/* Node 2: Hubigo Core Engine */}
            <div
              onMouseEnter={() => setHoveredNode("engine")}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "p-8 rounded-2xl border transition-all text-center space-y-4 cursor-pointer relative",
                hoveredNode === "engine"
                  ? "bg-gradient-to-b from-purple-900/60 to-indigo-900/60 border-purple-400 shadow-2xl shadow-purple-600/40 scale-105"
                  : "bg-[#242745] border-purple-500/40 shadow-xl"
              )}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-600/50">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Hubigo Engine</h3>
                <span className="text-[10px] font-bold text-purple-200 bg-purple-950 px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  Verification & Match Protocol
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                Geo-matching, GST audit, review anti-spam guardrails, and real-time deal delivery.
              </p>
            </div>

            {/* Node 3: Local Businesses */}
            <div
              onMouseEnter={() => setHoveredNode("business")}
              onMouseLeave={() => setHoveredNode(null)}
              className={cn(
                "p-6 rounded-2xl border transition-all text-center space-y-3 cursor-pointer",
                hoveredNode === "business"
                  ? "bg-indigo-900/40 border-indigo-500 shadow-xl shadow-indigo-500/20 scale-105"
                  : "bg-[#20233b] border-purple-500/20"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center mx-auto font-black text-lg">
                🏬
              </div>
              <h3 className="font-bold text-white text-base">Verified Businesses</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Building digital presence, capturing high-intent leads, and serving nearby customers.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 5: "Built around trust" (Interactive Verification Breakdown)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            AUTHENTICITY ASSURANCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built around trust.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            Click each checkpoint to explore how Hubigo guarantees business authenticity.
          </p>
        </div>

        {/* Verification Checkpoints Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-3">
            {[
              {
                title: "1. Document & GST/MSME Verification",
                icon: FileCheck,
                desc: "Every merchant submits legal registration documents verified by Hubigo compliance.",
              },
              {
                title: "2. Geo-Location & Physical Address Audit",
                icon: MapPin,
                desc: "GPS coordinates and street address physical checks prevent ghost or duplicate listings.",
              },
              {
                title: "3. Direct Phone Line Test",
                icon: PhoneCall,
                desc: "Contact numbers are verified via active call/OTP confirmation before activation.",
              },
              {
                title: "4. Organic Rating Guardrails",
                icon: ShieldCheck,
                desc: "Reviews undergo algorithmic spam detection to filter artificial rating manipulation.",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              const isSel = selectedVerification === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedVerification(idx)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5",
                    isSel
                      ? "bg-purple-900/40 border-purple-500 text-white shadow-lg"
                      : "bg-[#181a2e] border-purple-500/20 text-slate-300 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", isSel ? "text-purple-300" : "text-slate-400")} />
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-white">{item.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Verification Interactive Badge Certificate Card */}
          <div className="lg:col-span-7 bg-[#181a2e] border border-purple-500/40 rounded-3xl p-8 space-y-6 shadow-2xl flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">Hubigo Verified Seal</h3>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                    Official Authenticity Certificate
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-300">ID: HBG-VERIFIED-2026</span>
            </div>

            <div className="space-y-4 text-xs font-medium">
              <div className="p-4 rounded-xl bg-[#20233b] border border-purple-500/20 space-y-2">
                <p className="text-slate-200 font-bold">Verification Protocol Checklist:</p>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> GSTIN / Registration Status Active
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Physical Location Audit Confirmed
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Direct WhatsApp & Reception Line Verified
                  </li>
                </ul>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-950/70 border border-purple-500/30 text-purple-200 text-[11px] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-300 shrink-0" />
              <span>Consumers see this badge on every verified listing, giving them total booking confidence.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 6: "More than a directory." (Interactive Journey)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            EVOLUTION BEYOND DIRECTORIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            More than a directory.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            An end-to-end local journey tracking every interaction from initial intent to direct connection.
          </p>
        </div>

        {/* Timeline Journey Stepper */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          {[
            { step: "01", name: "Search", desc: "Intent-based location search" },
            { step: "02", name: "Discover", desc: "Browse verified options" },
            { step: "03", name: "Compare", desc: "Side-by-side reviews & pricing" },
            { step: "04", name: "Connect", desc: "Direct WhatsApp / Call" },
            { step: "05", name: "Engage", desc: "Promos & review feedback" },
          ].map((item, idx) => {
            const isSel = timelineStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setTimelineStep(idx)}
                className={cn(
                  "p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-1",
                  isSel
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-500 text-white shadow-lg shadow-purple-600/30"
                    : "bg-[#181a2e] border-purple-500/20 text-slate-300 hover:text-white"
                )}
              >
                <span className={cn("text-[10px] font-black tracking-widest block", isSel ? "text-purple-200" : "text-slate-400")}>
                  STAGE {item.step}
                </span>
                <p className="font-extrabold text-sm text-white">{item.name}</p>
                <p className="text-[10px] text-slate-300 opacity-90 truncate font-medium">{item.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Timeline Active Stage Visual Display */}
        <div className="bg-[#181a2e] border border-purple-500/30 rounded-3xl p-8 space-y-4 shadow-xl">
          {timelineStep === 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-purple-400">STAGE 01 — INTENT SEARCH</span>
              <h3 className="text-xl font-bold text-white">Instant Location-Aware Query Matching</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                Users type what they need (*"Car battery replacement near Indiranagar"* or *"Fine dining Italian"*). Hubigo scans verified records and matches distance instantly.
              </p>
            </div>
          )}
          {timelineStep === 1 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-indigo-400">STAGE 02 — SMART DISCOVERY</span>
              <h3 className="text-xl font-bold text-white">Visual Business Cards & Verified Ratings</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                Explore photo galleries, active discount vouchers, verified merchant badges, and operating schedules at a single glance.
              </p>
            </div>
          )}
          {timelineStep === 2 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-emerald-400">STAGE 03 — COMPARISON MATRIX</span>
              <h3 className="text-xl font-bold text-white">Transparent Price & Rating Evaluation</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                Compare multiple providers side-by-side without hidden pricing or surprise fees.
              </p>
            </div>
          )}
          {timelineStep === 3 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-amber-300">STAGE 04 — DIRECT CONNECTION</span>
              <h3 className="text-xl font-bold text-white">Zero-Middleman Direct WhatsApp & Phone Call</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                Tap once to launch a direct WhatsApp chat or phone call with the business owner. No lead gatekeeping.
              </p>
            </div>
          )}
          {timelineStep === 4 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-purple-300">STAGE 05 — COMMUNITY ENGAGEMENT</span>
              <h3 className="text-xl font-bold text-white">Voucher Redemption & Authentic Reviews</h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl font-medium">
                Redeem promotional codes in-person and share authentic feedback to empower nearby community members.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 7: Hubigo in numbers (Animated Count-Up Stats)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            PLATFORM MOMENTUM
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Hubigo in numbers.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            Empowering local discovery and commercial growth across Indian cities.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[#181a2e] border border-purple-500/20 rounded-2xl p-6 text-center space-y-2 shadow-xl hover:border-purple-500/50 transition-colors">
            <p className="text-3xl sm:text-4xl font-black text-purple-400">
              {statsAnimated ? "0%" : "0%"}
            </p>
            <p className="text-xs font-bold text-white">Zero Commissions</p>
            <p className="text-[10px] text-slate-300 font-medium">No middleman fees for merchants or customers</p>
          </div>

          <div className="bg-[#181a2e] border border-purple-500/20 rounded-2xl p-6 text-center space-y-2 shadow-xl hover:border-purple-500/50 transition-colors">
            <p className="text-3xl sm:text-4xl font-black text-indigo-400">
              {statsAnimated ? "100%" : "0%"}
            </p>
            <p className="text-xs font-bold text-white">Direct Connections</p>
            <p className="text-[10px] text-slate-300 font-medium">Direct calls, WhatsApp chats & maps</p>
          </div>

          <div className="bg-[#181a2e] border border-purple-500/20 rounded-2xl p-6 text-center space-y-2 shadow-xl hover:border-purple-500/50 transition-colors">
            <p className="text-3xl sm:text-4xl font-black text-emerald-400">
              {statsAnimated ? "10s" : "0s"}
            </p>
            <p className="text-xs font-bold text-white">Instant Discovery</p>
            <p className="text-[10px] text-slate-300 font-medium">Find and verify local services in seconds</p>
          </div>

          <div className="bg-[#181a2e] border border-purple-500/20 rounded-2xl p-6 text-center space-y-2 shadow-xl hover:border-purple-500/50 transition-colors">
            <p className="text-3xl sm:text-4xl font-black text-amber-300">
              {statsAnimated ? "Verified" : "Loading"}
            </p>
            <p className="text-xs font-bold text-white">Verified Listings</p>
            <p className="text-[10px] text-slate-300 font-medium">Checked storefront coordinates & phone validity</p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 8: "Built for the local economy." (Category Matrix)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto border-t border-purple-500/15">
        <div className="text-center space-y-3 max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            DIVERSE CATEGORY MATRIX
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built for the local economy.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium">
            Supporting essential services and specialized providers across every neighborhood.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { icon: "🏥", label: "Hospitals" },
            { icon: "🩺", label: "Specialty Clinics" },
            { icon: "🧪", label: "Diagnostic Labs" },
            { icon: "💊", label: "Pharmacies" },
            { icon: "🦷", label: "Dental Care" },
            { icon: "👁️", label: "Eye Care" },
            { icon: "🧘", label: "Physical Therapy" },
            { icon: "🚑", label: "Emergency Care" },
          ].map((cat, idx) => (
            <div
              key={idx}
              className="bg-[#181a2e] border border-purple-500/20 rounded-2xl p-4 text-center space-y-2 hover:border-purple-500/50 hover:scale-105 transition-all cursor-pointer group"
            >
              <div className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</div>
              <p className="text-xs font-bold text-slate-300 group-hover:text-white">{cat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 9: Founder/Company Philosophy (Manifesto)
         ───────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto border-t border-purple-500/15">
        <div className="bg-[#181a2e] border border-purple-500/40 rounded-3xl p-8 sm:p-12 text-center space-y-8 shadow-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-purple-400">
            THE HUBIGO MANIFESTO
          </span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
            Discover locally. Connect directly. Grow together.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-4">
            <div className="space-y-2 bg-[#20233b] p-5 rounded-2xl border border-purple-500/20">
              <h3 className="font-extrabold text-purple-400 text-sm">1. Local First</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Every neighborhood thrives when its unique local merchants are visible, verified, and accessible.
              </p>
            </div>

            <div className="space-y-2 bg-[#20233b] p-5 rounded-2xl border border-purple-500/20">
              <h3 className="font-extrabold text-indigo-400 text-sm">2. Zero Middleman</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                We believe in direct communication — no hidden commissions or lead gatekeeping between customers and providers.
              </p>
            </div>

            <div className="space-y-2 bg-[#20233b] p-5 rounded-2xl border border-purple-500/20">
              <h3 className="font-extrabold text-emerald-400 text-sm">3. Transparent Trust</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                Verified GST credentials, physical location checks, and organic community ratings guarantee authentic choices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
         SECTION 10: Final Immersive Action CTA
         ───────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>START YOUR DISCOVERY JOURNEY TODAY</span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
          Your next discovery is{" "}
          <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
            closer than you think.
          </span>
        </h2>

        <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed font-medium">
          Join thousands of people finding trusted local businesses every day, or claim your free business storefront to reach nearby customers.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/search"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 transition-all flex items-center gap-2 cursor-pointer group"
          >
            <span>Explore Businesses Near You</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/business/register"
            className="px-8 py-4 rounded-xl bg-[#1c1f36] hover:bg-[#232742] border border-purple-500/20 text-slate-200 hover:text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Building2 className="w-4 h-4 text-purple-400" />
            <span>List Your Business Free</span>
          </Link>
        </div>
      </section>

    </div>
  );
}
