"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Building2, ShieldCheck } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { API_URL } from "@/app/lib/api";
import { safeNextPath } from "@/app/lib/safe-next-path";

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

function RegisterPageInner() {
  const { user, initializing } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));
  const [role, setRole] = useState<"user" | "business">("user");
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!initializing && user) {
      const destination = nextPath || (user.role === "business_owner" ? "/business-dashboard" : "/");
      router.replace(destination);
    }
  }, [user, initializing, router, nextPath]);

  const handleGoogleSignup = () => {
    if (!acceptedTerms) {
      setErrorMsg("You must accept Hubigo's Terms & Conditions to create an account.");
      return;
    }
    setErrorMsg(null);
    const selectedRole = role === "business" ? "business_owner" : "user";
    window.location.href = `${API_URL}/api/v1/auth/google?role=${selectedRole}`;
  };

  if (initializing || user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090a0f] text-slate-200">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-medium mt-3">Connecting your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 font-sans flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative selection:bg-purple-500/30 selection:text-purple-200">

      {/* TOP NAVBAR BRAND HEADER */}
      <header className="flex items-center justify-between max-w-md mx-auto w-full z-10">
        <Link href="/" className="flex items-center gap-2.5 group">
          <img src="/logo.png" alt="Hubigo" className="w-9 h-9 object-contain" />
          <span className="text-xl font-bold tracking-tight text-white">
            Hub<span className="text-purple-400">igo</span>
          </span>
        </Link>

        <Link href="/login" className="text-xs font-semibold text-slate-400 hover:text-purple-300 transition-colors">
          Log In
        </Link>
      </header>

      <main className="max-w-md mx-auto w-full my-8 z-10">
        <div className="bg-[#12141e] border border-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-11 h-11 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-white">Create your account</h1>
            <p className="text-xs text-slate-400 font-medium">Join India&apos;s local business discovery community</p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-medium text-xs">
              {errorMsg}
            </div>
          )}

          {/* Role Selection */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col gap-2",
                role === "user"
                  ? "bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/30"
                  : "bg-[#161925] border-slate-800/90 hover:bg-[#1a1d2d] hover:border-slate-700"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Customer</h3>
                <p className="text-[10px] text-slate-400 font-normal leading-snug mt-0.5">
                  Discover deals & write reviews
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("business")}
              className={cn(
                "p-4 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col gap-2",
                role === "business"
                  ? "bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/30"
                  : "bg-[#161925] border-slate-800/90 hover:bg-[#1a1d2d] hover:border-slate-700"
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-white">Business Owner</h3>
                <p className="text-[10px] text-slate-400 font-normal leading-snug mt-0.5">
                  List your business & get leads
                </p>
              </div>
            </button>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 bg-white text-slate-900 font-semibold text-sm rounded-xl shadow-xs hover:bg-slate-100 transition-colors duration-150 cursor-pointer"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          <label className="flex items-start gap-2.5 text-[11px] font-normal text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600 shrink-0 mt-0.5"
            />
            <span className="leading-snug">
              I agree to Hubigo&apos;s{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-purple-400 underline hover:text-purple-300">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/terms#lead-sharing" target="_blank" className="font-semibold text-purple-400 underline hover:text-purple-300">
                Privacy Policy
              </Link>.
            </span>
          </label>
        </div>
      </main>

      {/* FOOTER DISCLAIMER */}
      <footer className="text-center text-xs text-slate-500 font-medium z-10 py-2">
        <span>Hubigo accounts are created and secured through Google — no password required.</span>
      </footer>

    </div>
  );
}

// useSearchParams (for the post-auth `next` redirect) requires a Suspense boundary in the app
// router — see the identical pattern in verify-email/page.tsx.
export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090a0f]" />}>
      <RegisterPageInner />
    </Suspense>
  );
}
