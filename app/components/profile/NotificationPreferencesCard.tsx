"use client";

import { useState } from "react";
import Switch from "@/app/components/ui/Switch";
import { updateNotificationPreferencesRequest } from "@/app/lib/api";
import { useAuth, ApiClientError } from "@/app/lib/auth-context";
import type { NotificationPreferences } from "@/app/lib/api";
import PushNotificationToggle from "@/app/components/notifications/PushNotificationToggle";

const OPTIONS: { key: keyof NotificationPreferences; label: string; description: string; comingInV2?: boolean; businessOwnerOnly?: boolean }[] = [
  {
    key: "emailLeadAlerts",
    label: "Lead & activity alerts",
    description: "Email me when there's new lead or review activity on my business listing",
    businessOwnerOnly: true,
  },
  {
    key: "emailMarketing",
    label: "Product updates & offers",
    description: "Occasional emails about new features, deals, and offers",
  },
  {
    key: "whatsappUpdates",
    label: "WhatsApp updates",
    description: "Important account and activity updates via WhatsApp",
    comingInV2: true,
  },
  {
    key: "smsAlerts",
    label: "SMS alerts",
    description: "Text messages for time-sensitive account activity",
    comingInV2: true,
  },
];

export default function NotificationPreferencesCard() {
  const { user, accessToken, updateUser } = useAuth();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!user || !accessToken) return null;

  const isBusinessOwner = user.role === "business_owner" || user.role === "admin" || user.role === "super_admin";
  const visibleOptions = OPTIONS.filter((opt) => !opt.businessOwnerOnly || isBusinessOwner);

  async function handleToggle(key: keyof NotificationPreferences, value: boolean) {
    if (!accessToken) return;
    setErrorMsg(null);
    setPendingKey(key);
    try {
      const updated = await updateNotificationPreferencesRequest(accessToken, { [key]: value });
      updateUser(updated);
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : "Could not update preference");
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="bg-white px-8 py-10 border-b border-slate-200/90">
        <h2 className="text-lg font-bold text-slate-900 mb-1.5">Notification Preferences</h2>
        <p className="text-sm text-slate-500 mb-6">Choose how Hubigo keeps you in the loop</p>

        {errorMsg && (
          <div className="text-xs font-semibold text-error bg-error-light border border-error/20 rounded-[var(--radius-md)] px-3.5 py-2.5 mb-4">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col divide-y divide-border-light">
          {visibleOptions.map((opt) => (
            <div key={opt.key} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-sm font-semibold text-secondary">{opt.label}</p>
                  {opt.comingInV2 && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Coming in v2
                    </span>
                  )}
                </div>
                <p className="text-xs text-secondary-400">{opt.description}</p>
              </div>
              <Switch
                checked={user.notificationPreferences[opt.key]}
                onChange={(value) => handleToggle(opt.key, value)}
                disabled={pendingKey === opt.key}
                aria-label={opt.label}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white px-8 py-8 border-b border-slate-200/90">
        <p className="text-xs leading-relaxed text-slate-500 mb-4">
          Push notifications below are separate from the email toggles above — they&apos;re instant
          browser alerts, and every alert also shows up in your notification bell (top right)
          so you never lose it if you miss the popup.
        </p>
        <PushNotificationToggle />
      </div>
    </div>
  );
}
