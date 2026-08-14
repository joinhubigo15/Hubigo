"use client";

import { useState } from "react";
import { cn } from "@/app/lib/utils";
import { useAuth } from "@/app/lib/auth-context";
import { updateNotificationPreferencesRequest } from "@/app/lib/api";

export default function BusinessSettingsPage() {
  const { user, accessToken, updateUser } = useAuth();
  const [prefsBusy, setPrefsBusy] = useState<string | null>(null);

  const togglePref = async (key: "emailLeadAlerts" | "emailMarketing" | "whatsappUpdates" | "smsAlerts") => {
    if (!accessToken || !user) return;
    setPrefsBusy(key);
    try {
      const updated = await updateNotificationPreferencesRequest(accessToken, { [key]: !user.notificationPreferences[key] });
      updateUser(updated);
    } finally {
      setPrefsBusy(null);
    }
  };

  const PREFS: { key: "emailLeadAlerts" | "emailMarketing" | "whatsappUpdates" | "smsAlerts"; label: string; desc: string }[] = [
    { key: "emailLeadAlerts", label: "Email — New Leads", desc: "Get emailed when a customer contacts you" },
    { key: "emailMarketing", label: "Email — Product Updates", desc: "Occasional Hubigo feature announcements" },
    { key: "whatsappUpdates", label: "WhatsApp Updates", desc: "Lead and booking alerts on WhatsApp" },
    { key: "smsAlerts", label: "SMS Alerts", desc: "Critical alerts via SMS" },
  ];

  return (
    <div className="flex flex-col font-sans flex-1 min-h-[calc(100vh-64px)] bg-white w-full">
      {/* Header Bar */}
      <div className="bg-white rounded-none border-b border-slate-200/90 p-5 shadow-none shadow-slate-200/50 relative z-10">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-none">
          Account Configuration
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">Business Settings</h1>
        <p className="text-xs text-slate-500 font-semibold">Manage your notification preferences.</p>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white p-6 lg:p-8 flex-1 w-full space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="px-3.5 py-1.5 rounded-none bg-purple-600 text-white text-xs font-bold">
            Notification Channels
          </span>
        </div>

        {user && (
          <div className="flex flex-col border-t border-slate-200/90 max-w-3xl">
            {PREFS.map((p) => (
              <div key={p.key} className="flex items-center justify-between p-4 bg-white border-b border-slate-200/90">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{p.label}</h4>
                  <p className="text-xs text-slate-500 font-medium">{p.desc}</p>
                </div>
                <button
                  onClick={() => togglePref(p.key)}
                  disabled={prefsBusy === p.key}
                  className={cn(
                    "w-10 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 disabled:opacity-60",
                    user.notificationPreferences[p.key] ? "bg-purple-600" : "bg-slate-300",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform",
                      user.notificationPreferences[p.key] ? "translate-x-4" : "translate-x-0",
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
