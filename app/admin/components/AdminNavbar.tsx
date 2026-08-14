"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell,
  Search,
  Globe,
  Sparkles,
  ExternalLink,
  ChevronDown,
  UserCheck,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Star,
  X,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAdminAuth } from "../lib/admin-auth-context";
import { getAdminClaims, getAdminReviews, getAdminContactMessages } from "../lib/admin-api";

// One row per actual pending item (a claim, a review) rather than an aggregate count — so an
// item only ever leaves the list when it's genuinely resolved (approved/rejected/moderated) or
// the admin explicitly clears it, never because an unrelated queue's count happened to shift.
interface AlertItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  color: string;
}

const CLEARED_KEY = "hubigo_admin_cleared_notification_ids";

function readClearedIds(): Set<string> {
  try {
    const arr = JSON.parse(localStorage.getItem(CLEARED_KEY) ?? "[]");
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

export const AdminNavbar: React.FC<{
  collapsed: boolean;
  onOpenCommandPalette: () => void;
}> = ({ collapsed, onOpenCommandPalette }) => {
  const { admin, logout } = useAdminAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [clearedIds, setClearedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading a synchronous localStorage snapshot on mount is intentional
    setClearedIds(readClearedIds());
    Promise.all([
      getAdminClaims(),
      getAdminReviews({ status: "PENDING", pageSize: 50 }),
      getAdminContactMessages({ isRead: false, pageSize: 50 }),
    ])
      .then(([claims, reviews, messages]) => {
        const claimAlerts: AlertItem[] = claims
          .filter((c) => c.status === "PENDING")
          .map((c) => ({
            id: `claim-${c.id}`,
            label: `Claim: ${c.business?.name ?? "Unknown business"} awaiting review`,
            href: "/admin/claims",
            icon: FileCheck,
            color: "text-amber-400",
          }));
        const reviewAlerts: AlertItem[] = reviews.items.map((r) => ({
          id: `review-${r.id}`,
          label: `Review on ${r.businessName} by ${r.userName} awaiting moderation`,
          href: "/admin/reviews",
          icon: Star,
          color: "text-rose-400",
        }));
        const messageAlerts: AlertItem[] = messages.items.map((m) => ({
          id: `message-${m.id}`,
          label: `New message from ${m.name}: ${m.subject}`,
          href: "/admin/messages",
          icon: MessageSquare,
          color: "text-purple-400",
        }));
        const combined = [...claimAlerts, ...reviewAlerts, ...messageAlerts];
        setAlerts(combined);
        // Prune cleared-id bookkeeping down to ids that are still actually pending, so it
        // doesn't grow forever as claims/reviews get resolved.
        setClearedIds((prev) => {
          const liveIds = new Set(combined.map((a) => a.id));
          const pruned = new Set([...prev].filter((id) => liveIds.has(id)));
          localStorage.setItem(CLEARED_KEY, JSON.stringify([...pruned]));
          return pruned;
        });
      })
      .catch(() => setAlerts([]));
  }, []);

  const unreadAlerts = alerts.filter((a) => !clearedIds.has(a.id));
  const unreadCount = unreadAlerts.length;

  const handleClear = () => {
    const next = new Set([...clearedIds, ...alerts.map((a) => a.id)]);
    localStorage.setItem(CLEARED_KEY, JSON.stringify([...next]));
    setClearedIds(next);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-[#070a12]/90 backdrop-blur-md border-b border-slate-800/80 transition-all duration-300 flex items-center justify-between px-4 sm:px-6",
        collapsed ? "left-20" : "left-64"
      )}
    >
      {/* LEFT: BREADCRUMB / SEARCH TRIGGER */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer shadow-2xs group"
        >
          <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          <span>Global Search Businesses, Claims, Users, System Logs...</span>
          <span className="text-[10px] font-black text-slate-500 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 ml-4">
            ⌘K
          </span>
        </button>
      </div>

      {/* RIGHT: SYSTEM STATUS, NOTIFICATIONS, PROFILE DROPDOWN */}
      <div className="flex items-center gap-3">
        {/* SYSTEM STATUS BADGE */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Normal (100% Uptime)</span>
        </div>

        {/* LIVE APP VIEW BUTTON */}
        <Link
          href="/"
          target="_blank"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all"
        >
          <Globe className="w-3.5 h-3.5 text-purple-400" />
          <span>Live Site</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </Link>

        {/* NOTIFICATION BELL DRAWER */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />
              </>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0c101c] border border-slate-800 shadow-2xl p-4 space-y-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-purple-400" />
                  <span>Pending Moderation Queues</span>
                </h4>
                {unreadCount > 0 ? (
                  <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    {unreadCount} Unread
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    All caught up
                  </span>
                )}
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold text-center py-6">Nothing pending right now.</p>
                ) : (
                  alerts.map((a) => {
                    const Icon = a.icon;
                    const isUnread = !clearedIds.has(a.id);
                    return (
                      <Link
                        key={a.id}
                        href={a.href}
                        onClick={() => setShowNotifications(false)}
                        className={cn(
                          "block p-2.5 rounded-xl border space-y-1 transition-colors",
                          isUnread ? "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900" : "bg-transparent border-transparent opacity-50 hover:opacity-100"
                        )}
                      >
                        <span className={cn("text-xs font-bold flex items-center gap-1.5", a.color)}>
                          <Icon className="w-3.5 h-3.5" />
                          <span>{a.label}</span>
                        </span>
                      </Link>
                    );
                  })
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={handleClear}
                  className="w-full flex items-center justify-center gap-1.5 text-xs font-extrabold text-slate-400 hover:text-white pt-1 border-t border-slate-800 pt-2.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear notifications</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* PROFILE MENU DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer"
          >
            <img
              src={admin?.avatarUrl || "https://pub-e457284fdd7844e5b0bcc12b89e4a198.r2.dev/fallback-images/admin-default-avatar.jpg"}
              alt={admin?.name || "Admin"}
              className="w-7 h-7 rounded-lg object-cover border border-purple-500/30 shrink-0"
            />
            <span className="hidden sm:inline text-xs font-extrabold text-white">
              {admin?.name || "Alex Vance"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#0c101c] border border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-800 space-y-0.5">
                <p className="text-xs font-black text-white">{admin?.name || "Alex Vance"}</p>
                <p className="text-[11px] text-slate-400 font-medium">{admin?.email || "alex.vance@hubigo.in"}</p>
                <span className="inline-block text-[9px] font-black uppercase text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded mt-1">
                  {admin?.roleName || "Super Admin"}
                </span>
              </div>

              <Link
                href="/admin/admins"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Account & Permissions</span>
              </Link>

              <Link
                href="/admin/settings"
                onClick={() => setShowProfileMenu(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Platform Settings</span>
              </Link>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Admin Console</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
