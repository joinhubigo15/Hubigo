"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, MessageSquare, ShieldCheck, Tag, Calendar, Check, X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface NotificationItem {
  id: string;
  type: "appointment" | "verified" | "message" | "offer" | "account";
  title: string;
  description: string;
  time: string;
  unread: boolean;
  link: string;
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    type: "appointment",
    title: "OPD Appointment Reminder 🩺",
    description: "Your consultation at Apollo Multi-Specialty Hospital is scheduled for tomorrow at 10:30 AM.",
    time: "10 mins ago",
    unread: true,
    link: "/profile",
  },
  {
    id: "2",
    type: "verified",
    title: "NABH Facility Verification 🏥",
    description: "Fortis Healthcare Center has been verified with NABH Certification & Cashless TPA.",
    time: "1 hour ago",
    unread: true,
    link: "/search?q=Fortis",
  },
  {
    id: "3",
    type: "message",
    title: "New Message from Dr. Sharma 💬",
    description: "Dr. Sharma sent you a direct message regarding your diagnostic lab report.",
    time: "2 hours ago",
    unread: true,
    link: "/messages",
  },
  {
    id: "4",
    type: "offer",
    title: "Special Health Checkup Offer 💊",
    description: "20% Off on Full Body Health Checkup & Diagnostic Package at SRL Labs.",
    time: "5 hours ago",
    unread: false,
    link: "/search?q=Diagnostic",
  },
];

export default function NotificationBell({ size = "md" }: { size?: "sm" | "md" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(SAMPLE_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const getIcon = (type: NotificationItem["type"]) => {
    switch (type) {
      case "appointment":
        return <Calendar className="w-3.5 h-3.5 text-purple-600" />;
      case "verified":
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
      case "message":
        return <MessageSquare className="w-3.5 h-3.5 text-blue-600" />;
      case "offer":
        return <Tag className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "relative rounded-full bg-white border border-purple-200/90 text-purple-600 shadow-2xs hover:bg-purple-50 transition-colors flex items-center justify-center cursor-pointer",
          size === "sm" ? "p-1.5" : "p-2"
        )}
        aria-label="Website Notifications"
      >
        <Bell className={cn("text-purple-600", size === "sm" ? "w-4 h-4" : "w-4.5 h-4.5")} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-xs text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-[10px] font-bold text-purple-600 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Check className="w-3 h-3" /> Mark all as read
              </button>
            )}
          </div>

          {/* List */}
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {notifications.map((n) => (
              <Link
                key={n.id}
                href={n.link}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-start gap-2.5 p-2 rounded-xl transition-colors block text-left",
                  n.unread ? "bg-purple-50/60 hover:bg-purple-50 border border-purple-100/60" : "hover:bg-slate-50 border border-transparent"
                )}
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-[11px] font-bold text-slate-900 truncate">{n.title}</h4>
                    <span className="text-[8.5px] font-medium text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-snug line-clamp-2 mt-0.5">
                    {n.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Footer */}
          <div className="pt-2 mt-2 border-t border-slate-100 text-center">
            <Link
              href="/messages"
              onClick={() => setOpen(false)}
              className="text-[10px] font-bold text-purple-600 hover:underline"
            >
              View all messages & healthcare alerts →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
