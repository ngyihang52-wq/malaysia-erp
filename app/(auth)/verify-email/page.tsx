"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

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

  // If token is present, verify it automatically
  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed.");
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
      if (data.success) {
        setResent(true);
      }
    } catch {
      // silent fail
    } finally {
      setResending(false);
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
          <p className="text-slate-400 mt-1">Email Verification</p>
        </div>

        <div className="erp-card text-center">
          {/* Verifying state */}
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <svg className="animate-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f172a" }}>Verifying your email...</h2>
              <p className="text-sm" style={{ color: "#64748b" }}>Please wait while we confirm your email address.</p>
            </>
          )}

          {/* Success state */}
          {status === "success" && (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#f0fdf4" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f172a" }}>{message}</h2>
              <p className="text-sm mb-6" style={{ color: "#64748b" }}>Your account is now active. You can sign in to access your dashboard.</p>
              <Link
                href="/login"
                className="erp-btn erp-btn-primary w-full justify-center"
              >
                Sign In to Dashboard
              </Link>
            </>
          )}

          {/* Error state */}
          {status === "error" && (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#fef2f2" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 18L18 6M6 6l12 12" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f172a" }}>Verification Failed</h2>
              <p className="text-sm mb-6" style={{ color: "#64748b" }}>{message}</p>
              <Link
                href="/register"
                className="erp-btn erp-btn-primary w-full justify-center"
              >
                Try Again
              </Link>
            </>
          )}

          {/* Waiting state — user just registered, check inbox */}
          {status === "waiting" && (
            <>
              <div className="mx-auto mb-4 w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "#eff6ff" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="3" stroke="#2563eb" strokeWidth="2"/>
                  <path d="M2 7l10 6 10-6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "#0f172a" }}>Check your email</h2>
              <p className="text-sm mb-2" style={{ color: "#64748b" }}>
                We sent a verification link to:
              </p>
              {email && (
                <p className="text-sm font-semibold mb-4" style={{ color: "#0f172a" }}>{email}</p>
              )}
              <p className="text-sm mb-6" style={{ color: "#64748b" }}>
                Click the link in the email to verify your account. The link expires in 24 hours.
              </p>

              {/* Resend button */}
              {email && (
                <button
                  onClick={handleResend}
                  disabled={resending || resent}
                  className="erp-btn w-full justify-center mb-3"
                  style={{
                    background: resent ? "#f0fdf4" : "#f8fafc",
                    color: resent ? "#16a34a" : "#475569",
                    border: `1px solid ${resent ? "#bbf7d0" : "#e2e8f0"}`,
                    opacity: resending ? 0.7 : 1,
                  }}
                >
                  {resent ? "Verification email sent!" : resending ? "Sending..." : "Resend verification email"}
                </button>
              )}

              <Link
                href="/login"
                className="text-sm font-medium"
                style={{ color: "#2563eb" }}
              >
                Back to Sign In
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
        <div className="text-white text-sm">Loading...</div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
