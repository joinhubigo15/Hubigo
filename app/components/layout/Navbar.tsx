"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";
import Button from "@/app/components/ui/Button";
import { useAuth } from "@/app/lib/auth-context";
import { User, LayoutDashboard, Building2, Plus, LogOut, ChevronDown } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Explore" },
  { href: "/nearby", label: "Nearby 📍" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const isBusinessOwner = user && (user.role === "business_owner" || user.role === "admin" || user.role === "super_admin");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setUserDropdownOpen(false);
    await logout();
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "glass-strong shadow-sm border-b border-border-light"
            : "bg-transparent"
        )}
        id="main-navbar"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-18">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 flex-shrink-0"
              id="navbar-logo"
            >
              <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-secondary">
                Hub
                <span className="gradient-text">igo</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1" id="desktop-nav">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 text-sm font-medium text-secondary-600 hover:text-primary rounded-[var(--radius-md)] hover:bg-primary-50 transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}

              {/* Direct Business Dashboard Link ONLY for Logged-In Business Owners */}
              {isBusinessOwner && (
                <Link
                  href="/business-dashboard"
                  className="px-4 py-2 text-sm font-bold text-purple-600 hover:text-purple-700 bg-purple-50/80 hover:bg-purple-100/80 rounded-[var(--radius-md)] transition-all duration-200 flex items-center gap-1.5 ml-1"
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-600" />
                  <span>Business Dashboard</span>
                </Link>
              )}
            </nav>

            {/* Desktop Actions / Auth Pill */}
            <div className="hidden md:flex items-center gap-3" id="desktop-actions">
              <Link href="/business/register">
                <Button variant="primary" size="sm" className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>List Your Business</span>
                </Button>
              </Link>

              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{user.name.split(" ")[0]}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-2.5 z-50 space-y-1 animate-in fade-in zoom-in-95">
                      <div className="p-2 border-b border-slate-100">
                        <p className="font-extrabold text-xs text-slate-900 truncate">{user.name}</p>
                        <span className="inline-block text-[9px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded mt-1 uppercase">
                          {user.role === "business_owner" ? "Business Account" : user.role}
                        </span>
                      </div>

                      {isBusinessOwner ? (
                        <Link
                          href="/business-dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 rounded-xl transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-purple-600" />
                          <span>Business Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          href="/register/user"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                        >
                          <User className="w-4 h-4 text-slate-500" />
                          <span>My Profile Setup</span>
                        </Link>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-[var(--radius-md)] text-secondary-600 hover:text-secondary hover:bg-secondary-100 transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
              id="mobile-menu-toggle"
            >
              <div className="relative w-5 h-5">
                <span
                  className={cn(
                    "absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                    mobileMenuOpen
                      ? "top-2.5 rotate-45"
                      : "top-1"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-2.5 h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                    mobileMenuOpen && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 h-0.5 w-5 bg-current rounded-full transition-all duration-300",
                    mobileMenuOpen
                      ? "top-2.5 -rotate-45"
                      : "top-4"
                  )}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          mobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div
          className={cn(
            "absolute top-0 right-0 w-[280px] h-full bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col",
            mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Close area spacer */}
          <div className="h-16 flex-shrink-0" />

          {/* Nav Links */}
          <nav className="flex flex-col px-4 py-4 gap-1 flex-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 text-base font-medium text-secondary-700 hover:text-primary hover:bg-primary-50 rounded-[var(--radius-md)] transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}

            {isBusinessOwner && (
              <Link
                href="/business-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-base font-bold text-purple-700 bg-purple-50 rounded-[var(--radius-md)] transition-all duration-200 mt-2"
              >
                <LayoutDashboard className="w-5 h-5 text-purple-600" />
                <span>Business Dashboard</span>
              </Link>
            )}
          </nav>

          {/* Mobile Actions */}
          <div className="flex flex-col gap-2 px-6 py-6 border-t border-border">
            {!user ? (
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" size="md" className="w-full">
                  Log in
                </Button>
              </Link>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full py-2.5 bg-rose-50 text-rose-600 font-bold text-sm rounded-xl border border-rose-200"
              >
                Log Out
              </button>
            )}
            <Link href="/add-listing" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="md" className="w-full">
                List Your Business
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
