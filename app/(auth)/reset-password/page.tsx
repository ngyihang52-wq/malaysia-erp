"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

const NAVY  = "#000080";
const SLATE = "#6D8196";
const LIGHT = "#ADD8E6";
const BORDER = "#C8DFF0";
const SANS  = "'IBM Plex Sans', sans-serif";
const MONO  = "'IBM Plex Mono', monospace";

function strengthColor(len: number) {
  if (len === 0) return BORDER;
  if (len < 8)   return "#B05050";
  if (len < 12)  return "#C5960C";
  return "#4A7B5F";
}

function strengthLabel(len: number) {
  if (len === 0) return "";
  if (len < 8)   return "Too short";
  if (len < 12)  return "Fair";
  return "Strong";
}

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token        = searchParams.get("token") ?? "";

  const [password, setPassword]       = useState("");
  const [confirm, setConfirm]         = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [validating, setValidating]   = useState(true);
  const [tokenValid, setTokenValid]   = useState(false);
  const [tokenEmail, setTokenEmail]   = useState("");
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState(false);

  useEffect(() => {
    if (!token) { setValidating(false); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => { if (d.valid) { setTokenValid(true); setTokenEmail(d.email); } })
      .catch(() => {})
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 8)  { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  const barColor = strengthColor(password.length);

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
            Set a new<br />password
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: LIGHT, opacity: 0.7 }}>
            Choose a strong password to keep your account secure.
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
          {validating ? (
            /* ── Validating ── */
            <div className="text-center py-12">
              <div
                className="w-8 h-8 border-2 rounded-full animate-spin mx-auto mb-4"
                style={{ borderColor: LIGHT, borderTopColor: "transparent" }}
              />
              <p className="text-[11px] tracking-[0.1em] uppercase" style={{ color: SLATE }}>
                Verifying link…
              </p>
            </div>
          ) : !token || !tokenValid ? (
            /* ── Invalid / expired ── */
            <div>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#B05050" }}>
                Link Invalid
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Link expired or invalid
              </h1>
              <p className="text-[12px] leading-relaxed mb-6" style={{ color: SLATE }}>
                This reset link is invalid or has expired. Reset links are only
                valid for <strong>1 hour</strong>.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase px-6 py-3 hover:opacity-90 transition-opacity mb-4"
                style={{ background: NAVY }}
              >
                Request a new link <ArrowRight size={12} />
              </Link>
              <div className="mt-4">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase hover:opacity-70 transition-opacity"
                  style={{ color: SLATE }}
                >
                  <ArrowLeft size={11} /> Back to Sign In
                </Link>
              </div>
            </div>
          ) : success ? (
            /* ── Success ── */
            <div>
              <div
                className="w-12 h-12 flex items-center justify-center mb-6"
                style={{ background: "#F0F8FF", border: `1px solid ${BORDER}` }}
              >
                <CheckCircle2 size={20} style={{ color: "#4A7B5F" }} />
              </div>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#4A7B5F" }}>
                Success
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Password updated
              </h1>
              <p className="text-[12px] leading-relaxed mb-6" style={{ color: SLATE }}>
                Your password has been reset. You&apos;ll be redirected to sign in shortly.
              </p>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-[11px] tracking-[0.12em] uppercase hover:opacity-70 transition-opacity"
                style={{ color: NAVY }}
              >
                Sign in now <ArrowRight size={11} />
              </Link>
            </div>
          ) : (
            /* ── Reset form ── */
            <>
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: SLATE }}>
                  Account Recovery
                </p>
                <h1 className="text-2xl" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                  Set new password
                </h1>
                <p className="text-[12px] mt-1.5" style={{ color: SLATE, fontFamily: MONO }}>
                  {tokenEmail}
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
                {/* New password */}
                <div>
                  <label
                    className="block text-[9px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: SLATE }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      required
                      minLength={8}
                      className="w-full px-4 py-2.5 text-[12px] outline-none pr-10"
                      style={{
                        fontFamily: MONO,
                        background: "#F0F8FF",
                        border: `1px solid ${BORDER}`,
                        color: NAVY,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: LIGHT }}
                    >
                      {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="h-0.5 flex-1 transition-colors"
                            style={{
                              background: password.length >= i * 3 ? barColor : BORDER,
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] tracking-wide" style={{ color: barColor }}>
                        {strengthLabel(password.length)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    className="block text-[9px] tracking-[0.2em] uppercase mb-1.5"
                    style={{ color: SLATE }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                      placeholder="Re-enter your new password"
                      autoComplete="new-password"
                      required
                      className="w-full px-4 py-2.5 text-[12px] outline-none pr-10"
                      style={{
                        fontFamily: MONO,
                        background: "#F0F8FF",
                        border: `1px solid ${confirm && confirm !== password ? "#B05050" : BORDER}`,
                        color: NAVY,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ color: LIGHT }}
                    >
                      {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-[10px] mt-1" style={{ color: "#B05050" }}>
                      Passwords do not match
                    </p>
                  )}
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
                      Updating password...
                    </>
                  ) : (
                    <>Update Password <ArrowRight size={12} /></>
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{ background: "#FFFAFA" }}
        >
          <div
            className="w-8 h-8 border-2 rounded-full animate-spin"
            style={{ borderColor: LIGHT, borderTopColor: "transparent" }}
          />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
