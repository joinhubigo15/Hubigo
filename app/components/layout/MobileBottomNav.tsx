"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Grid2X2, Plus, MessageSquare, User, Store, Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";

const LONG_PRESS_MS = 450;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isBusinessOwner = user?.role === "business_owner" || user?.role === "admin" || user?.role === "super_admin";
  const accountHref = !user ? "/login" : "/profile";
  const chatHref = !user ? `/login?next=${encodeURIComponent("/messages")}` : "/messages";
  const inBusinessMode = pathname.startsWith("/business-dashboard");

  const [showSwitcher, setShowSwitcher] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const startPress = () => {
    if (!isBusinessOwner) return;
    longPressFired.current = false;
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setShowSwitcher(true);
    }, LONG_PRESS_MS);
  };

  const endPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  const handleAccountClick = (e: React.MouseEvent) => {
    if (longPressFired.current) {
      e.preventDefault();
      longPressFired.current = false;
      return;
    }
    if (!isBusinessOwner) return;
    router.push(inBusinessMode ? "/business-dashboard" : accountHref);
  };

  const switchTo = (href: string) => {
    setShowSwitcher(false);
    router.push(href);
  };

  return (
    <>
      {showSwitcher && (
        <div className="lg:hidden fixed inset-0 z-[60]" onClick={() => setShowSwitcher(false)}>
          <div className="absolute inset-0 bg-black/40 animate-in fade-in duration-150" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-[72px] right-2 w-[65%] max-w-[240px] bg-white rounded-xl shadow-2xl border border-slate-100/80 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200"
          >
            <div className="px-3 pt-2.5 pb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">Switch Account</div>

            <button
              onClick={() => switchTo("/profile")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-black text-slate-900">{user?.name ?? "Customer Account"}</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Browse & shop as a customer</p>
              </div>
              {!inBusinessMode && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
            </button>

            <button
              onClick={() => switchTo("/business-dashboard")}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-50 transition-colors cursor-pointer border-t border-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-black text-slate-900">Business Account</p>
                <p className="text-[9px] text-slate-400 font-bold leading-tight mt-0.5">Manage your listing & leads</p>
              </div>
              {inBusinessMode && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
            </button>
          </div>
        </div>
      )}
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-1.5 py-2 grid grid-cols-5 items-center justify-items-center w-full">
      {/* Home */}
      <Link
        href="/"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all",
          pathname === "/" ? "text-purple-600 font-semibold" : "text-slate-400"
        )}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
      </Link>

      {/* Categories */}
      <Link
        href="/category"
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all",
          pathname === "/category" || pathname.startsWith("/category/") ? "text-purple-600 font-semibold" : "text-slate-400"
        )}
      >
        <Grid2X2 className="w-5 h-5" />
        <span className="text-[10px]">Categories</span>
      </Link>

      {/* Elevated Center Add Business Button */}
      <Link
        href="/business/register"
        className="flex flex-col items-center group -mt-5"
      >
        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/35 border-4 border-white group-active:scale-95 transition-all">
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </div>
        <span className="text-[9px] font-semibold text-slate-600 mt-0.5">
          Add Business
        </span>
      </Link>

      {/* Chat */}
      <Link
        href={chatHref}
        className={cn(
          "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all",
          pathname === "/messages" || pathname.startsWith("/messages/") ? "text-purple-600 font-semibold" : "text-slate-400"
        )}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-[10px]">Chat</span>
      </Link>

      {/* Account — long-press to switch between Customer/Business if the user owns a business */}
      {isBusinessOwner ? (
        <button
          type="button"
          onClick={handleAccountClick}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerLeave={endPress}
          onContextMenu={(e) => e.preventDefault()}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all select-none cursor-pointer",
            inBusinessMode || pathname === accountHref ? "text-purple-600 font-semibold" : "text-slate-400"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Account</span>
        </button>
      ) : (
        <Link
          href={accountHref}
          className={cn(
            "flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all",
            pathname === accountHref ? "text-purple-600 font-semibold" : "text-slate-400"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Account</span>
        </Link>
      )}
    </div>
    </>
  );
}
