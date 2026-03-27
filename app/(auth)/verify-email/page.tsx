"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail, CheckCircle2, XCircle, ArrowRight, ArrowLeft, RefreshCw,
} from "lucide-react";

/* ── Design tokens (shared across all auth pages) ── */
const NAVY   = "#000080";
const SLATE  = "#6D8196";
const LIGHT  = "#ADD8E6";
const BORDER = "#C8DFF0";
const SANS   = "'IBM Plex Sans', sans-serif";
const MONO   = "'IBM Plex Mono', monospace";

/* ── Shared left panel ── */
function LeftPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
      style={{ background: NAVY }}
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
            <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: LIGHT }}>
              Multi-Channel ERP
            </div>
          </div>
        </div>

        <h2
          className="text-3xl mb-4"
          style={{ color: "#FFFFFF", letterSpacing: "-0.02em", lineHeight: 1.2 }}
        >
          Almost<br />there
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: LIGHT, opacity: 0.75 }}>
          One last step — verify your email to activate your account and start your 14-day free trial.
        </p>

        <div className="mt-10 space-y-3">
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: "#3A5A9A" }}>
            What happens next
          </p>
          {[
            "Check your inbox for the link",
            "Click to verify your address",
            "Sign in to your dashboard",
          ].map((step, i) => (
            <div key={step} className="flex items-start gap-3">
              <div
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-white"
                style={{ background: "#0A0A90", border: "1px solid #1A1AA8", fontSize: 9, fontFamily: MONO }}
              >
                {i + 1}
              </div>
              <span className="text-[11px] pt-0.5" style={{ color: LIGHT, opacity: 0.85 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: LIGHT }} />
        <p className="text-[10px]" style={{ color: "#3A5A9A", fontFamily: MONO }}>
          malaysia_erp_prod connected
        </p>
      </div>
    </div>
  );
}

/* ── Mobile logo ── */
function MobileLogo() {
  return (
    <div className="flex items-center gap-3 mb-10 lg:hidden">
      <div
        className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0"
        style={{ background: "#6D8196", fontSize: 9, letterSpacing: "0.15em" }}
      >
        ERP
      </div>
      <div className="text-sm tracking-wide" style={{ color: NAVY }}>NEXA Commerce</div>
    </div>
  );
}

/* ── Icon box ── */
function IconBox({ children, accent }: { children: React.ReactNode; accent: string }) {
  return (
    <div
      className="w-12 h-12 flex items-center justify-center mb-6"
      style={{ background: "#F0F8FF", border: `1px solid ${BORDER}` }}
    >
      <div style={{ color: accent }}>{children}</div>
    </div>
  );
}

/* ── Main content ── */
function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<"verifying" | "success" | "error" | "waiting">(
    token ? "verifying" : "waiting"
  );
  const [message, setMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/verify-email?token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setStatus("success");
          setMessage("Your email has been verified.");
        } else {
          setStatus("error");
          setMessage(d.error || "Verification failed.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  const handleResend = async () => {
    if (!email || resending) return;
    setResending(true);
    setResent(false);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) setResent(true);
    } catch { /* silent */ } finally {
      setResending(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: SANS, background: "#FFFAFA" }}
    >
      <LeftPanel />

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <MobileLogo />

        <div className="w-full max-w-sm">

          {/* ── Verifying ── */}
          {status === "verifying" && (
            <div>
              <div className="w-12 h-12 flex items-center justify-center mb-6" style={{ background: "#F0F8FF", border: `1px solid ${BORDER}` }}>
                <div
                  className="w-5 h-5 border-2 rounded-full animate-spin"
                  style={{ borderColor: LIGHT, borderTopColor: "transparent" }}
                />
              </div>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: SLATE }}>
                Please wait
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Verifying your email…
              </h1>
              <p className="text-[12px]" style={{ color: SLATE }}>
                Confirming your email address. This only takes a moment.
              </p>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div>
              <IconBox accent="#4A7B5F">
                <CheckCircle2 size={22} />
              </IconBox>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#4A7B5F" }}>
                Verified
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                {message}
              </h1>
              <p className="text-[12px] leading-relaxed mb-8" style={{ color: SLATE }}>
                Your account is active and your 14-day free trial has started. Sign in to access your dashboard.
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:opacity-90 transition-opacity"
                style={{ background: NAVY }}
              >
                Sign In to Dashboard <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {/* ── Error ── */}
          {status === "error" && (
            <div>
              <IconBox accent="#B05050">
                <XCircle size={22} />
              </IconBox>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: "#B05050" }}>
                Verification Failed
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Link invalid or expired
              </h1>
              <p className="text-[12px] leading-relaxed mb-8" style={{ color: SLATE }}>
                {message} Verification links expire after <strong>24 hours</strong>.
              </p>
              <Link
                href="/register"
                className="w-full flex items-center justify-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:opacity-90 transition-opacity mb-4"
                style={{ background: NAVY }}
              >
                Create a New Account <ArrowRight size={12} />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase justify-center hover:opacity-70 transition-opacity"
                style={{ color: SLATE }}
              >
                <ArrowLeft size={11} /> Back to Sign In
              </Link>
            </div>
          )}

          {/* ── Waiting — check your inbox ── */}
          {status === "waiting" && (
            <div>
              <IconBox accent={NAVY}>
                <Mail size={22} />
              </IconBox>
              <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: SLATE }}>
                Check your inbox
              </p>
              <h1 className="text-2xl mb-3" style={{ color: NAVY, letterSpacing: "-0.01em" }}>
                Verify your email
              </h1>

              {email ? (
                <p className="text-[12px] leading-relaxed mb-1" style={{ color: SLATE }}>
                  We sent a verification link to:
                </p>
              ) : (
                <p className="text-[12px] leading-relaxed mb-6" style={{ color: SLATE }}>
                  A verification link has been sent to your email address. Click it to activate your account.
                </p>
              )}

              {email && (
                <>
                  <p
                    className="text-[13px] mb-4"
                    style={{ fontFamily: MONO, color: NAVY, letterSpacing: "0.02em" }}
                  >
                    {email}
                  </p>
                  <p className="text-[11px] mb-8" style={{ color: SLATE }}>
                    Click the link in the email to verify your account. The link expires in{" "}
                    <span style={{ color: NAVY }}>24 hours</span>.
                    <br />
                    <span className="text-[10px]">Can&apos;t find it? Check your spam folder.</span>
                  </p>

                  {/* Resend */}
                  {resent ? (
                    <div
                      className="flex items-center gap-2 px-4 py-3 mb-4"
                      style={{ background: "#F0F8FF", border: `1px solid ${BORDER}` }}
                    >
                      <CheckCircle2 size={13} style={{ color: "#4A7B5F", flexShrink: 0 }} />
                      <p className="text-[11px]" style={{ color: "#4A7B5F" }}>
                        Verification email sent — check your inbox.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending}
                      className="w-full flex items-center justify-center gap-2 text-[11px] tracking-[0.15em] uppercase py-3 mb-4 hover:opacity-80 transition-opacity disabled:opacity-50"
                      style={{
                        background: "transparent",
                        border: `1px solid ${BORDER}`,
                        color: NAVY,
                      }}
                    >
                      {resending ? (
                        <>
                          <RefreshCw size={12} className="animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          <RefreshCw size={12} />
                          Resend verification email
                        </>
                      )}
                    </button>
                  )}
                </>
              )}

              <div className="pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase justify-center hover:opacity-70 transition-opacity"
                  style={{ color: SLATE }}
                >
                  <ArrowLeft size={11} /> Back to Sign In
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
