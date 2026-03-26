"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!data.success) {
        // If email not verified, redirect to verify-email page
        if (data.requiresVerification && data.email) {
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        // Trial expired — show a clear message
        if (data.trialExpired) {
          setError("Your 14-day free trial has ended. Please contact support@nexa-erp.com to continue.");
          return;
        }
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#FFFAFA' }}
    >
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{ background: '#000080' }}
      >
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div
              className="w-9 h-9 flex items-center justify-center text-white"
              style={{ background: '#6D8196', fontSize: 10, letterSpacing: '0.15em', fontWeight: 500 }}
            >
              ERP
            </div>
            <div>
              <div className="text-sm tracking-wide text-white">NEXA Commerce</div>
              <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#ADD8E6' }}>Multi-Channel ERP</div>
            </div>
          </div>
          <h2
            className="text-3xl mb-4"
            style={{ color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            Command your<br />commerce operations
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#ADD8E6', opacity: 0.7 }}>
            All channels. All orders. All products. One dashboard.
          </p>
        </div>
        <div>
          <div className="space-y-2 mb-8">
            <p className="text-[9px] tracking-[0.25em] uppercase mb-3" style={{ color: '#3A5A9A' }}>Live Metrics</p>
            {[
              { label: 'Total Orders', value: '247' },
              { label: 'Revenue (7d)', value: 'RM 48,920' },
              { label: 'Low Stock', value: '18 items' },
            ].map((m) => (
              <div
                key={m.label}
                className="flex items-center justify-between px-4 py-3"
                style={{ background: '#0A0A90', border: '1px solid #1A1AA8' }}
              >
                <span className="text-[10px]" style={{ color: '#ADD8E6' }}>{m.label}</span>
                <span className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#FFFFFF' }}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#ADD8E6' }} />
            <p className="text-[10px]" style={{ color: '#3A5A9A', fontFamily: "'IBM Plex Mono', monospace" }}>
              malaysia_erp_prod connected
            </p>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="flex items-center gap-3 mb-10 lg:hidden">
          <div
            className="w-8 h-8 flex items-center justify-center text-white"
            style={{ background: '#6D8196', fontSize: 9, letterSpacing: '0.15em' }}
          >
            ERP
          </div>
          <div className="text-sm tracking-wide" style={{ color: '#000080' }}>NEXA Commerce</div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-[9px] tracking-[0.25em] uppercase mb-1" style={{ color: '#6D8196' }}>Secure Access</p>
            <h1 className="text-2xl" style={{ color: '#000080', letterSpacing: '-0.01em' }}>Sign in to Dashboard</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] tracking-[0.2em] uppercase mb-1.5" style={{ color: '#6D8196' }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full px-4 py-2.5 text-[12px] outline-none"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  background: '#F0F8FF',
                  border: '1px solid #C8DFF0',
                  color: '#000080',
                }}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[9px] tracking-[0.1em] uppercase hover:opacity-70 transition-opacity"
                  style={{ color: '#ADD8E6' }}
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-2.5 text-[12px] outline-none pr-10"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: '#F0F8FF',
                    border: '1px solid #C8DFF0',
                    color: '#000080',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#ADD8E6' }}
                >
                  {showPass ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ background: '#F0F5FF', border: '1px solid #C8DFF0' }}
              >
                <AlertCircle size={12} style={{ color: '#6D8196', flexShrink: 0 }} />
                <p className="text-[11px]" style={{ color: '#6D8196' }}>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase py-3 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: '#000080' }}
            >
              {loading ? (
                <>
                  <div
                    className="w-3.5 h-3.5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#ADD8E6', borderTopColor: 'transparent' }}
                  />
                  Authenticating...
                </>
              ) : (
                <>Sign In <ArrowRight size={12} /></>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5" style={{ borderTop: '1px solid #C8DFF0' }}>
            <p className="text-center text-[11px]" style={{ color: '#6D8196' }}>
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="hover:opacity-70 transition-opacity"
                style={{ color: '#000080', fontWeight: 500 }}
              >
                Create your account
              </Link>
            </p>
          </div>

          <div className="mt-4">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase justify-center hover:opacity-70 transition-opacity"
              style={{ color: '#6D8196' }}
            >
              Back to Landing Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
