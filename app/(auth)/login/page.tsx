"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DEMO_USERS } from "@/lib/demo-users";

function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN": return "#dc2626";
    case "MANAGER": return "#2563eb";
    case "STAFF": return "#16a34a";
    default: return "#6b7280";
  }
}

function getRoleBadgeBg(role: string): string {
  switch (role) {
    case "ADMIN": return "#fee2e2";
    case "MANAGER": return "#dbeafe";
    case "STAFF": return "#dcfce7";
    default: return "#f3f4f6";
  }
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case "ADMIN": return "#991b1b";
    case "MANAGER": return "#1e40af";
    case "STAFF": return "#166534";
    default: return "#374151";
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const doLogin = async (loginEmail: string, loginPassword: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Login failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await doLogin(email, password);
  };

  const handleQuickLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    await doLogin(demoEmail, demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "#2563eb" }}>
            <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">Malaysia ERP</h1>
          <p className="text-slate-400 mt-1">Multi-Channel Commerce Platform</p>
        </div>

        {/* Form */}
        <div className="erp-card">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "#0f172a" }}>Sign in to your account</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="erp-input"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="erp-input"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="erp-btn erp-btn-primary w-full justify-center mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Quick Login Section */}
          <div className="mt-6 pt-4 border-t" style={{ borderColor: "#e5e7eb" }}>
            <p className="text-sm font-medium mb-3" style={{ color: "#374151" }}>
              Quick Login — Select an Account
            </p>
            <div className="space-y-2">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.id}
                  type="button"
                  disabled={loading}
                  onClick={() => handleQuickLogin(demoUser.email, demoUser.password)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.borderColor = "#2563eb"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ background: getRoleColor(demoUser.role) }}
                  >
                    {demoUser.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{demoUser.name}</div>
                    <div className="text-xs truncate" style={{ color: "#64748b" }}>{demoUser.email}</div>
                  </div>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: getRoleBadgeBg(demoUser.role), color: getRoleBadgeColor(demoUser.role) }}
                  >
                    {demoUser.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Platforms */}
        <div className="mt-8 flex justify-center gap-3 flex-wrap">
          {["Shopify", "TikTok", "Shopee", "Lazada", "Amazon"].map((p) => (
            <span key={p} className="px-3 py-1 rounded-full text-xs font-medium" style={{ background: "rgba(255,255,255,0.1)", color: "#94a3b8" }}>
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
