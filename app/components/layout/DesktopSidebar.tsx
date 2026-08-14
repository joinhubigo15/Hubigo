"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  LayoutGrid,
  Heart,
  MessageSquare,
  Info,
  User,
  Phone,
  Store,
  ArrowRight,
  LayoutDashboard,
  Compass,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";

export default function DesktopSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isBusinessOwner = user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  const sidebarNavItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Search", href: "/search", icon: Search },
    { name: "Nearby", href: "/nearby", icon: Compass },
    { name: "Categories", href: "/category", icon: LayoutGrid },
    ...(isBusinessOwner
      ? [{ name: "Business Dashboard", href: "/business-dashboard", icon: LayoutDashboard }]
      : []),
    { name: "Saved", href: "/saved", icon: Heart },
    { name: "Messages", href: "/messages", icon: MessageSquare },
    { name: "About", href: "/about", icon: Info },
    { name: "Account", href: "/profile", icon: User },
    { name: "Contact", href: "/contact", icon: Phone },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200/90 shadow-none h-screen fixed top-0 left-0 bottom-0 z-40 p-4 font-sans">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-5 shrink-0">
        <img src="/logo.png" alt="Hubigo" className="w-8 h-8 object-contain" />
        <span className="text-2xl font-black tracking-tight text-slate-900">
          HUB<span className="text-purple-600">IGO</span>
        </span>
      </Link>

      {/* Navigation Links — evenly distributed to fill the sidebar's full height with no dead
          space; falls back to normal top-aligned scrolling once the list is tall enough to overflow. */}
      <nav className="flex-1 flex flex-col justify-evenly overflow-y-auto min-h-0 pr-2 -mr-2 hide-scrollbar">
        {sidebarNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-sm transition-colors duration-150 group border border-transparent",
                isActive
                  ? "bg-purple-50 text-purple-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 transition-colors duration-150",
                  isActive
                    ? "text-purple-600"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Promo Card (Compact layout to avoid scroll overflow) */}
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3.5 mt-3.5 space-y-2.5 relative overflow-hidden flex-shrink-0 flex flex-col">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-2xs shrink-0">
            <Store className="w-3.5 h-3.5" />
          </div>
          <h4 className="font-extrabold text-xs text-slate-900">List Your Business</h4>
        </div>
        <Link
          href="/business/register"
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors w-full shrink-0"
        >
          <span>Add Business</span>
          <ArrowRight className="w-3 h-3 shrink-0" />
        </Link>
      </div>
    </aside>
  );
}
