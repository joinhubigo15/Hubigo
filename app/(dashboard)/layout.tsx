"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import DashboardSidebar from "@/app/components/layout/DashboardSidebar";
import { useAuth } from "@/app/lib/auth-context";
import { getInitials, cn } from "@/app/lib/utils";
import type { Role } from "@/app/lib/api";
import {
  getDashboardNotifications,
  markDashboardNotificationRead,
  clearAllDashboardNotifications,
  type DashboardNotification,
} from "@/app/lib/business-dashboard-api";
import {
  Menu,
  Bell,
  Search,
  Plus,
  ChevronDown,
  LogOut,
  User,
  ShieldCheck,
  Building2,
  Store,
  Users,
  Star,
  MessageSquare,
  Trash2,
} from "lucide-react";

const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: "/admin", roles: ["admin", "super_admin"] },
  { prefix: "/business-dashboard", roles: ["business_owner", "admin", "super_admin"] },
];

const NOTIF_POLL_MS = 30_000;

const NOTIF_ICON: Record<string, { icon: typeof Bell; className: string }> = {
  lead: { icon: Users, className: "bg-purple-50/70 border-purple-100" },
  review: { icon: Star, className: "bg-amber-50/70 border-amber-100" },
  claim_approved: { icon: ShieldCheck, className: "bg-emerald-50/70 border-emerald-100" },
  claim_rejected: { icon: ShieldCheck, className: "bg-rose-50/70 border-rose-100" },
  message: { icon: MessageSquare, className: "bg-blue-50/70 border-blue-100" },
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, accessToken, initializing, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  const allowedRoles = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix))?.roles;

  useEffect(() => {
    if (initializing) return;

    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      router.replace("/");
    }
  }, [initializing, user, allowedRoles, pathname, router]);

  useEffect(() => {
    if (!accessToken) return;

    let cancelled = false;
    const load = () => {
      getDashboardNotifications(accessToken)
        .then((data) => {
          if (!cancelled) setNotifications(data);
        })
        .catch(() => {});
    };

    load();
    const interval = setInterval(load, NOTIF_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accessToken]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentNotifications = notifications.slice(0, 5);

  const handleNotifClick = async (notif: DashboardNotification) => {
    if (!accessToken || notif.isRead) return;
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));
    await markDashboardNotificationRead(accessToken, notif.id).catch(() => {});
  };

  const handleClearAll = async () => {
    if (!accessToken) return;
    setNotifOpen(false);
    setNotifications([]);
    await clearAllDashboardNotifications(accessToken).catch(() => {});
  };

  if (initializing || !user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f4f9]">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-semibold mt-3">Loading Hubigo Business Workspace...</p>
      </div>
    );
  }

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex bg-white font-sans selection:bg-purple-100 selection:text-purple-900 overflow-x-hidden">
      
      {/* 17-Item Business Sidebar */}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto min-h-screen">
        
        {/* Top Sticky Header */}
        <header className="bg-white border-b border-slate-200/90 h-16 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-none">
          
          {/* Left: Mobile Menu Button & Search */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-none text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="relative hidden sm:block w-64 lg:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search leads, reviews, offers, settings..."
                className="w-full pl-9 pr-3.5 py-2 bg-[#f8fafc] border border-slate-200 rounded-none text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Right: Quick Action CTAs, Switch View Button & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Switch to Customer View Button */}
            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 border border-slate-200/90 font-bold text-xs transition-all cursor-pointer shadow-none"
            >
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Switch to Customer View 👤</span>
            </Link>

            {/* Quick Add Offer / Add Listing Button */}
            <Link
              href="/business/register"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-none shadow-purple-600/25 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Listing</span>
            </Link>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="p-2 rounded-none bg-[#f8fafc] hover:bg-slate-100 border border-slate-200 text-slate-600 relative transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                )}
              </button>

              {/* Quick Notifications Popover */}
              {notifOpen && (
                <div className="fixed lg:absolute left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 lg:translate-x-0 top-16 lg:top-auto mt-0 lg:mt-2 w-[calc(100vw-32px)] lg:w-80 bg-white border border-slate-200/90 rounded-none shadow-xl p-3 z-50 space-y-2 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold text-xs text-slate-900">Notifications</h4>
                    <div className="flex items-center gap-2">
                      {recentNotifications.length > 0 && (
                        <button
                          onClick={handleClearAll}
                          className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Clear
                        </button>
                      )}
                      <Link
                        href="/business-dashboard/notifications"
                        onClick={() => setNotifOpen(false)}
                        className="text-[10px] font-bold text-purple-600 hover:underline"
                      >
                        View All
                      </Link>
                    </div>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {recentNotifications.length === 0 ? (
                      <p className="text-[11px] text-slate-400 font-semibold text-center py-6">No notifications yet.</p>
                    ) : (
                      recentNotifications.map((n) => {
                        const config = NOTIF_ICON[n.type] ?? { icon: Bell, className: "bg-slate-50 border-slate-100" };
                        return (
                          <button
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={cn(
                              "w-full text-left p-2 rounded-none border text-xs cursor-pointer transition-opacity",
                              config.className,
                              !n.isRead ? "opacity-100" : "opacity-60"
                            )}
                          >
                            <p className="font-extrabold text-slate-900">{n.title}</p>
                            {n.body && <p className="text-[11px] text-slate-600 mt-0.5">{n.body}</p>}
                            <span className="text-[9px] text-slate-500 font-semibold">{timeAgo(n.createdAt)}</span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 pl-1 cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center border border-purple-400 shadow-none overflow-hidden">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{getInitials(user.name)}</span>
                  )}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-extrabold text-slate-900 group-hover:text-purple-600 transition-colors leading-none">
                    {user.name}
                  </p>
                  <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider">
                    Owner
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors hidden md:block" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/90 rounded-none shadow-xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-extrabold text-xs text-slate-900 truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email || user.phone}</p>
                    <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded mt-1">
                      Verified Business Owner
                    </span>
                  </div>

                  <Link
                    href="/"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-none transition-colors"
                  >
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Switch to Customer View 👤</span>
                  </Link>

                  <Link
                    href="/business-dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-none transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>Account Settings</span>
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-none transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* Page Body Viewport */}
        <main className="flex-1 p-0 flex flex-col w-full">
          {children}
        </main>
      </div>

    </div>
  );
}
