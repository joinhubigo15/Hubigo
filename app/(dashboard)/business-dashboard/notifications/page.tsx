"use client";

import { useEffect, useState } from "react";
import { Bell, Star, Users, ShieldCheck, XCircle, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import {
  getDashboardNotifications,
  markDashboardNotificationRead,
  markAllDashboardNotificationsRead,
  clearAllDashboardNotifications,
  type DashboardNotification,
} from "@/app/lib/business-dashboard-api";
import PushNotificationToggle from "@/app/components/notifications/PushNotificationToggle";

const TYPE_ICON: Record<string, { icon: typeof Bell; color: string }> = {
  lead: { icon: Users, color: "text-purple-600 bg-purple-50" },
  review: { icon: Star, color: "text-amber-500 bg-amber-50" },
  claim_approved: { icon: ShieldCheck, color: "text-emerald-600 bg-emerald-50" },
  claim_rejected: { icon: XCircle, color: "text-rose-600 bg-rose-50" },
  message: { icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
};

export default function BusinessNotificationsPage() {
  const { accessToken } = useAuth();
  const [notifs, setNotifs] = useState<DashboardNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    getDashboardNotifications(accessToken)
      .then(setNotifs)
      .catch(() => setNotifs([]))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const markRead = async (id: string) => {
    if (!accessToken) return;
    await markDashboardNotificationRead(accessToken, id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllRead = async () => {
    if (!accessToken) return;
    await markAllDashboardNotificationsRead(accessToken);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const clearAll = async () => {
    if (!accessToken) return;
    if (!confirm("Clear all notifications? This can't be undone.")) return;
    await clearAllDashboardNotifications(accessToken);
    setNotifs([]);
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="bg-white border-b border-slate-200/90 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-none flex items-center gap-1">
              <Bell className="w-3 h-3 text-rose-600" />
              Notifications Center
            </span>
            {unreadCount > 0 && <span className="text-[10px] font-bold text-slate-400">{unreadCount} unread</span>}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">System Alerts & Activity Logs</h1>
          <p className="text-xs text-slate-500 font-semibold">Track lead alerts, review submissions, and claim status updates.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-none cursor-pointer">
              Mark all as read
            </button>
          )}
          {notifs.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-none cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear all
            </button>
          )}
        </div>
      </div>

      <PushNotificationToggle />

      {/* Notifications Feed */}
      <div className="bg-white flex flex-col border-t border-slate-200/90 relative z-10">
        {notifs.length === 0 ? (
          <p className="text-xs text-slate-500 font-semibold py-8 text-center border-b border-slate-200/90">No notifications yet.</p>
        ) : (
          notifs.map((n) => {
            const config = TYPE_ICON[n.type] ?? { icon: Bell, color: "text-slate-600 bg-slate-100" };
            const Icon = config.icon;
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markRead(n.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-slate-200/90 flex items-start gap-3.5 cursor-pointer transition-colors",
                  n.isRead ? "bg-white hover:bg-[#f8fafc]" : "bg-purple-50/50 hover:bg-purple-50",
                )}
              >
                <div className={cn("w-9 h-9 rounded-none flex items-center justify-center shrink-0 border border-slate-200", config.color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-xs text-slate-900">{n.title}</h4>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                  {n.body && <p className="text-xs text-slate-600 font-medium mt-0.5">{n.body}</p>}
                </div>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-1" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
