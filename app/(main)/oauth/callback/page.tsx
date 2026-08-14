"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import type { PublicUser } from "@/app/lib/api";

const roleRedirect: Record<string, string> = {
  user: "/",
  business_owner: "/business-dashboard",
  admin: "/admin",
  super_admin: "/admin",
};

export default function OAuthCallbackPage() {
  const { setSession } = useAuth();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // The backend redirects here with the session in the URL fragment (never sent to any server) —
    // e.g. #accessToken=...&user=... — so it's read once client-side and immediately dropped from the URL.
    // Deferred to a microtask so the state updates below happen outside the effect's synchronous pass.
    queueMicrotask(() => {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = hash.get("accessToken");
      const userParam = hash.get("user");
      const intent = hash.get("intent"); // which login tab (User/Business) was actually clicked

      if (!accessToken || !userParam) {
        setErrorMsg("Sign-in failed — missing session data from Google.");
        return;
      }

      try {
        const user = JSON.parse(decodeURIComponent(userParam)) as PublicUser;
        setSession({ accessToken, user });
        window.history.replaceState(null, "", window.location.pathname);

        // Admins always land in /admin regardless of tab. Otherwise the destination follows the
        // tab the person actually clicked (intent), not the account's stored role — a
        // business_owner account that explicitly chose "User Login" must land in the normal user
        // flow rather than being forced into the business dashboard just because it also owns a
        // business elsewhere.
        // A brand-new plain-user Google signup (onboardingCompleted still false, set once at
        // account creation) gets sent through the one-time profile setup wizard first — but only
        // for the "user" intent, not a business signup, which has its own dashboard onboarding.
        const isFirstTimeUserSignup =
          user.role === "user" && intent !== "business_owner" && !user.onboardingCompleted;

        const destination = isFirstTimeUserSignup
          ? "/register/user"
          : user.role === "admin" || user.role === "super_admin"
            ? roleRedirect[user.role]
            : intent === "business_owner"
              ? roleRedirect.business_owner
              : roleRedirect.user;

        router.replace(destination);
      } catch {
        setErrorMsg("Sign-in failed — could not read session data.");
      }
    });
  }, [setSession, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto px-4 text-center">
        {errorMsg ? (
          <div className="bg-white rounded-[var(--radius-2xl)] border border-border-light p-8 shadow-md">
            <p className="text-sm text-error font-semibold mb-4">{errorMsg}</p>
            <a href="/login" className="text-primary font-bold hover:underline text-sm">
              Back to log in
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-secondary-500">Signing you in...</p>
          </div>
        )}
      </div>
    </div>
  );
}
