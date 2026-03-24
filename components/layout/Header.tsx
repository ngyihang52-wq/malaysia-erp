"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { RefreshCw, Bell, ChevronDown, Menu, X } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/reports": "Reports",
  "/orders": "Orders",
  "/products": "Products",
  "/inventory": "Inventory",
  "/customers": "Customers",
  "/users": "Users",
  "/integrations": "Integrations",
};

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ sidebarOpen, onToggleSidebar }: HeaderProps) {
  const [dateRange, setDateRange] = useState("7 days");
  const pathname = usePathname();

  const currentTitle =
    pageTitles[pathname] ||
    (pathname.includes("/integrations/")
      ? pathname.split("/integrations/")[1].charAt(0).toUpperCase() +
        pathname.split("/integrations/")[1].slice(1)
      : "Dashboard");

  return (
    <header
      className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b"
      style={{ background: "#FFFAFA", borderColor: "#C8DFF0" }}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="transition-colors"
          style={{ color: "#6D8196" }}
        >
          {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
        <div>
          <p
            className="text-[9px] tracking-[0.2em] uppercase"
            style={{ color: "#6D8196" }}
          >
            Malaysia ERP
          </p>
          <p className="text-sm tracking-wide" style={{ color: "#000080" }}>
            {currentTitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date range — hidden on xs */}
        <div className="relative hidden sm:block">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="appearance-none bg-white text-[11px] tracking-wider px-3 py-1.5 pr-7 cursor-pointer outline-none"
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              border: "1px solid #C8DFF0",
              color: "#000080",
            }}
          >
            <option>7 days</option>
            <option>30 days</option>
            <option>90 days</option>
            <option>This year</option>
          </select>
          <ChevronDown
            size={10}
            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "#6D8196" }}
          />
        </div>

        {/* Sync button — icon-only on mobile */}
        <button
          className="flex items-center gap-2 text-white text-[10px] tracking-[0.15em] px-3 sm:px-4 py-1.5 hover:opacity-90 transition-opacity"
          style={{ background: "#000080" }}
        >
          <RefreshCw size={11} />
          <span className="hidden sm:inline">SYNC ALL</span>
        </button>

        <button
          className="relative p-1.5 transition-colors"
          style={{ color: "#6D8196" }}
        >
          <Bell size={15} />
          <span
            className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
            style={{ background: "#6D8196" }}
          />
        </button>
      </div>
    </header>
  );
}
