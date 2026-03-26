"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

function TrialBanner() {
  const { user } = useAuth();
  if (!user?.trialEndsAt || user.plan !== "trial") return null;

  const msLeft = new Date(user.trialEndsAt).getTime() - Date.now();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return null;

  const urgent = daysLeft <= 3;

  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-2 text-xs text-center"
      style={{
        background: urgent ? "#B05050" : "#C5960C",
        color: "#fff",
        fontFamily: "'IBM Plex Sans', sans-serif",
      }}
    >
      <AlertTriangle size={12} />
      <span>
        {urgent
          ? `⚠ Trial ends in ${daysLeft} day${daysLeft !== 1 ? "s" : ""} — contact us to upgrade`
          : `Free trial · ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`}
      </span>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  // Default closed; open on desktop after hydration
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop: open by default; on mobile: closed by default
      if (!mobile) setSidebarOpen(true);
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#FFFAFA" }}
    >
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar — inline on desktop, overlay on mobile */}
      <div
        className={`
          ${isMobile
            ? "fixed inset-y-0 left-0 z-30 transition-transform duration-200"
            : "flex-shrink-0 h-full transition-all duration-200"
          }
          ${isMobile
            ? sidebarOpen ? "translate-x-0" : "-translate-x-full"
            : sidebarOpen ? "w-[220px]" : "w-0"
          }
        `}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TrialBanner />
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
