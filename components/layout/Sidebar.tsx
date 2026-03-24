"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingBag,
  Box,
  Layers3,
  Users,
  User,
  Plug,
  ShoppingCart,
  Music,
  Package,
  Globe,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MainNavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  end: boolean;
  adminOnly?: boolean;
}

interface ChannelNavItem {
  label: string;
  icon: LucideIcon;
  href: string;
  status: string | null;
}

const mainNav: MainNavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", end: true },
  { label: "Reports", icon: BarChart3, href: "/reports", end: false },
  { label: "Orders", icon: ShoppingBag, href: "/orders", end: false },
  { label: "Products", icon: Box, href: "/products", end: false },
  { label: "Inventory", icon: Layers3, href: "/inventory", end: false },
  { label: "Customers", icon: Users, href: "/customers", end: false },
  { label: "Users", icon: User, href: "/users", end: false, adminOnly: true },
];

const channelNav: ChannelNavItem[] = [
  { label: "Integrations", icon: Plug, href: "/integrations", status: null },
  { label: "Shopify", icon: ShoppingCart, href: "/channels/shopify", status: null },
  { label: "TikTok Shop", icon: Music, href: "/channels/tiktok", status: null },
  { label: "Shopee", icon: ShoppingBag, href: "/channels/shopee", status: null },
  { label: "Lazada", icon: Package, href: "/channels/lazada", status: null },
  { label: "Amazon", icon: Globe, href: "/channels/amazon", status: null },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string, end?: boolean) => {
    if (end) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full overflow-hidden"
      style={{ background: "#000080" }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex-shrink-0" style={{ borderBottom: "1px solid #1A1AA8" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "#6D8196", fontSize: 9, letterSpacing: "0.15em", fontWeight: 500 }}
          >
            ERP
          </div>
          <div className="min-w-0">
            <div className="text-white text-xs tracking-wide truncate">NEXA Commerce</div>
            <div className="text-[10px] tracking-wider truncate" style={{ color: "#5A7AB8" }}>
              Multi-Channel
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2">
        {/* Main section */}
        <div className="mb-4">
          <p
            className="text-[9px] tracking-[0.25em] uppercase px-3 mb-1.5"
            style={{ color: "#3A5A9A" }}
          >
            Main
          </p>
          <nav>
            {mainNav
              .filter(
                (item) =>
                  !item.adminOnly ||
                  user?.role === "ADMIN" ||
                  user?.role === "SUPER_ADMIN"
              )
              .map((item) => {
                const active = isActive(item.href, item.end);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 text-[11px] tracking-wide transition-colors mb-0.5 ${
                      active ? "text-white border-l-2 pl-[10px]" : "hover:text-[#ADD8E6]"
                    }`}
                    style={{
                      background: active ? "#0A0AB0" : "transparent",
                      borderLeftColor: active ? "#ADD8E6" : "transparent",
                      color: active ? "#FFFFFF" : "#7A9DC0",
                    }}
                  >
                    <item.icon size={13} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
          </nav>
        </div>

        {/* Channels section */}
        <div>
          <p
            className="text-[9px] tracking-[0.25em] uppercase px-3 mb-1.5"
            style={{ color: "#3A5A9A" }}
          >
            Channels
          </p>
          <nav>
            {channelNav.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 text-[11px] tracking-wide transition-colors mb-0.5 ${
                    active ? "border-l-2 pl-[10px]" : ""
                  }`}
                  style={{
                    background: active ? "#0A0AB0" : "transparent",
                    borderLeftColor: active ? "#ADD8E6" : "transparent",
                    color: active ? "#FFFFFF" : "#7A9DC0",
                  }}
                >
                  <item.icon size={13} />
                  <span className="flex-1">{item.label}</span>
                  {item.status && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: item.status === "connected" ? "#ADD8E6" : "#2A3A7A",
                      }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User + Logout */}
      <div className="px-2 py-3 flex-shrink-0" style={{ borderTop: "1px solid #1A1AA8" }}>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "#6D8196", fontSize: 10 }}
          >
            {user?.name?.charAt(0) ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] truncate" style={{ color: "#ADD8E6" }}>
              {user?.name ?? "Loading..."}
            </div>
            <div className="text-[9px] tracking-[0.15em]" style={{ color: "#3A5A9A" }}>
              {user?.role ?? ""}
            </div>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="cursor-pointer transition-colors flex-shrink-0 hover:opacity-80"
            style={{ color: "#3A5A9A" }}
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>
    </aside>
  );
}
