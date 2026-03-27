"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

const FIELD_STYLE = {
  fontFamily: "'IBM Plex Mono', monospace",
  background: "#F0F8FF",
  border: "1px solid #C8DFF0",
  color: "#000080",
};

const LABEL_STYLE = {
  display: "block" as const,
  fontSize: 9,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "#6D8196",
  marginBottom: 6,
};

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ orgName: "", name: "", email: "", password: "", confirmPassword: "" });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setError("");
    };
  }

  async function handleSubmit(e: React.FormEvent) {
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
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#FFFAFA" }}
    >
      {/* ── Left panel (desktop) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{ background: "#000080" }}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 flex items-center justify-center text-white flex-shrink-0"
              style={{ background: "#6D8196", fontSize: 10, letterSpacing: "0.15em", fontWeight: 500 }}
            >
              ERP
            </div>
            <div>
              <div className="text-sm tracking-wide text-white">NEXA Commerce</div>
              <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "#ADD8E6" }}>Multi-Channel ERP</div>
            </div>
          </div>

          <h2
            className="text-3xl mb-4"
            style={{ color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            Start your<br />14-day free trial
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#ADD8E6", opacity: 0.75 }}>
            No credit card required. Full access to every feature from day one.
          </p>

          {/* What's included */}
          <div className="space-y-3">
            <p className="text-[9px] tracking-[0.25em] uppercase mb-4" style={{ color: "#3A5A9A" }}>
              What&apos;s included
            </p>
            {[
              "Unified order management",
              "Multi-channel inventory sync",
              "Live analytics dashboard",
              "Report builder & CSV export",
              "Customer CRM & segments",
              "Auto-sync every 30 minutes",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={12} style={{ color: "#ADD8E6", flexShrink: 0 }} />
                <span className="text-[11px]" style={{ color: "#ADD8E6", opacity: 0.85 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Platforms footer */}
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase mb-3" style={{ color: "#3A5A9A" }}>
            Supported channels
          </p>
          <div className="flex flex-wrap gap-2">
            {["Shopify", "TikTok", "Shopee", "Lazada", "Amazon"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 text-[9px] tracking-wider uppercase"
                style={{ background: "#0A0A90", color: "#ADD8E6", border: "1px solid #1A1AA8" }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-8 lg:hidden">
          <div
            className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0"
            style={{ background: "#6D8196", fontSize: 9, letterSpacing: "0.15em" }}
          >
            ERP
          </div>
          <div className="text-sm tracking-wide" style={{ color: "#000080" }}>NEXA Commerce</div>
        </div>

        <div className="w-full max-w-sm">
          {/* Heading */}
          <div className="mb-7">
            <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#6D8196" }}>Free trial · 14 days</p>
            <h1 className="text-2xl" style={{ color: "#000080", letterSpacing: "-0.01em" }}>Create your account</h1>
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-start gap-2 px-3 py-2.5 mb-4"
              style={{ background: "#F0F5FF", border: "1px solid #C8DFF0" }}
            >
              <AlertCircle size={12} style={{ color: "#6D8196", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "#6D8196" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Organisation */}
            <div>
              <label style={LABEL_STYLE}>Organisation / Business Name</label>
              <input
                type="text"
                value={form.orgName}
                onChange={set("orgName")}
                placeholder="e.g. My Jewelry Store"
                required
                className="w-full px-4 py-2.5 text-[12px] outline-none"
                style={FIELD_STYLE}
              />
            </div>

            {/* Full name */}
            <div>
              <label style={LABEL_STYLE}>Your Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                placeholder="e.g. Ahmad Razif"
                required
                className="w-full px-4 py-2.5 text-[12px] outline-none"
                style={FIELD_STYLE}
              />
            </div>

            {/* Email */}
            <div>
              <label style={LABEL_STYLE}>Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 text-[12px] outline-none"
                style={FIELD_STYLE}
              />
            </div>

            {/* Password */}
            <div>
              <label style={LABEL_STYLE}>Password</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 text-[12px] outline-none pr-10"
                  style={FIELD_STYLE}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#ADD8E6" }}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={LABEL_STYLE}>Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-2.5 text-[12px] outline-none pr-10"
                  style={FIELD_STYLE}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#ADD8E6" }}
                >
                  {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase py-3 mt-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "#000080" }}
            >
              {loading ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: "#ADD8E6", borderTopColor: "transparent" }}
                  />
                  Creating account...
                </>
              ) : (
                <>Start Free Trial <ArrowRight size={12} /></>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-6 pt-5" style={{ borderTop: "1px solid #C8DFF0" }}>
            <p className="text-center text-[11px]" style={{ color: "#6D8196" }}>
              Already have an account?{" "}
              <Link
                href="/login"
                className="hover:opacity-70 transition-opacity"
                style={{ color: "#000080", fontWeight: 500 }}
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase justify-center hover:opacity-70 transition-opacity"
              style={{ color: "#6D8196" }}
            >
              Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
