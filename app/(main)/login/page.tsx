"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Store,
  ShieldCheck,
  Zap,
  TrendingUp,
  Globe,
  ChevronDown,
  Building2,
  Users,
  Star,
  Utensils,
  Car,
  Heart,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { API_URL } from "@/app/lib/api";
import { useAuth } from "@/app/lib/auth-context";
import { safeNextPath } from "@/app/lib/safe-next-path";

type Role = "user" | "business";

const roleConfig: Record<
  Role,
  { label: string; icon: React.ElementType; heading: string; subtext: string }
> = {
  user: {
    label: "User Login",
    icon: User,
    heading: "Welcome back! 👋",
    subtext: "Sign in with Google to continue exploring Hubigo",
  },
  business: {
    label: "Business Login",
    icon: Store,
    heading: "Welcome back! 👋",
    subtext: "Sign in with Google to access your business dashboard & leads",
  },
};

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 01-2.4 3.63v3h3.87c2.27-2.09 3.58-5.17 3.58-8.81z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.92l-3.87-3c-1.08.72-2.46 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.09A11.998 11.998 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 010-4.54v-3.1H1.28a12 12 0 000 10.73l3.99-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.28 6.63l3.99 3.1C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
  );
}

function LoginPageInner() {
  const { user, initializing, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const reason = searchParams.get("reason");
  const oauthError = searchParams.get("error");
  const [role, setRole] = useState<Role>(reason === "business_required" ? "business" : "user");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(
    oauthError === "google_auth_failed" ? "Google sign-in didn't go through. Please try again." : null,
  );
  const config = roleConfig[role];

  // A suspended account gets its own dedicated page (redirect target for the account_suspended
  // OAuth error), not just an inline banner here — see auth.routes.ts's google/callback.
  useEffect(() => {
    if (oauthError === "account_suspended") router.replace("/account-suspended");
  }, [oauthError, router]);

  // Prevent logged-in users from viewing the login page unless they explicitly log out.
  // Exception: a "user"-role account that got bounced here via ?reason=business_required
  // (e.g. tried to open /business/register) isn't the account we want signed in — sign it
  // out instead of redirecting, so the person can log in with a business account.
  useEffect(() => {
    if (initializing) return;
    if (!user) return;
    if (reason === "business_required" && user.role === "user") {
      logout();
      return;
    }
    const destination = nextPath || (user.role === "business_owner" ? "/business-dashboard" : "/");
    router.replace(destination);
  }, [user, initializing, router, nextPath, reason, logout]);

  const handleGoogleLogin = () => {
    if (!acceptedTerms) {
      setErrorMsg("You must accept Hubigo's Terms & Conditions to log in.");
      return;
    }
    setErrorMsg(null);
    const selectedRole = role === "business" ? "business_owner" : "user";
    window.location.href = `${API_URL}/api/v1/auth/google?role=${selectedRole}`;
  };

  if (initializing || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Signing you into your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen lg:h-screen w-full bg-white flex flex-col lg:flex-row font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">

      {/* LEFT SECTION — Desktop-Only Dark Hero (hidden on mobile for instant login focus) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0718] text-white p-6 lg:p-8 flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-800/60 h-full">
        {/* Background image & gradient overlays */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity"
          style={{
            backgroundImage:
              'url("https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/fallback-images/login-background.jpg")',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0718] via-[#0a0718]/85 to-transparent" />
        <div className="absolute top-1/4 right-10 w-72 h-72 bg-purple-600/25 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header Row */}
        <div className="z-10 relative flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Hubigo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-black tracking-tight text-white">
              HUB<span className="text-purple-400">IGO</span>
            </span>
          </Link>
        </div>

        {/* Middle Content */}
        <div className="z-10 relative my-auto py-2 grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">

          {/* Left Text */}
          <div className="xl:col-span-7 space-y-3.5">
            {/* Top Shield Badge Pill */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[10px] font-semibold text-purple-200">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>India&apos;s Most Trusted Business Discovery Platform</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.15]">
              Find.<br />
              Connect.<br />
              Grow with{" "}
              <span className="bg-gradient-to-r from-purple-400 via-indigo-300 to-violet-400 bg-clip-text text-transparent">
                Hubigo.
              </span>
            </h1>

            <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
              Discover verified businesses, connect instantly, and grow your brand with India&apos;s most advanced local discovery platform.
            </p>

            {/* 3 Glassmorphism Cards */}
            <div className="space-y-2 pt-1 max-w-xs">
              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Verified & Trusted</h4>
                  <p className="text-[9px] text-slate-400 font-medium leading-none">Every business is verified for your trust</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Smart & Fast Search</h4>
                  <p className="text-[9px] text-slate-400 font-medium leading-none">Find exactly what you need in seconds</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-bold text-white">Grow Your Business</h4>
                  <p className="text-[9px] text-slate-400 font-medium leading-none">Reach more customers and grow your brand</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 3D Logo Graphic */}
          <div className="hidden xl:flex xl:col-span-5 items-center justify-center relative min-h-[220px]">
            <div className="absolute w-48 h-48 border border-purple-500/30 rounded-full animate-spin-slow" />
            <div className="relative w-32 h-40 bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 rounded-2xl p-1 shadow-xl shadow-purple-500/40 flex items-center justify-center border border-purple-400/40">
              <div className="w-full h-full bg-[#0d0922]/90 rounded-[14px] flex items-center justify-center border border-white/20">
                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-purple-400 to-indigo-200">
                  H
                </span>
              </div>
            </div>

            {/* Floating Category Icons */}
            <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-md">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <div className="absolute top-8 right-0 w-7 h-7 rounded-lg bg-rose-500 text-white flex items-center justify-center shadow-md">
              <Car className="w-3.5 h-3.5" />
            </div>
            <div className="absolute bottom-6 right-2 w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-md">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="absolute bottom-4 left-6 w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md">
              <Heart className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Bottom Glassmorphism Stats Bar */}
        <div className="z-10 relative bg-white/5 border border-white/10 rounded-xl p-2.5 backdrop-blur-md grid grid-cols-4 divide-x divide-white/10 text-center">
          <div className="px-1">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
              <Store className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs sm:text-sm font-black text-white">10L+</div>
            <div className="text-[9px] text-slate-400 font-semibold">Businesses</div>
          </div>

          <div className="px-1">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs sm:text-sm font-black text-white">500+</div>
            <div className="text-[9px] text-slate-400 font-semibold">Cities</div>
          </div>

          <div className="px-1">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="text-xs sm:text-sm font-black text-white">50L+</div>
            <div className="text-[9px] text-slate-400 font-semibold">Happy Users</div>
          </div>

          <div className="px-1">
            <div className="flex items-center justify-center gap-1 text-purple-400 mb-0.5">
              <Star className="w-3.5 h-3.5 fill-current text-purple-400" />
            </div>
            <div className="text-xs sm:text-sm font-black text-white">4.8★</div>
            <div className="text-[9px] text-slate-400 font-semibold">Avg. Rating</div>
          </div>
        </div>

      </div>

      {/* RIGHT SECTION — Dark themed on mobile to match blueprint mockup, light card layout on desktop */}
      <div className="w-full lg:w-1/2 bg-[#161724] lg:bg-[#f1f4f9] text-white lg:text-slate-800 p-5 sm:p-8 lg:p-10 flex flex-col justify-between items-center min-h-screen lg:h-full overflow-y-auto relative selection:bg-purple-500/30">
        
        {/* Mobile-only background grid overlay & glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808007_1px,transparent_1px),linear-gradient(to_bottom,#80808007_1px,transparent_1px)] bg-[size:16px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none lg:hidden" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none lg:hidden" />

        {/* Top Header Row (Mobile Brand Logo + English Selector) */}
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Hubigo" className="w-8 h-8 object-contain" />
            <span className="text-lg font-black tracking-tight text-white lg:text-slate-900 lg:hidden">
              HUB<span className="text-purple-400">IGO</span>
            </span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 lg:bg-white border border-white/10 lg:border-slate-200 text-[11px] font-semibold text-slate-300 lg:text-slate-700 shadow-2xs cursor-pointer hover:bg-white/10 lg:hover:bg-slate-50 transition-colors">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>English</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Center Container (Flat on mobile, Card on desktop) */}
        <div className="w-full max-w-sm lg:bg-white lg:border lg:border-slate-200/90 lg:rounded-2xl lg:p-6 lg:sm:p-8 lg:shadow-xs my-auto space-y-6 lg:space-y-5 z-10 flex flex-col">

          {/* Header Icon & Title */}
          <div className="text-center space-y-2 lg:space-y-1.5">
            <div className="w-16 h-16 lg:w-10 lg:h-10 rounded-full bg-gradient-to-b from-[#2e2a47] to-[#1c1830] lg:bg-purple-50 border-2 border-slate-700/60 lg:border lg:border-purple-100/60 text-purple-300 lg:text-purple-600 flex items-center justify-center mx-auto shadow-lg lg:shadow-2xs relative shrink-0">
              {(() => {
                const ActiveIcon = config.icon;
                return <ActiveIcon className="w-6 h-6 lg:w-4.5 lg:h-4.5" />;
              })()}
            </div>
            <h2 className="text-2xl lg:text-lg lg:sm:text-xl font-black text-white lg:text-slate-950">
              {config.heading}
            </h2>
            <p className="text-xs lg:text-[11px] text-slate-400 lg:text-slate-500 font-semibold leading-relaxed">
              {config.subtext}
            </p>
          </div>

          {reason === "business_required" ? (
            <div className="p-2.5 bg-amber-950/40 lg:bg-amber-50 border border-amber-500/25 lg:border-amber-200 rounded-xl text-[10px] font-bold text-amber-300 lg:text-amber-800 text-center leading-snug">
              Please sign in with a business account to manage your listings.
            </div>
          ) : null}

          {/* Role Tab Bar Switcher */}
          <div className="flex items-center bg-[#18152e]/80 lg:bg-slate-50 p-1 rounded-2xl lg:rounded-xl border border-white/10 lg:border-slate-200/80">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-2 rounded-xl lg:rounded-lg text-xs font-extrabold transition-all cursor-pointer border border-transparent",
                role === "user"
                  ? "bg-white/10 border border-purple-500/20 text-purple-300 lg:bg-white lg:border-slate-100 lg:text-purple-600 shadow-2xs"
                  : "text-slate-400 hover:text-white lg:text-slate-500 lg:hover:text-slate-800"
              )}
            >
              <User className="w-3.5 h-3.5" />
              <span>User Login</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("business")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 lg:py-2 rounded-xl lg:rounded-lg text-xs font-extrabold transition-all cursor-pointer border border-transparent",
                role === "business"
                  ? "bg-white/10 border border-purple-500/20 text-purple-300 lg:bg-white lg:border-slate-100 lg:text-purple-600 shadow-2xs"
                  : "text-slate-400 hover:text-white lg:text-slate-500 lg:hover:text-slate-800"
              )}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Business Login</span>
            </button>
          </div>

          {/* Mandatory Terms & Conditions Agreement */}
          <div className="bg-transparent lg:bg-slate-50/60 p-0 lg:p-3 rounded-none lg:rounded-xl border-none lg:border lg:border-slate-100">
            <label className="flex items-start gap-2.5 text-[11px] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/20 lg:border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0 mt-0.5"
              />
              <span className="leading-snug text-slate-400 lg:text-slate-500 font-semibold">
                I agree to Hubigo&apos;s{" "}
                <Link href="/terms" target="_blank" className="font-extrabold text-purple-400 lg:text-purple-600 hover:underline">
                  Terms & Conditions
                </Link>{" "}
                and{" "}
                <Link href="/terms#lead-sharing" target="_blank" className="font-extrabold text-purple-400 lg:text-purple-600 hover:underline">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>

          {errorMsg ? (
            <div className="p-2.5 bg-rose-950/40 lg:bg-rose-50 border border-rose-500/25 lg:border-rose-200 rounded-xl text-[10px] font-bold text-rose-300 lg:text-rose-700">
              {errorMsg}
            </div>
          ) : null}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 border border-purple-500/30 lg:border-slate-200 hover:border-purple-300 hover:bg-white/10 lg:hover:bg-purple-50/50 rounded-full lg:rounded-xl text-[13px] font-extrabold text-white lg:text-slate-800 bg-white/5 lg:bg-white shadow-lg lg:shadow-2xs transition-all duration-200 cursor-pointer group hover:-translate-y-0.5"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <p className="text-center text-[10px] font-semibold text-slate-500 lg:text-slate-400 leading-snug">
            Hubigo accounts are created and secured through Google — no separate password needed.
          </p>

        </div>

        {/* Empty bottom spacer */}
        <div className="h-1 z-10" />
      </div>

    </div>
  );
}

// useSearchParams (for the post-login `next` redirect) requires a Suspense boundary in the app
// router — see the identical pattern in verify-email/page.tsx.
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginPageInner />
    </Suspense>
  );
}
