"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", name: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName: form.orgName, name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <p className="text-slate-400 mt-1">Create your organization account</p>
        </div>

        {/* Form */}
        <div className="erp-card">
          <h2 className="text-xl font-semibold mb-6" style={{ color: "#0f172a" }}>Get started for free</h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Organization / Business Name</label>
              <input
                type="text" value={form.orgName}
                onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                className="erp-input" placeholder="e.g. My Jewelry Store" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Your Full Name</label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="erp-input" placeholder="e.g. Ahmad Razif" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Email Address</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="erp-input" placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Password</label>
              <input
                type="password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="erp-input" placeholder="Min. 8 characters" required minLength={8}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: "#374151" }}>Confirm Password</label>
              <input
                type="password" value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="erp-input" placeholder="Repeat your password" required
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="erp-btn erp-btn-primary w-full justify-center mt-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: "#94a3b8" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "#2563eb" }}>
              Sign in
            </Link>
          </p>
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
