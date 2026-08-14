"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Heart, HelpCircle, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "@/app/lib/auth-context";
import ProfileHeaderCard from "@/app/components/profile/ProfileHeaderCard";
import EditProfileForm from "@/app/components/profile/EditProfileForm";
import NotificationPreferencesCard from "@/app/components/profile/NotificationPreferencesCard";

export default function ProfilePage() {
  const { user, initializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent("/profile")}`);
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
    <div className="flex flex-col w-full bg-white flex-1 min-h-screen">
      <div className="hidden lg:block px-8 py-8 border-b border-slate-200/90 bg-white sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-slate-900">Profile & Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account and notification preferences
        </p>
      </div>

      <div className="flex flex-col lg:flex-row w-full flex-1">
        {/* Left Column: Forms */}
        <div className="order-last lg:order-first flex-1 flex flex-col border-r border-slate-200/90">
          <EditProfileForm />
          <NotificationPreferencesCard />
        </div>

        {/* Right Column: Account Overview & Quick Actions — shown first on mobile so the
            profile preview (photo/name/badges) is the first thing visible, before the edit forms. */}
        <div className="order-first lg:order-last w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-slate-50/50 flex flex-col">
          <ProfileHeaderCard />
          
          <div className="pb-8 flex flex-col gap-3 lg:gap-0 hidden lg:flex">
             <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 mt-4 px-8">Quick Actions</h3>
             <Link href="/register/user" className="flex items-center gap-4 p-4 lg:px-8 rounded-2xl lg:rounded-none bg-white border border-slate-200 lg:border-x-0 lg:border-t-0 lg:border-b hover:border-purple-300 lg:hover:border-purple-200 hover:shadow-md lg:hover:shadow-none transition-all group">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                   <Sparkles className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Update Preferences</h4>
                   <p className="text-xs text-slate-500 mt-0.5">Edit your info, city & interests via guided setup</p>
                </div>
             </Link>

             <Link href="/saved" className="flex items-center gap-4 p-4 lg:px-8 rounded-2xl lg:rounded-none bg-white border border-slate-200 lg:border-x-0 lg:border-t-0 lg:border-b hover:border-purple-300 lg:hover:border-purple-200 hover:shadow-md lg:hover:shadow-none transition-all group">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                   <Heart className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Saved Businesses</h4>
                   <p className="text-xs text-slate-500 mt-0.5">View your favorite places</p>
                </div>
             </Link>

             <Link href="/contact" className="flex items-center gap-4 p-4 lg:px-8 rounded-2xl lg:rounded-none bg-white border border-slate-200 lg:border-x-0 lg:border-t-0 lg:border-b-0 hover:border-purple-300 lg:hover:border-purple-200 hover:shadow-md lg:hover:shadow-none transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                   <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">Help & Support</h4>
                   <p className="text-xs text-slate-500 mt-0.5">Get assistance with your account</p>
                </div>
             </Link>
          </div>

          <div className="flex flex-col lg:hidden border-t border-slate-200/90">
            <Link
              href="/register/user"
              className="flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Sparkles className="w-4 h-4 text-purple-600" /> Update Preferences
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
            <Link
              href="/saved"
              className="flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Heart className="w-4 h-4 text-rose-500" /> Saved Businesses
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
            <Link
              href="/contact"
              className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <HelpCircle className="w-4 h-4 text-blue-500" /> Help & Support
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
