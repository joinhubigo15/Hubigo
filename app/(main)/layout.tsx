"use client";

import { usePathname } from "next/navigation";
import DesktopSidebar from "@/app/components/layout/DesktopSidebar";
import DesktopHeader from "@/app/components/layout/DesktopHeader";
import MobileBottomNav from "@/app/components/layout/MobileBottomNav";
import { useNotFoundFlag } from "@/app/lib/not-found-context";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isNotFound } = useNotFoundFlag();

  // A bogus URL anywhere under (main) — e.g. /business/some-slug-that-does-not-exist — renders
  // the root not-found.tsx boundary, which is its own full-screen page. Skip all of this layout's
  // chrome (sidebar, header, bottom nav) so only that page shows, same as the auth pages below.
  if (isNotFound) {
    return <>{children}</>;
  }

  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/verify-email" ||
    pathname === "/oauth/callback" ||
    pathname === "/register/user";

  if (isAuthPage) {
    const isDarkBgAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/register/user";
    return (
      <main className={`min-h-screen w-full ${isDarkBgAuthPage ? "bg-[#0a0718]" : "bg-[#f1f4f9]"}`}>
        {children}
      </main>
    );
  }

  const isNoSidebarPage = pathname === "/about" || pathname === "/terms";

  if (isNoSidebarPage) {
    return (
      <div className="min-h-screen bg-[#0f111d] font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900 flex flex-col w-full">
        <DesktopHeader />
        <main className="flex-1 w-full">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f4f9] font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900 flex flex-col">
      {/* Fixed Left Sidebar (Desktop View) */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col h-full min-h-screen justify-start pb-16 lg:pb-0">
        {/* Top Header Controls (Desktop View) */}
        <DesktopHeader />

        {/* Page Main Sections */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Fixed Bottom Navigation Bar (Mobile View) */}
      <MobileBottomNav />
    </div>
  );
}
