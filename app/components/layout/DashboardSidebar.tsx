"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/lib/auth-context";
import {
  getDashboardLeads,
  getDashboardConversations,
  getDashboardProfile,
  getMyOwnedBusinesses,
  getActiveBusinessId,
  setActiveBusinessId,
  type OwnedBusinessSummary,
} from "@/app/lib/business-dashboard-api";
import {
  LayoutDashboard,
  Building2,
  Users,
  Star,
  MessageSquare,
  Package,
  Image,
  Bell,
  Settings,
  HelpCircle,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  ExternalLink,
  X,
  Sparkles,
  User,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

interface NavGroup {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
    badge?: string | number;
    badgeColor?: string;
  }[];
}

const categories: NavGroup[] = [
  {
    title: "OVERVIEW & PROFILE",
    items: [
      { name: "Overview", href: "/business-dashboard", icon: LayoutDashboard },
      { name: "Business Profile", href: "/business-dashboard/profile", icon: Building2 },
      { name: "My Claims", href: "/business-dashboard/claims", icon: FileCheck },
    ],
  },
  {
    title: "LEADS & CUSTOMERS",
    items: [
      { name: "Leads CRM", href: "/business-dashboard/leads", icon: Users },
      { name: "Messages Inbox", href: "/business-dashboard/messages", icon: MessageSquare },
      { name: "Reviews & Ratings", href: "/business-dashboard/reviews", icon: Star },
    ],
  },
  {
    title: "GROWTH & CONTENT",
    items: [
      { name: "Products & Services", href: "/business-dashboard/products", icon: Package },
      { name: "Media Gallery", href: "/business-dashboard/media", icon: Image },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Notifications", href: "/business-dashboard/notifications", icon: Bell },
    ],
  },
  {
    title: "SETTINGS & SUPPORT",
    items: [
      { name: "Settings", href: "/business-dashboard/settings", icon: Settings },
      { name: "Help & Support", href: "/business-dashboard/help", icon: HelpCircle },
    ],
  },
];

interface DashboardSidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function DashboardSidebar({
  mobileOpen,
  onMobileClose,
  collapsed,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const { accessToken } = useAuth();
  const [businesses, setBusinesses] = useState<OwnedBusinessSummary[]>([]);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [newLeadsCount, setNewLeadsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getMyOwnedBusinesses(accessToken)
      .then((list) => {
        setBusinesses(list);
        // No selection yet (first load, or a stale id from a business no longer owned) — default
        // to the most recently claimed one, same as the pre-switcher single-business behavior.
        const activeId = getActiveBusinessId();
        if (list.length > 0 && !list.some((b) => b.id === activeId)) {
          setActiveBusinessId(list[0].id);
        }
      })
      .catch(() => setBusinesses([]));

    getDashboardLeads(accessToken)
      .then((leads) => setNewLeadsCount(leads.filter((l) => l.status === "NEW").length))
      .catch(() => setNewLeadsCount(0));

    getDashboardConversations(accessToken)
      .then((convos) => setUnreadMessagesCount(convos.reduce((sum, c) => sum + c.messages.filter((m) => m.sender === "CUSTOMER" && !m.isRead).length, 0)))
      .catch(() => setUnreadMessagesCount(0));

    getDashboardProfile(accessToken)
      .then((p) => setAvgRating(p.reviewCount > 0 ? p.avgRating : null))
      .catch(() => setAvgRating(null));
  }, [accessToken]);

  const activeBusiness = businesses.find((b) => b.id === getActiveBusinessId()) ?? businesses[0] ?? null;

  const handleSwitchBusiness = (id: string) => {
    setActiveBusinessId(id);
    setSwitcherOpen(false);
    // Every dashboard page fetches its own data via useEffect/state, not server-rendered — a full
    // reload is the simplest way to guarantee every one of them re-fetches under the new business
    // instead of tracking down and invalidating each page's local state individually.
    window.location.reload();
  };

  const dynamicBadges: Record<string, { badge?: string | number; badgeColor?: string }> = {
    "/business-dashboard/leads": newLeadsCount > 0 ? { badge: `${newLeadsCount} New`, badgeColor: "bg-purple-100 text-purple-700 font-extrabold" } : {},
    "/business-dashboard/messages": unreadMessagesCount > 0 ? { badge: unreadMessagesCount, badgeColor: "bg-purple-600 text-white" } : {},
    "/business-dashboard/reviews": avgRating != null ? { badge: `${avgRating.toFixed(1)}★`, badgeColor: "bg-amber-100 text-amber-700 font-bold" } : {},
  };

  const renderNavGroup = (group: NavGroup) => (
    <div key={group.title} className="space-y-1">
      {!collapsed && (
        <h3 className="px-3 text-[10px] font-black tracking-wider text-slate-400 uppercase font-sans">
          {group.title}
        </h3>
      )}
      {group.items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/business-dashboard" && pathname.startsWith(item.href));

        const dynamic = dynamicBadges[item.href];
        const badge = dynamic?.badge;
        const badgeColor = dynamic?.badgeColor;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onMobileClose}
            title={collapsed ? item.name : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-none text-xs font-bold transition-all group relative font-sans",
              isActive
                ? "bg-purple-600 text-white shadow-none shadow-purple-600/30 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
            )}
          >
            <Icon
              className={cn(
                "w-5 h-5 shrink-0 transition-colors",
                isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"
              )}
            />

            {!collapsed && <span className="truncate">{item.name}</span>}

            {!collapsed && badge && (
              <span
                className={cn(
                  "ml-auto text-[9px] px-2 py-0.5 rounded-none leading-none font-bold",
                  badgeColor || "bg-slate-100 text-slate-600"
                )}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={cn(
          "bg-white border-r border-slate-200/90 flex flex-col fixed lg:static top-0 bottom-0 left-0 z-50 transition-all duration-300 select-none shadow-none font-sans h-screen",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Top Header / Brand */}
        <div className={cn("h-16 flex items-center shrink-0 border-b border-slate-100 relative", collapsed ? "justify-center px-0" : "justify-between px-4")}>
          <Link href="/business-dashboard" className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.png" alt="Hubigo" className="w-9 h-9 object-contain shrink-0" />
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-black tracking-tight text-slate-900 leading-none">
                  HUB<span className="text-purple-600">IGO</span>
                </span>
                <span className="text-[9px] font-bold text-purple-600 uppercase tracking-wider mt-0.5">
                  Business Hub 🏢
                </span>
              </div>
            )}
          </Link>

          {/* Mobile Close */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="p-1.5 rounded-none text-slate-500 bg-slate-100 hover:text-slate-900 hover:bg-slate-200 transition-colors absolute right-4"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Managed Business Switcher — a dropdown when the owner has more than one business,
            a plain pill (no dropdown affordance) when they only have the one */}
        {!collapsed && activeBusiness && (
          <div className="mx-3 mt-3 relative">
            <button
              onClick={() => businesses.length > 1 && setSwitcherOpen((o) => !o)}
              className={cn(
                "w-full p-3 bg-gradient-to-br from-purple-50 via-indigo-50/50 to-slate-50 border border-purple-100 rounded-none flex items-center gap-2.5 text-left transition-colors",
                businesses.length > 1 ? "hover:border-purple-300 cursor-pointer" : "cursor-default",
              )}
            >
              <div className="w-9 h-9 rounded-none bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-none shadow-purple-600/30 overflow-hidden">
                {activeBusiness.logoUrl ? (
                  <img src={activeBusiness.logoUrl} alt={activeBusiness.name} className="w-full h-full object-cover" />
                ) : (
                  activeBusiness.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-extrabold text-slate-900 truncate">{activeBusiness.name}</h4>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", activeBusiness.isVerified ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className={cn("text-[10px] font-bold", activeBusiness.isVerified ? "text-emerald-700" : "text-amber-700")}>
                    {activeBusiness.isVerified ? "Verified" : "Claimed"}
                  </span>
                </div>
              </div>
              {businesses.length > 1 && <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
            </button>

            {switcherOpen && businesses.length > 1 && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200/90 rounded-none shadow-xl p-1.5 z-50 space-y-0.5 animate-in fade-in zoom-in-95 max-h-72 overflow-y-auto">
                {businesses.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => handleSwitchBusiness(b.id)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-none hover:bg-slate-50 transition-colors text-left cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-none bg-purple-100 text-purple-700 font-black text-[10px] flex items-center justify-center shrink-0 overflow-hidden">
                      {b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="w-full h-full object-cover" /> : b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="flex-1 min-w-0 text-xs font-bold text-slate-800 truncate">{b.name}</span>
                    {b.id === activeBusiness.id && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Nav Items List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-none">
          {categories.map((cat) => renderNavGroup(cat))}
        </div>

        {/* Footer Links: Switch to Customer View & View Live Listing */}
        <div className="p-3 border-t border-slate-100 space-y-2">
          {!mobileOpen && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex items-center justify-center gap-2 p-2.5 rounded-none border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all w-full cursor-pointer",
                collapsed && "px-0"
              )}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : (
                <>
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                  <span>Collapse Sidebar</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/"
            className={cn(
              "flex items-center justify-center gap-2 p-2.5 rounded-none border border-purple-200/80 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all shadow-none",
              collapsed && "px-0"
            )}
          >
            <User className="w-4 h-4 text-purple-600 shrink-0" />
            {!collapsed && <span>Customer View 👤</span>}
          </Link>

          <Link
            href={activeBusiness ? `/business/${activeBusiness.slug}` : "#"}
            target="_blank"
            className={cn(
              "flex items-center justify-center gap-2 p-2.5 rounded-none border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-all shadow-none",
              collapsed && "px-0"
            )}
          >
            <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
            {!collapsed && <span>View Live Listing</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
