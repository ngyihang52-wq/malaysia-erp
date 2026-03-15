"use client";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function getRoleColor(role: string) {
  switch (role) {
    case "ADMIN": return { bg: "#fee2e2", color: "#991b1b" };
    case "MANAGER": return { bg: "#dbeafe", color: "#1e40af" };
    default: return { bg: "#dcfce7", color: "#166534" };
  }
}

function getAvatarColor(role: string) {
  switch (role) {
    case "ADMIN": return "#dc2626";
    case "MANAGER": return "#2563eb";
    default: return "#16a34a";
  }
}

export default function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  const roleStyle = user ? getRoleColor(user.role) : { bg: "#f1f5f9", color: "#64748b" };

  return (
    <div
      className="flex items-center justify-between px-8 py-4 border-b bg-white"
      style={{ borderColor: "#e2e8f0" }}
    >
      <div>
        <h1 className="text-xl font-semibold" style={{ color: "#0f172a" }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {user && (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable user chip */}
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-3 border-l transition-colors"
              style={{
                borderColor: "#e2e8f0",
                background: "transparent",
                border: "none",
                borderLeft: "1px solid #e2e8f0",
                paddingLeft: 12,
                cursor: "pointer",
                borderRadius: 8,
                padding: "6px 10px 6px 12px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { if (!dropdownOpen) e.currentTarget.style.background = "transparent"; }}
            >
              <div
                className="flex items-center justify-center text-white text-xs font-semibold"
                style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: getAvatarColor(user.role), flexShrink: 0,
                }}
              >
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium" style={{ color: "#374151" }}>
                {user.name}
              </span>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: roleStyle.bg, color: roleStyle.color, fontSize: 10 }}
              >
                {user.role}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 2 }}>
                <path d="M3 4.5L6 7.5L9 4.5" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div
                style={{
                  position: "absolute", right: 0, top: "calc(100% + 6px)",
                  width: 220, background: "#fff", borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 25px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)",
                  zIndex: 50, overflow: "hidden",
                }}
              >
                {/* User info */}
                <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div className="text-sm font-semibold" style={{ color: "#0f172a" }}>{user.name}</div>
                  <div className="text-xs" style={{ color: "#94a3b8", marginTop: 2 }}>{user.email}</div>
                </div>

                {/* Sign Out */}
                <div style={{ padding: 6 }}>
                  <button
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="w-full text-left text-sm rounded-lg transition-colors"
                    style={{
                      padding: "9px 12px", color: "#ef4444",
                      background: "transparent", border: "none",
                      cursor: "pointer", fontWeight: 500,
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 14H3.333A1.333 1.333 0 012 12.667V3.333A1.333 1.333 0 013.333 2H6M10.667 11.333L14 8l-3.333-3.333M14 8H6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
