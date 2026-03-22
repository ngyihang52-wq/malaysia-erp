"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#FFFAFA" }}
    >
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-[220px]" : "w-0"} flex-shrink-0 h-full overflow-hidden transition-all duration-200`}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
