"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import { subscribeToPushRequest, unsubscribeFromPushRequest } from "@/app/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

type PushState = "unsupported" | "unavailable" | "checking" | "subscribed" | "unsubscribed" | "denied";

/** Self-contained "enable push notifications" control. Registers the service worker at
 * /sw.js, requests browser permission, subscribes via PushManager, and syncs the subscription
 * to the backend. No-ops cleanly when the browser doesn't support push or VAPID isn't configured. */
function initialPushState(): PushState {
  if (typeof window === "undefined") return "checking";
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (!VAPID_PUBLIC_KEY) return "unavailable";
  if (Notification.permission === "denied") return "denied";
  return "checking";
}

export default function PushNotificationToggle() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<PushState>(initialPushState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state !== "checking") return;

    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setState(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setState("unavailable"));
  }, [state]);

  const handleEnable = async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      await subscribeToPushRequest(accessToken, sub.toJSON() as PushSubscriptionJSON);
      setState("subscribed");
    } catch {
      setError("Couldn't enable push notifications. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPushRequest(accessToken, sub.endpoint);
        await sub.unsubscribe();
      }
      setState("unsubscribed");
    } catch {
      setError("Couldn't disable push notifications. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (state === "unsupported" || state === "unavailable" || state === "checking") return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm shadow-slate-200/50 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        <div
          className={
            state === "subscribed"
              ? "w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200"
              : "w-9 h-9 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200"
          }
        >
          {state === "subscribed" ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
        </div>
        <div>
          <p className="text-xs font-black text-slate-900">
            {state === "denied" ? "Push notifications blocked" : "Push Notifications"}
          </p>
          <p className="text-[11px] text-slate-500 font-semibold">
            {state === "denied"
              ? "Enable notifications for this site in your browser settings."
              : state === "subscribed"
              ? "You'll get browser alerts for new leads, reviews, and claim decisions."
              : "Get instant browser alerts even when Hubigo isn't open."}
          </p>
          {error && <p className="text-[11px] text-rose-600 font-semibold mt-0.5">{error}</p>}
        </div>
      </div>

      {state !== "denied" && (
        <button
          onClick={state === "subscribed" ? handleDisable : handleEnable}
          disabled={busy}
          className={
            state === "subscribed"
              ? "px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              : "px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          }
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {!busy && (state === "subscribed" ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />)}
          <span>{state === "subscribed" ? "Turn off" : "Enable"}</span>
        </button>
      )}
    </div>
  );
}
