"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Plus, User, LogOut, LayoutDashboard, Building2, Store, Sparkles, Home } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { cn } from "@/app/lib/utils";
import NotificationBell from "@/app/components/notifications/NotificationBell";
import CityPickerPill from "@/app/components/layout/CityPickerPill";

export default function DesktopHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const isBusinessOwner = user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");
  const isDarkPage = pathname === "/about";
  const showLogo = pathname === "/about" || pathname === "/terms";
  // City pill only makes sense as a global "browse this city" control on the homepage — on every
  // other page (search, category, business detail, etc.) the page's own filters/context are the
  // source of truth for location, so a second independent city switcher here would be confusing.
  const showCityPill = pathname === "/";

  const handleLogout = async () => {
    setIsProfileOpen(false);
    await logout();
    router.push("/login");
  };

  // City detail pages want their hero banner flush against the top of the viewport on desktop —
  // this header bar (and its Add Business / Login / notification / profile buttons) would otherwise
  // sit above it and block that, so it's skipped entirely for this route (desktop-only component;
  // mobile never renders this bar anyway).
  if (pathname.startsWith("/city/")) return null;

  return (
    <header className={cn(
      "hidden lg:flex items-center justify-between gap-3 px-6 w-full z-30 shrink-0 font-sans border-b",
      pathname === "/" ? "pt-3 pb-2" : "pt-4 pb-4",
      isDarkPage ? "bg-transparent border-transparent" :
      pathname === "/search" || pathname === "/" ? "bg-white border-transparent" :
      "bg-white border-slate-200/90"
    )}>
      {/* Brand Logo & Name (Shown on pages without fixed left sidebar) */}
      {showLogo ? (
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
          <img src="/logo.png" alt="Hubigo" className="w-9 h-9 object-contain group-hover:scale-105 transition-transform" />
          <span className="text-2xl font-black tracking-tight text-white">
            HUB<span className="text-purple-400">IGO</span>
          </span>
        </Link>
      ) : (
        <div />
      )}

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Return to Home button on About Page */}
        {pathname === "/about" && (
          <Link
            href="/"
            className="bg-[#1c1f36] border border-purple-500/20 hover:border-purple-500/40 text-purple-300 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Home className="w-3.5 h-3.5 text-purple-400" />
            <span>Home</span>
          </Link>
        )}

        {/* Location Pill — homepage only, see showCityPill. */}
        {showCityPill && <CityPickerPill size="sm" theme={isDarkPage ? "dark" : "light"} />}

      {/* Switch to Business View Button ONLY for users with a Business Account */}
      {isBusinessOwner && (
        <Link
          href="/business-dashboard"
          className="bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 border border-purple-200/80 text-purple-800 font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
        >
          <LayoutDashboard className="w-3.5 h-3.5 text-purple-600" />
          <span>Switch to Business View 🏢</span>
        </Link>
      )}

      {/* Add Business Button */}
      <Link
        href="/business/register"
        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1 shadow-sm shadow-purple-500/20 transition-all hover:shadow-md"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Add Business</span>
      </Link>

      {/* Notification Bell — customer-facing, backend routes already existed but had no UI */}
      {user && <NotificationBell />}

      {/* User Profile / Auth Pill */}
      {user ? (
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 pl-2 cursor-pointer group"
          >
            <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs border border-purple-200 overflow-hidden shadow-xs">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <span className={cn(
              "text-xs font-extrabold transition-colors",
              isDarkPage ? "text-slate-200 group-hover:text-purple-300" : "text-slate-800 group-hover:text-purple-600"
            )}>
              {user.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* User Profile Dropdown Menu */}
          {isProfileOpen && (
            <div className={cn(
              "absolute right-0 mt-2 w-64 border rounded-2xl shadow-xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95",
              isDarkPage ? "bg-[#181a2e] border-purple-500/30 text-white" : "bg-white border-slate-100 text-slate-900"
            )}>
              <div className="p-2 border-b border-purple-500/20">
                <p className="font-extrabold text-xs truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium truncate">{user.email || user.phone}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className={cn(
                    "inline-block text-[9px] font-extrabold px-2 py-0.5 rounded uppercase",
                    isBusinessOwner ? "bg-purple-500/20 text-purple-300" : "bg-slate-700 text-slate-300"
                  )}>
                    {isBusinessOwner ? "User & Business Owner" : "Customer Account"}
                  </span>
                </div>
              </div>

              {/* View Switcher Controls */}
              {isBusinessOwner ? (
                <>
                  <Link
                    href="/business-dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Switch to Business View 🏢</span>
                  </Link>

                  <Link
                    href="/"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Customer View 👤</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/business/register"
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors"
                >
                  <Store className="w-4 h-4 text-purple-600" />
                  <span>List Your Business ➕</span>
                </Link>
              )}

              <Link
                href="/profile"
                onClick={() => setIsProfileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>My Profile</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/login"
          className="flex items-center gap-2 pl-2 text-xs font-bold text-slate-700 hover:text-purple-600 transition-colors"
        >
          <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200 shadow-2xs">
            <User className="w-4 h-4 text-slate-500" />
          </div>
          <span>Login / Register</span>
        </Link>
      )}
      </div>
    </header>
  );
}
