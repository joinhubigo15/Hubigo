"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/auth-context";
import SavedBusinessesCard from "@/app/components/profile/SavedBusinessesCard";
import SavedSearchesCard from "@/app/components/profile/SavedSearchesCard";

export default function SavedPage() {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/saved")}`);
    }
  }, [initializing, user, router]);

  if (initializing || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full bg-white min-h-[calc(100vh-64px)] lg:min-h-screen">
      <div className="w-full flex flex-col min-h-screen">
        <div className="px-4 py-5 sm:px-6 sm:py-6 border-b border-slate-200/90">
          <h1 className="text-xl sm:text-2xl lg:text-xl font-black text-slate-900">Saved</h1>
          <p className="text-xs sm:text-sm lg:text-xs text-slate-500 font-semibold mt-1">Businesses you&apos;ve bookmarked and searches you&apos;ve saved</p>
        </div>

        <SavedBusinessesCard />
        <SavedSearchesCard />
      </div>
    </div>
  );
}
