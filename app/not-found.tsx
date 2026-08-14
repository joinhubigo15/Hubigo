import type { Metadata } from "next";
import Link from "next/link";
import { Home, Search, MapPinOff } from "lucide-react";
import NotFoundFlag from "@/app/components/layout/NotFoundFlag";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-[70] min-h-screen w-full bg-[#0f111d] flex flex-col items-center justify-center px-6 py-16 font-sans text-center overflow-hidden">
      <NotFoundFlag />
      {/* Ambient background glow, matching the auth-page dark theme */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-indigo-600/20 rounded-full blur-3xl" />

      <Link href="/" className="flex items-center gap-2.5 sm:gap-3 mb-8 sm:mb-10 relative z-10">
        <img src="/logo.png" alt="Hubigo" className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
        <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
          HUB<span className="text-purple-400">IGO</span>
        </span>
      </Link>

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 sm:mb-6">
          <MapPinOff className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
        </div>

        <h1 className="text-6xl sm:text-8xl font-black bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent leading-none">
          404
        </h1>
        <h2 className="text-base sm:text-xl font-extrabold text-white mt-3 sm:mt-4">This place isn&apos;t on the map</h2>
        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1.5 sm:mt-2 max-w-sm px-4">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 mt-6 sm:mt-8 w-full sm:w-auto px-4">
          <Link
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-purple-600/25 transition-all"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/search"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-bold text-xs sm:text-sm transition-all"
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Search Businesses</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
