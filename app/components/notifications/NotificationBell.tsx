"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import {
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
  clearAllNotificationsRequest,
  type AppNotification,
} from "@/app/lib/api";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationBell() {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accessToken) return;
    getNotificationsRequest(accessToken)
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, [accessToken]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!accessToken) return null;

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  async function handleOpen() {
    setOpen((v) => !v);
  }

  async function handleMarkRead(n: AppNotification) {
    if (n.isRead || !accessToken) return;
    setNotifications((prev) => prev?.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)) ?? null);
    try {
      await markNotificationReadRequest(accessToken, n.id);
    } catch {}
  }

  async function handleMarkAllRead() {
    if (!accessToken) return;
    setNotifications((prev) => prev?.map((x) => ({ ...x, isRead: true })) ?? null);
    try {
      await markAllNotificationsReadRequest(accessToken);
    } catch {}
  }

  async function handleClearAll() {
    if (!accessToken) return;
    setNotifications([]);
    try {
      await clearAllNotificationsRequest(accessToken);
    } catch {}
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed lg:absolute left-1/2 lg:left-auto lg:right-0 -translate-x-1/2 lg:translate-x-0 top-16 lg:top-auto mt-0 lg:mt-2 w-[calc(100vw-32px)] lg:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-black text-slate-900">Notifications</h3>
            {notifications && notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  className="text-[10px] font-bold text-purple-600 hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
                <button
                  onClick={handleClearAll}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications === null ? (
              <div className="p-4 text-xs text-slate-400 font-semibold">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center space-y-1">
                <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleMarkRead(n)}
                  className={cn(
                    "w-full text-left px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors cursor-pointer",
                    !n.isRead && "bg-purple-50/50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs text-slate-900", !n.isRead ? "font-bold" : "font-semibold")}>
                        {n.title}
                      </p>
                      {n.body && <p className="text-[11px] text-slate-500 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-slate-400 font-semibold mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
