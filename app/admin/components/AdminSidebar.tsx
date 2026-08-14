"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  FolderTree,
  Tags,
  MapPin,
  Compass,
  Users,
  Star,
  Zap,
  MessageSquare,
  Flag,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  Settings,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Command,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAdminAuth } from "../lib/admin-auth-context";
import {
  getAdminDashboardMetrics,
  getAdminClaims,
  getAdminCategories,
  getAdminSubcategories,
  getAdminEditSuggestions,
  getAdminListingReports,
  getAdminCities,
} from "../lib/admin-api";

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

function buildNavGroups(counts: {
  totalBusinesses?: number;
  pendingClaims?: number;
  pendingReviews?: number;
  registeredUsers?: number;
  categories?: number;
  subcategories?: number;
  pendingListingFeedback?: number;
  newCities?: number;
}): NavGroup[] {
  const fmt = (n?: number) => (n === undefined ? undefined : n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n.toLocaleString());

  return [
    {
      group: "OVERVIEW",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Analytics & Telemetry", href: "/admin/analytics", icon: BarChart3 },
      ],
    },
    {
      group: "OPERATIONS",
      items: [
        { label: "Businesses", href: "/admin/businesses", icon: Building2, badge: fmt(counts.totalBusinesses) },
        { label: "Business Claims", href: "/admin/claims", icon: FileCheck, badge: counts.pendingClaims, badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        { label: "Reviews Moderation", href: "/admin/reviews", icon: Star, badge: counts.pendingReviews, badgeColor: "bg-rose-500/20 text-rose-300 border-rose-500/30" },
        { label: "Leads System", href: "/admin/leads", icon: Zap },
        { label: "Contact Messages", href: "/admin/messages", icon: MessageSquare },
        { label: "Listing Feedback", href: "/admin/listing-feedback", icon: Flag, badge: counts.pendingListingFeedback, badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        { label: "Bulk Imports", href: "/admin/imports", icon: UploadCloud },
      ],
    },
    {
      group: "TAXONOMY & GEO",
      items: [
        { label: "Categories", href: "/admin/categories", icon: FolderTree, badge: counts.categories },
        { label: "Subcategories", href: "/admin/subcategories", icon: Tags, badge: counts.subcategories },
        { label: "Cities", href: "/admin/cities", icon: MapPin, badge: counts.newCities, badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
        { label: "Neighborhood Areas", href: "/admin/areas", icon: Compass },
      ],
    },
    {
      group: "USERS",
      items: [
        { label: "User Accounts", href: "/admin/users", icon: Users, badge: fmt(counts.registeredUsers) },
      ],
    },
    {
      group: "GOVERNANCE & TEAM",
      items: [
        { label: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
        { label: "Platform Settings", href: "/admin/settings", icon: Settings },
        { label: "Admins & Roles", href: "/admin/admins", icon: ShieldCheck },
      ],
    },
  ];
}

export const AdminSidebar: React.FC<{
  collapsed: boolean;
  setCollapsed: (c: boolean) => void;
  onOpenCommandPalette: () => void;
}> = ({ collapsed, setCollapsed, onOpenCommandPalette }) => {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuth();
  const [counts, setCounts] = useState<{
    totalBusinesses?: number;
    pendingClaims?: number;
    pendingReviews?: number;
    registeredUsers?: number;
    categories?: number;
    subcategories?: number;
    pendingListingFeedback?: number;
    newCities?: number;
  }>({});

  useEffect(() => {
    Promise.all([
      getAdminEditSuggestions({ status: "pending", pageSize: 1 }),
      getAdminListingReports({ status: "pending", pageSize: 1 }),
    ])
      .then(([suggestions, reports]) =>
        setCounts((prev) => ({ ...prev, pendingListingFeedback: suggestions.total + reports.total }))
      )
      .catch(() => {});
    getAdminDashboardMetrics()
      .then((m) =>
        setCounts((prev) => ({
          ...prev,
          totalBusinesses: m.totalBusinesses,
          pendingReviews: m.pendingReviews,
          registeredUsers: m.registeredUsers,
        }))
      )
      .catch(() => {});
    getAdminClaims()
      .then((claims) => setCounts((prev) => ({ ...prev, pendingClaims: claims.filter((c) => c.status === "PENDING").length })))
      .catch(() => {});
    getAdminCategories()
      .then((cats) => setCounts((prev) => ({ ...prev, categories: cats.length })))
      .catch(() => {});
    getAdminSubcategories()
      .then((subs) => setCounts((prev) => ({ ...prev, subcategories: subs.length })))
      .catch(() => {});
    getAdminCities()
      .then((cities) => setCounts((prev) => ({ ...prev, newCities: cities.filter((c) => c.isAutoCreated && !c.autoCreatedAcknowledged).length })))
      .catch(() => {});
  }, []);

  const NAV_GROUPS = buildNavGroups(counts);

  return (
    <aside
      className={cn(
        "fixed top-0 left-0 bottom-0 z-40 bg-[#070a12] border-r border-slate-800/80 flex flex-col transition-all duration-300 select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* BRANDING HEADER */}
      <div className="h-16 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0">
        <Link href="/admin" className="flex items-center gap-3 overflow-hidden">
          <img src="/logo.png" alt="Hubigo" className="w-10 h-10 object-contain shrink-0" />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm text-white tracking-tight">HUBIGO</span>
                <span className="text-[9px] font-black uppercase text-purple-400 bg-purple-500/10 border border-purple-500/30 px-1.5 py-0.2 rounded">
                  CONSOLE
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold truncate">Enterprise OS v2.4</span>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* COMMAND PALETTE BUTTON */}
      <div className="p-3 shrink-0">
        <button
          onClick={onOpenCommandPalette}
          className={cn(
            "w-full py-2 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 flex items-center justify-between transition-colors cursor-pointer group shadow-2xs",
            collapsed && "justify-center px-0"
          )}
          title="Global Search (Ctrl+K)"
        >
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            {!collapsed && <span>Search & Jump...</span>}
          </div>
          {!collapsed && (
            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
              ⌘K
            </span>
          )}
        </button>
      </div>

      {/* NAVIGATION ITEMS */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {NAV_GROUPS.map((group) => (
          <div key={group.group} className="space-y-1">
            {!collapsed && (
              <h4 className="px-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                {group.group}
              </h4>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative",
                      isActive
                        ? "bg-purple-600/15 text-purple-300 border border-purple-500/30 shadow-xs"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-purple-500 rounded-r-full shadow-md shadow-purple-500/50" />
                    )}

                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-colors",
                          isActive ? "text-purple-400" : "text-slate-400 group-hover:text-slate-200"
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0",
                          item.badgeColor || "bg-slate-900 text-slate-400 border-slate-800"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* USER / FOOTER BAR */}
      <div className="p-3 border-t border-slate-800/80 shrink-0">
        <div
          className={cn(
            "p-2 rounded-2xl bg-slate-900/80 border border-slate-800/80 flex items-center justify-between gap-2",
            collapsed && "justify-center p-1.5"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={admin?.avatarUrl || "https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/fallback-images/admin-default-avatar.jpg"}
              alt={admin?.name || "Admin"}
              className="w-8 h-8 rounded-xl object-cover border border-purple-500/30 shrink-0"
            />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-extrabold text-white truncate">{admin?.name || "Alex Vance"}</span>
                <span className="text-[10px] font-bold text-purple-400 truncate">{admin?.roleName || "Super Admin"}</span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
              title="Logout from Admin Console"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
