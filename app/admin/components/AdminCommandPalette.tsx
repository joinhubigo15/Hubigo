"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  FileCheck,
  Users,
  FolderTree,
  MapPin,
  Star,
  ShieldCheck,
  Settings,
  UploadCloud,
  X,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Navigation" | "Businesses" | "Claims" | "Settings";
  href: string;
  icon: React.ElementType;
}

const COMMAND_ITEMS: CommandItem[] = [
  { id: "1", title: "Dashboard Overview", subtitle: "System metrics & live activity telemetry", category: "Navigation", href: "/admin", icon: Building2 },
  { id: "2", title: "Businesses Directory", subtitle: "Manage 712k listings, verify or bulk edit", category: "Businesses", href: "/admin/businesses", icon: Building2 },
  { id: "3", title: "Business Claims Queue", subtitle: "Moderate pending GST & MSME verification claims", category: "Claims", href: "/admin/claims", icon: FileCheck },
  { id: "4", title: "Categories & Subcategories", subtitle: "16 sectors and 198 subcategories taxonomy", category: "Navigation", href: "/admin/categories", icon: FolderTree },
  { id: "5", title: "Cities & Regional Areas", subtitle: "Manage cities and neighborhood geo tags", category: "Navigation", href: "/admin/cities", icon: MapPin },
  { id: "6", title: "User Accounts", subtitle: "1.2M users and business owner profiles", category: "Navigation", href: "/admin/users", icon: Users },
  { id: "7", title: "Reviews Moderation", subtitle: "Spam detector and reported review queue", category: "Navigation", href: "/admin/reviews", icon: Star },
  { id: "8", title: "CSV Importer Jobs", subtitle: "Monitor 700k batch import tasks & error logs", category: "Navigation", href: "/admin/imports", icon: UploadCloud },
  { id: "9", title: "Security Audit Logs", subtitle: "Immutable admin action audit trail", category: "Settings", href: "/admin/audit-logs", icon: ShieldCheck },
  { id: "10", title: "Platform Settings", subtitle: "Storage, R2, Railway, SMTP, OAuth & feature flags", category: "Settings", href: "/admin/settings", icon: Settings },
];

export const AdminCommandPalette: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open palette
          const ev = new CustomEvent("open-command-palette");
          window.dispatchEvent(ev);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = COMMAND_ITEMS.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-200">
      <div
        className="bg-[#0b0f19] border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden space-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* INPUT HEADER */}
        <div className="flex items-center px-4 border-b border-slate-800/80 bg-[#070a12]">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search (e.g., 'Claims', 'Cake Couture', 'Settings')..."
            autoFocus
            className="w-full px-4 py-4 bg-transparent text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* RESULTS LIST */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-800">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item.href)}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/40 hover:bg-purple-600/15 border border-slate-800/60 hover:border-purple-500/40 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-white group-hover:text-purple-200 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0 ml-3" />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs font-semibold">
              No matching commands or resources found for &quot;{query}&quot;.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-4 py-2.5 bg-[#070a12] border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-medium">
          <span>Navigate with ⬆ ⬇ keys, Enter to select</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
