"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail, AlertCircle } from "lucide-react";

const NAVY  = "#000080";
const SLATE = "#6D8196";
const LIGHT = "#ADD8E6";
const BORDER = "#C8DFF0";
const SANS  = "'IBM Plex Sans', sans-serif";
const MONO  = "'IBM Plex Mono', monospace";

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]       = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: SANS, background: "#FFFAFA" }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{ background: NAVY }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 flex items-center justify-center text-white"
              style={{ background: "#6D8196", fontSize: 10, letterSpacing: "0.15em", fontWeight: 500 }}
            >
              ERP
            </div>
            <div>
              <div className="text-sm tracking-wide text-white">NEXA Commerce</div>
              <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: LIGHT }}>
                Multi-Channel ERP
              </div>
            </div>
          </div>
          <h2
            className="text-3xl mb-4"
            style={{ color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2 }}
          >
            Account<br />recovery
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: LIGHT, opacity: 0.7 }}>
            Enter your email and we&apos;ll send a secure link to reset your password.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIGHT }} />
          <p className="text-[10px]" style={{ color: "#3A5A9A", fontFamily: MONO }}>
            malaysia_erp_prod connected
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div
            className="w-8 h-8 flex items-center justify-center text-white"
            style={{ background: "#6D8196", fontSize: 9, letterSpacing: "0.15em" }}
          >
            ERP
          </div>
          <div className="text-sm tracking-wide" style={{ color: NAVY }}>NEXA Commerce</div>
        </div>

        <div className="w-full max-w-sm">
          {submitted ? (
            /* ── Success state ── */
            <div>
              <div
                className="w-12 h-12 flex items-center justify-center mb-6"
                style={{ background: "#F0F8FF", border: `1px solid ${BORDER}` }}
              >
                <Mail size={20} style={{ color: NAVY }} />
              </div>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: SLATE }}>
                Email Sent
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Check your inbox
              </h1>
              <p className="text-[12px] leading-relaxed mb-2" style={{ color: SLATE }}>
                If an account exists for{" "}
                <span style={{ fontFamily: MONO, color: NAVY }}>{email}</span>, a reset
                link has been sent. Check your spam folder if you don&apos;t see it.
              </p>
              <p className="text-[11px] mb-8" style={{ color: LIGHT }}>
                The link expires in <strong>1 hour</strong>.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase hover:opacity-70 transition-opacity"
                style={{ color: SLATE }}
              >
                <ArrowLeft size={11} /> Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: SLATE }}>
                  Account Recovery
                </p>
                <h1 className="text-2xl" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                  Forgot your password?
                </h1>
                <p className="text-[12px] mt-1.5" style={{ color: SLATE }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 px-3 py-2.5 mb-4"
                  style={{ background: "#F0F5FF", border: `1px solid ${BORDER}` }}
                >
                  <AlertCircle size={12} style={{ color: SLATE, flexShrink: 0 }} />
                  <p className="text-[11px]" style={{ color: SLATE }}>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    className="block text-[9px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: SLATE }}
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full px-4 py-2.5 text-[12px] outline-none"
                    style={{
                      fontFamily: MONO,
                      background: "#F0F8FF",
                      border: `1px solid ${BORDER}`,
                      color: NAVY,
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
                  style={{ background: NAVY }}
                >
                  {loading ? (
                    <>
                      <div
                        className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                        style={{ borderColor: LIGHT, borderTopColor: "transparent" }}
                      />
                      Sending link...
                    </>
                  ) : (
                    <>Send Reset Link <ArrowRight size={12} /></>
                  )}
                </button>
              </form>

              <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase justify-center hover:opacity-70 transition-opacity"
                  style={{ color: SLATE }}
                >
                  <ArrowLeft size={11} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
