"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, TrendingUp, TrendingDown, ShoppingBag, Box,
  CheckCircle2, Terminal, Layers3, Users, ChevronRight,
  LayoutDashboard, Plug,
} from 'lucide-react';

/* ─── mock data ─── */
const kpis = [
  { label: 'Total Revenue', value: 'RM 48,920', sub: '+8.7% this week', up: true },
  { label: 'Total Orders', value: '247', sub: '+12.4% vs last week', up: true },
  { label: 'Active Products', value: '1,842', sub: '5 channels', up: true },
  { label: 'Low Stock', value: '18', sub: 'Items need reorder', up: false },
];

const orders = [
  { id: 'ORD-2847', customer: 'Ahmad bin Rashid', channel: 'Shopee', amount: 'RM 284.00', status: 'Shipped', dot: '#4A7B5F' },
  { id: 'ORD-2846', customer: 'Lim Wei Xin', channel: 'TikTok', amount: 'RM 156.50', status: 'Processing', dot: '#6D8196' },
  { id: 'ORD-2845', customer: 'Nurul Aisyah', channel: 'Shopee', amount: 'RM 892.00', status: 'Pending', dot: '#ADD8E6' },
  { id: 'ORD-2844', customer: 'Raj Kumar', channel: 'Lazada', amount: 'RM 445.00', status: 'Delivered', dot: '#4A7B5F' },
  { id: 'ORD-2843', customer: 'Siti Aminah', channel: 'Shopify', amount: 'RM 1,200.00', status: 'Shipped', dot: '#4A7B5F' },
];

const channels = [
  { name: 'Shopify', orders: 0, revenue: 'RM 6,000', status: 'connected', pct: 28 },
  { name: 'Shopee', orders: 124, revenue: 'RM 22,380', status: 'active', pct: 61 },
  { name: 'TikTok', orders: 89, revenue: 'RM 12,440', status: 'active', pct: 44 },
  { name: 'Lazada', orders: 34, revenue: 'RM 8,100', status: 'active', pct: 22 },
  { name: 'Amazon', orders: 0, revenue: 'RM 0', status: 'offline', pct: 0 },
];

const tickerItems = [
  'ORD-2847  Shopee  +RM 284.00',
  'ORD-2846  TikTok  +RM 156.50',
  'ORD-2845  Shopee  +RM 892.00',
  'ORD-2844  Lazada  +RM 445.00',
  'ORD-2843  Shopify  +RM 1,200.00',
  'ORD-2842  TikTok  +RM 320.00',
  'ORD-2841  Shopee  +RM 78.50',
  'ORD-2840  Lazada  +RM 560.00',
];

const features = [
  { icon: LayoutDashboard, title: 'Live Dashboard', desc: 'Real-time KPIs, revenue trends, and order volume across all channels in one unified view.' },
  { icon: ShoppingBag, title: 'Order Management', desc: 'Filter and manage orders from every marketplace in a consolidated, searchable queue.' },
  { icon: Box, title: 'Product Catalogue', desc: 'Centralised listings with multi-channel publishing, SKU management, and bulk editing.' },
  { icon: Layers3, title: 'Inventory Control', desc: 'Live stock levels, reorder alerts, overstocked warnings, and warehouse location tracking.' },
  { icon: Users, title: 'Customer CRM', desc: 'Customer profiles, lifetime value, tier segmentation (Bronze to Platinum), and history.' },
  { icon: Terminal, title: 'SQL Console', desc: 'Direct database access with a query editor, saved queries, execution timer, and CSV export.' },
];

export default function LandingPage() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2200);
    return () => clearInterval(id);
  }, []);

  const liveTicker = tickerItems[tick % tickerItems.length];

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#FFFAFA', minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <nav
        className="flex items-center justify-between px-8 py-3.5 sticky top-0 z-50"
        style={{ background: '#FFFAFA', borderBottom: '1px solid #C8DFF0' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center text-white flex-shrink-0"
            style={{ background: '#000080', fontSize: 9, letterSpacing: '0.15em', fontWeight: 600 }}
          >
            NX
          </div>
          <div>
            <div className="text-sm tracking-wide" style={{ color: '#000080' }}>NEXA Commerce</div>
            <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Multi-Channel ERP</div>
          </div>
        </div>

        {/* Live ticker in nav */}
        <div
          className="hidden lg:flex items-center gap-2 px-4 py-1.5"
          style={{ background: '#F0F8FF', border: '1px solid #C8DFF0' }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ADD8E6' }} />
          <span className="text-[9px] tracking-wider" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}>
            {liveTicker}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <a href="#preview" className="text-[11px] tracking-[0.1em] uppercase transition-opacity hover:opacity-70" style={{ color: '#6D8196' }}>Preview</a>
          <a href="#features" className="text-[11px] tracking-[0.1em] uppercase transition-opacity hover:opacity-70" style={{ color: '#6D8196' }}>Features</a>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-white text-[11px] tracking-[0.1em] uppercase px-4 py-2 hover:opacity-90 transition-opacity"
            style={{ background: '#000080' }}
          >
            Log In <ArrowRight size={11} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ background: '#FFFAFA' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#C8DFF0 1px, transparent 1px), linear-gradient(90deg, #C8DFF0 1px, transparent 1px)',
            backgroundSize: '44px 44px',
            opacity: 0.18,
          }}
        />

        <div className="relative max-w-6xl mx-auto px-8 pt-24 pb-20">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ADD8E6' }} />
            <span className="text-[9px] tracking-[0.3em] uppercase" style={{ color: '#6D8196' }}>
              Malaysia Multi-Channel ERP — v2.0.0
            </span>
          </div>

          <div className="max-w-2xl mb-8">
            <h1
              className="mb-6"
              style={{ color: '#000080', letterSpacing: '-0.03em', lineHeight: '1.05', fontSize: '3.5rem' }}
            >
              One console for
              <br />
              <span style={{ color: '#6D8196' }}>every channel.</span>
            </h1>
            <p className="text-sm max-w-lg" style={{ color: '#4A6080', lineHeight: '1.75' }}>
              NEXA connects your Shopify store, Shopee, TikTok Shop, Lazada, and Amazon into a single
              industrial-grade operations dashboard — orders, inventory, customers, and SQL access in one place.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap mb-16">
            <Link
              href="/register"
              className="flex items-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase px-7 py-3.5 hover:opacity-90 transition-opacity"
              style={{ background: '#000080' }}
            >
              Sign Up <ArrowRight size={12} />
            </Link>
            <a
              href="#preview"
              className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase px-7 py-3.5 transition-colors"
              style={{ border: '1px solid #C8DFF0', color: '#6D8196', background: '#FFFFFF' }}
            >
              See Preview <ChevronRight size={12} />
            </a>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
                <p className="text-[9px] tracking-[0.15em] uppercase mb-2" style={{ color: '#6D8196' }}>{k.label}</p>
                <p className="text-2xl mb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080', letterSpacing: '-0.02em' }}>
                  {k.value}
                </p>
                <div className="flex items-center gap-1">
                  {k.up
                    ? <TrendingUp size={9} style={{ color: '#4A7B5F' }} />
                    : <TrendingDown size={9} style={{ color: '#6D8196' }} />}
                  <span className="text-[9px]" style={{ color: k.up ? '#4A7B5F' : '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {k.sub}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live order feed ticker ── */}
      <div
        className="overflow-hidden py-2.5"
        style={{ background: '#000080', borderTop: '1px solid #1A1AA8' }}
      >
        <div className="flex items-center gap-8 px-8">
          <span
            className="flex items-center gap-1.5 flex-shrink-0 text-[9px] tracking-[0.2em] uppercase border-r pr-6"
            style={{ color: '#ADD8E6', borderColor: '#1A1AA8' }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#ADD8E6' }} />
            Live Feed
          </span>
          <div className="flex items-center gap-10 overflow-hidden">
            {tickerItems.map((item, i) => (
              <span
                key={i}
                className="flex-shrink-0 text-[9px] tracking-wider transition-opacity duration-500"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: i === tick % tickerItems.length ? '#FFFFFF' : '#3A5A9A',
                  opacity: i === tick % tickerItems.length ? 1 : 0.5,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full-width dashboard preview ── */}
      <section id="preview" className="py-20" style={{ background: '#F0F5FF' }}>
        <div className="max-w-6xl mx-auto px-8">
          <div className="mb-10">
            <p className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: '#6D8196' }}>Dashboard Preview</p>
            <h2 className="text-3xl" style={{ color: '#000080', letterSpacing: '-0.01em' }}>
              See the full picture — at a glance
            </h2>
          </div>

          <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
            {/* Header bar */}
            <div
              className="flex items-center justify-between px-6 py-3"
              style={{ background: '#000080', borderBottom: '1px solid #1A1AA8' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#ADD8E6' }} />
                <span className="text-[10px] tracking-[0.2em] uppercase text-white">Channel Performance Overview</span>
              </div>
              <span className="text-[9px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#ADD8E6' }}>
                20 Mar 2026 09:41
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue line graph */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Revenue Trend (7 Days)</p>
                  <div className="flex items-center gap-3">
                    {[{ label: 'Shopee', color: '#000080' }, { label: 'TikTok', color: '#ADD8E6' }, { label: 'Lazada', color: '#6D8196' }].map(l => (
                      <div key={l.label} className="flex items-center gap-1">
                        <span className="w-3 h-0.5 inline-block" style={{ background: l.color }} />
                        <span className="text-[8px]" style={{ color: '#6D8196' }}>{l.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <svg viewBox="0 0 340 140" className="w-full" style={{ overflow: 'visible' }}>
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map(i => (
                    <line key={i} x1="0" y1={i * 28} x2="340" y2={i * 28} stroke="#EEF5FF" strokeWidth="1" />
                  ))}

                  {/* Y-axis labels */}
                  {[{ y: 4, label: '30k' }, { y: 32, label: '22k' }, { y: 60, label: '15k' }, { y: 88, label: '8k' }, { y: 116, label: '0' }].map(t => (
                    <text key={t.label} x="-6" y={t.y + 4} textAnchor="end" fontSize="7" fill="#8AAFC8" fontFamily="IBM Plex Mono, monospace">{t.label}</text>
                  ))}

                  {/* X-axis labels */}
                  {['14', '15', '16', '17', '18', '19', '20'].map((d, i) => (
                    <text key={d} x={i * 56 + 2} y="134" fontSize="7" fill="#8AAFC8" fontFamily="IBM Plex Mono, monospace">Mar {d}</text>
                  ))}

                  {/* Shopee line */}
                  <polyline
                    points="0,88 56,72 112,60 168,44 224,52 280,32 336,16"
                    fill="none" stroke="#000080" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                  />

                  {/* TikTok line */}
                  <polyline
                    points="0,100 56,92 112,84 168,76 224,80 280,64 336,52"
                    fill="none" stroke="#ADD8E6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                  />

                  {/* Lazada line */}
                  <polyline
                    points="0,108 56,104 112,100 168,96 224,98 280,88 336,80"
                    fill="none" stroke="#6D8196" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="4 2"
                  />

                  {/* Area fill under Shopee */}
                  <defs>
                    <linearGradient id="shopeeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#000080" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#000080" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points="0,88 56,72 112,60 168,44 224,52 280,32 336,16 336,112 0,112"
                    fill="url(#shopeeGrad)"
                  />

                  {/* Dots on Shopee */}
                  {[[0,88],[56,72],[112,60],[168,44],[224,52],[280,32],[336,16]].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="2.5" fill="#000080" stroke="#FFFAFA" strokeWidth="1.5" />
                  ))}

                  {/* Highlight last dot */}
                  <circle cx="336" cy="16" r="4" fill="#000080" stroke="#FFFAFA" strokeWidth="2" />
                  <text x="318" y="10" fontSize="7.5" fill="#000080" fontFamily="IBM Plex Mono, monospace" fontWeight="600">RM 22.4k</text>
                </svg>

                <div
                  className="flex items-center justify-between mt-4 px-4 py-3"
                  style={{ background: '#F0F8FF', border: '1px solid #C8DFF0' }}
                >
                  <span className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Total (7d)</span>
                  <span className="text-lg" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080', letterSpacing: '-0.02em' }}>
                    RM 48,920
                  </span>
                </div>
              </div>

              {/* Channel status list */}
              <div>
                <p className="text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: '#6D8196' }}>Channel Health</p>
                <div className="space-y-2">
                  {channels.map((ch) => (
                    <div
                      key={ch.name}
                      className="flex items-center justify-between px-4 py-3 bg-white"
                      style={{ border: '1px solid #EEF5FF' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: ch.status === 'connected' || ch.status === 'active' ? '#ADD8E6' : '#C8DFF0' }}
                        />
                        <span className="text-[11px] tracking-wide" style={{ color: '#000080' }}>{ch.name}</span>
                        <span
                          className="text-[8px] tracking-[0.1em] uppercase px-1.5 py-0.5"
                          style={{
                            color: ch.status === 'offline' ? '#8AAFC8' : '#6D8196',
                            background: ch.status === 'offline' ? '#F5F9FF' : '#E8F4FF',
                          }}
                        >
                          {ch.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-5 text-right">
                        <div>
                          <p className="text-[8px] uppercase tracking-wider" style={{ color: '#8AAFC8' }}>Orders</p>
                          <p className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>{ch.orders}</p>
                        </div>
                        <div>
                          <p className="text-[8px] uppercase tracking-wider" style={{ color: '#8AAFC8' }}>Revenue</p>
                          <p className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>{ch.revenue}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order table preview */}
            <div style={{ borderTop: '1px solid #C8DFF0' }}>
              <div className="flex items-center justify-between px-6 py-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
                <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Recent Orders</p>
                <span className="text-[9px] tracking-[0.1em] uppercase" style={{ color: '#ADD8E6' }}>Live</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                      {['Order ID', 'Customer', 'Channel', 'Amount', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-2.5 font-normal text-[9px] tracking-[0.15em] uppercase"
                          style={{ color: '#6D8196' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o, i) => (
                      <tr
                        key={o.id}
                        style={{
                          borderBottom: '1px solid #F5F9FF',
                          background: i === tick % orders.length ? '#F8FBFF' : 'transparent',
                        }}
                      >
                        <td className="px-6 py-3 text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}>
                          #{o.id}
                        </td>
                        <td className="px-6 py-3 text-xs" style={{ color: '#1A2540' }}>{o.customer}</td>
                        <td className="px-6 py-3">
                          <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{o.channel}</span>
                        </td>
                        <td className="px-6 py-3 text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
                          {o.amount}
                        </td>
                        <td className="px-6 py-3">
                          <span className="flex items-center gap-1.5 text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: o.dot }} />
                            <span style={{ color: o.dot }}>{o.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="px-8 py-20" style={{ background: '#FFFAFA' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-2" style={{ color: '#6D8196' }}>Capabilities</p>
              <h2 className="text-3xl" style={{ color: '#000080', letterSpacing: '-0.01em' }}>Everything in one console</h2>
            </div>
            <Link
              href="/login"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase hover:opacity-70 transition-opacity"
              style={{ color: '#6D8196' }}
            >
              View Dashboard <ArrowRight size={11} />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="bg-white p-6 hover:shadow-sm transition-shadow"
                style={{ border: '1px solid #C8DFF0' }}
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-9 h-9 flex items-center justify-center"
                    style={{ background: i % 2 === 0 ? '#E8F4FF' : '#F0F5FF' }}
                  >
                    <f.icon size={16} style={{ color: '#000080' }} />
                  </div>
                  <span className="text-[9px] tracking-[0.2em]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#ADD8E6' }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="text-sm mb-2" style={{ color: '#000080' }}>{f.title}</h3>
                <p className="text-[11px] leading-relaxed" style={{ color: '#6D8196' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SQL Console demo ── */}
      <section className="px-8 py-20" style={{ background: '#F0F5FF' }}>
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: '#6D8196' }}>Advanced Access</p>
            <h2 className="text-3xl mb-5" style={{ color: '#000080', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              SQL Console
              <br />
              built right in.
            </h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#4A6080' }}>
              Run live queries against your commerce data. Save frequently used queries, view execution
              time, and export results to CSV without leaving the dashboard.
            </p>
            <div className="space-y-2">
              {['Saved query library', 'Real-time execution timer', 'CSV result export', 'Full table access'].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle2 size={12} style={{ color: '#ADD8E6' }} />
                  <span className="text-[12px]" style={{ color: '#000080' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SQL editor mockup */}
          <div style={{ border: '1px solid #1A1A80' }}>
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: '#000030', borderBottom: '1px solid #1A1A60' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#6D8196' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#1A1A80' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#1A1A80' }} />
                <span className="text-[9px] tracking-[0.1em] uppercase ml-2" style={{ color: '#3A5A9A' }}>
                  Query Editor
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1" style={{ background: '#6D8196' }}>
                <Terminal size={9} className="text-white" />
                <span className="text-[9px] text-white tracking-wider">RUN</span>
              </div>
            </div>
            <div className="p-4" style={{ background: '#000028', minHeight: 120 }}>
              <pre className="text-[11px] leading-loose" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                <span style={{ color: '#6D8196' }}>-- Top customers by lifetime value</span>{'\n'}
                <span style={{ color: '#ADD8E6' }}>SELECT</span>
                <span style={{ color: '#FFFFFF' }}> customer_id, name,</span>{'\n'}
                <span style={{ color: '#FFFFFF' }}>       </span>
                <span style={{ color: '#ADD8E6' }}>SUM</span>
                <span style={{ color: '#FFFFFF' }}>(amount) </span>
                <span style={{ color: '#ADD8E6' }}>as</span>
                <span style={{ color: '#FFFFFF' }}> ltv</span>{'\n'}
                <span style={{ color: '#ADD8E6' }}>FROM</span>
                <span style={{ color: '#FFFFFF' }}> orders</span>{'\n'}
                <span style={{ color: '#ADD8E6' }}>GROUP BY</span>
                <span style={{ color: '#FFFFFF' }}> customer_id, name</span>{'\n'}
                <span style={{ color: '#ADD8E6' }}>ORDER BY</span>
                <span style={{ color: '#FFFFFF' }}> ltv </span>
                <span style={{ color: '#ADD8E6' }}>DESC</span>
                <span style={{ color: '#FFFFFF' }}> </span>
                <span style={{ color: '#ADD8E6' }}>LIMIT</span>
                <span style={{ color: '#FFFFFF' }}> 5;</span>
              </pre>
            </div>
            <div style={{ background: '#F0F8FF', borderTop: '1px solid #C8DFF0' }}>
              <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #EEF5FF' }}>
                <span className="text-[9px] uppercase tracking-wider" style={{ color: '#6D8196' }}>Results</span>
                <span className="text-[9px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#ADD8E6' }}>
                  5 rows — 42ms
                </span>
              </div>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                    {['customer', 'ltv'].map((h) => (
                      <th key={h} className="text-left px-4 py-1.5 text-[8px] tracking-widest uppercase font-normal" style={{ color: '#6D8196' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Siti Aminah', 'RM 12,400'],
                    ['Nurul Aisyah', 'RM 9,840'],
                    ['Azman Yusof', 'RM 5,640'],
                    ['Ahmad Rashid', 'RM 4,820'],
                    ['Chen Ming', 'RM 3,280'],
                  ].map(([name, ltv], i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F9FF' }}>
                      <td className="px-4 py-1.5 text-[10px]" style={{ color: '#1A2540' }}>{name}</td>
                      <td className="px-4 py-1.5 text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>{ltv}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why section ── */}
      <section className="px-8 py-20" style={{ background: '#000080' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-1">
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: '#ADD8E6' }}>Why NEXA</p>
              <h2 className="text-3xl mb-4" style={{ color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Built for the<br />Malaysian Market
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#ADD8E6', opacity: 0.7 }}>
                Local currency, local platforms, local seller workflows — everything configured for MY.
              </p>
            </div>
            {[
              { label: 'Order Accuracy', value: '99.2%', desc: 'Across all channels' },
              { label: 'Avg. Sync Time', value: '< 30s', desc: 'Real-time channel sync' },
              { label: 'Channels', value: '5', desc: 'Integrated marketplaces' },
              { label: 'Uptime', value: '99.9%', desc: 'Platform availability' },
            ].map((m) => (
              <div
                key={m.label}
                className="flex flex-col justify-between p-5"
                style={{ background: '#0A0A90', border: '1px solid #1A1AA8' }}
              >
                <p className="text-[9px] tracking-[0.2em] uppercase mb-2" style={{ color: '#ADD8E6' }}>{m.label}</p>
                <div>
                  <p className="text-4xl mb-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#FFFFFF', letterSpacing: '-0.03em' }}>
                    {m.value}
                  </p>
                  <p className="text-[10px]" style={{ color: '#3A5A9A' }}>{m.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              'MYR-native financial reporting',
              'Multi-channel order consolidation',
              'Real-time low-stock alerts',
              'Granular team access controls',
              'Direct SQL data access',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ border: '1px solid #1A1AA8' }}
              >
                <CheckCircle2 size={11} style={{ color: '#ADD8E6', flexShrink: 0 }} />
                <span className="text-[10px] leading-snug" style={{ color: '#7A9DC0' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-8 py-24" style={{ background: '#FFFAFA', borderTop: '1px solid #C8DFF0' }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-8">
            <div>
              <p className="text-[9px] tracking-[0.3em] uppercase mb-3" style={{ color: '#6D8196' }}>Get Started</p>
              <h2 className="text-4xl mb-3" style={{ color: '#000080', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Ready to take
                <br />
                control?
              </h2>
              <p className="text-sm max-w-sm" style={{ color: '#6D8196', lineHeight: '1.7' }}>
                Create your account and start managing all your sales channels from a single
                dashboard — orders, inventory, products, customers, and live channel data.
              </p>
            </div>
            <div className="flex-shrink-0 pt-8">
              <Link
                href="/register"
                className="flex items-center gap-2 text-white text-[11px] tracking-[0.15em] uppercase px-8 py-4 hover:opacity-90 transition-opacity whitespace-nowrap"
                style={{ background: '#000080' }}
              >
                Create Account <ArrowRight size={13} />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase px-8 py-4 mt-3 hover:opacity-90 transition-opacity whitespace-nowrap justify-center"
                style={{ background: '#F0F8FF', border: '1px solid #C8DFF0', color: '#000080' }}
              >
                Sign In <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="px-8 py-5 flex items-center justify-between"
        style={{ background: '#000080', borderTop: '1px solid #1A1AA8' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 flex items-center justify-center text-white"
            style={{ background: '#6D8196', fontSize: 8, letterSpacing: '0.1em' }}
          >
            NX
          </div>
          <span className="text-[11px] tracking-wide" style={{ color: '#ADD8E6' }}>NEXA Commerce ERP</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
          <TrendingUp size={10} style={{ color: '#ADD8E6' }} />
          <span className="text-[9px]" style={{ color: '#3A5A9A' }}>malaysia_erp_prod v2.0.0</span>
        </div>
        <p className="text-[9px] tracking-wide" style={{ color: '#3A5A9A' }}>
          2026 NEXA Commerce. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
