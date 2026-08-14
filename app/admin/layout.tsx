"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "./lib/admin-auth-context";
import { AdminSidebar } from "./components/AdminSidebar";
import { AdminNavbar } from "./components/AdminNavbar";
import { AdminCommandPalette } from "./components/AdminCommandPalette";
import { cn } from "@/app/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Check if current route is a public auth page (/admin/login, /admin/forgot-password, etc.)
  const isAuthPage =
    pathname === "/admin/login" ||
    pathname === "/admin/forgot-password" ||
    pathname === "/admin/reset-password";

  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans selection:bg-purple-600 selection:text-white antialiased">
        {isAuthPage ? (
          <main>{children}</main>
        ) : (
          <div className="min-h-screen flex">
            {/* SIDEBAR */}
            <AdminSidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            />

            {/* MAIN CONTENT AREA */}
            <div
              className={cn(
                "flex-1 flex flex-col min-w-0 transition-all duration-300",
                collapsed ? "ml-20" : "ml-64"
              )}
            >
              {/* NAVBAR */}
              <AdminNavbar
                collapsed={collapsed}
                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
              />

              {/* PAGE CONTAINER */}
              <main className="flex-1 pt-20 pb-12 px-4 sm:px-6 lg:px-8 max-w-[1600px] w-full mx-auto space-y-8">
                {children}
              </main>
            </div>

            {/* GLOBAL COMMAND PALETTE MODAL (CTRL+K) */}
            <AdminCommandPalette
              isOpen={isCommandPaletteOpen}
              onClose={() => setIsCommandPaletteOpen(false)}
            />
          </div>
        )}
      </div>
    </AdminAuthProvider>
  );
}
