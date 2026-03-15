"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  {
    label: "Main",
    items: [
      { href: "/dashboard", icon: "⊞", label: "Dashboard" },
      { href: "/sql-console", icon: "🖥️", label: "SQL Console" },
      { href: "/orders", icon: "📦", label: "Orders" },
      { href: "/products", icon: "🏷️", label: "Products" },
      { href: "/inventory", icon: "🏭", label: "Inventory" },
      { href: "/customers", icon: "👥", label: "Customers" },
    ],
  },
  {
    label: "Channels",
    items: [
      { href: "/integrations", icon: "🔗", label: "Integrations" },
      { href: "/integrations/shopify", icon: "🟢", label: "Shopify" },
      { href: "/integrations/tiktok", icon: "⚫", label: "TikTok Shop" },
      { href: "/integrations/shopee", icon: "🟠", label: "Shopee" },
      { href: "/integrations/lazada", icon: "🔵", label: "Lazada" },
      { href: "/integrations/amazon", icon: "🟡", label: "Amazon MY" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/reports", icon: "📊", label: "Reports" },
    ],
  },
];

function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN": return "#dc2626";
    case "MANAGER": return "#2563eb";
    case "STAFF": return "#16a34a";
    default: return "#6b7280";
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: "#1e293b" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: "#2563eb" }}>
            ERP
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Malaysia ERP</div>
            <div className="text-xs" style={{ color: "#475569" }}>Multi-Channel Commerce</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navItems.map((section) => (
          <div key={section.label} className="mb-6">
            <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#475569" }}>
              {section.label}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm"
                  style={{
                    color: isActive(item.href) ? "#ffffff" : "#94a3b8",
                    background: isActive(item.href) ? "#1e3a5f" : "transparent",
                    fontWeight: isActive(item.href) ? "500" : "400",
                  }}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="p-4 border-t" style={{ borderColor: "#1e293b" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={{ background: getRoleColor(user?.role || "") }}
          >
            {user?.name?.charAt(0) || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white truncate">
              {user?.name || "Loading..."}
            </div>
            <div className="text-xs truncate" style={{ color: "#475569" }}>
              {user?.email || ""}
            </div>
          </div>
          {user?.role && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{
                background: user.role === "ADMIN" ? "rgba(220,38,38,0.15)" : user.role === "MANAGER" ? "rgba(37,99,235,0.15)" : "rgba(22,163,74,0.15)",
                color: user.role === "ADMIN" ? "#fca5a5" : user.role === "MANAGER" ? "#93c5fd" : "#86efac",
              }}
            >
              {user.role}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
