"use client";

import { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { ShoppingBag, Box, AlertTriangle, TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockAlerts: number;
  newCustomers: number;
}

interface PlatformData {
  name: string;
  orders: number;
  revenue: number;
  status: 'active' | 'disconnected';
}

interface RecentOrder {
  id: string;
  platform: string;
  customer: string;
  total: number;
  status: string;
  time: string;
}

interface DashboardData {
  summary: DashboardSummary;
  platforms: PlatformData[];
  recentOrders: RecentOrder[];
  lowStockItems: unknown[];
}

const statusStyle: Record<string, string> = {
  Shipped: '#4A7B5F',
  Processing: '#6D8196',
  Pending: '#8AAFC8',
  Delivered: '#4A7B5F',
};

const CHANNEL_ACCENTS: Record<string, string> = {
  Shopee: '#6D8196',
  TikTok: '#000080',
  Lazada: '#ADD8E6',
  Amazon: '#6D8196',
  Shopify: '#ADD8E6',
};

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div className="flex items-end justify-between">
        <div>
          <div className="h-3 w-16 rounded" style={{ background: '#EEF5FF' }} />
          <div className="h-6 w-48 rounded mt-1" style={{ background: '#EEF5FF' }} />
        </div>
        <div className="h-3 w-32 rounded" style={{ background: '#EEF5FF' }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 h-32" style={{ border: '1px solid #C8DFF0' }}>
            <div className="h-3 w-20 rounded mb-3" style={{ background: '#EEF5FF' }} />
            <div className="h-8 w-24 rounded" style={{ background: '#EEF5FF' }} />
            <div className="h-3 w-28 rounded mt-2" style={{ background: '#EEF5FF' }} />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 bg-white p-5 h-64" style={{ border: '1px solid #C8DFF0' }}>
          <div className="h-3 w-24 rounded mb-2" style={{ background: '#EEF5FF' }} />
          <div className="h-4 w-32 rounded" style={{ background: '#EEF5FF' }} />
        </div>
        <div className="bg-white p-5 h-64" style={{ border: '1px solid #C8DFF0' }}>
          <div className="h-3 w-24 rounded mb-2" style={{ background: '#EEF5FF' }} />
          <div className="h-4 w-20 rounded" style={{ background: '#EEF5FF' }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch('/api/dashboard', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const json = await res.json();
        if (!json.success) throw new Error('Dashboard API returned an error');
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: '#6D8196' }}>Failed to load dashboard</p>
          <p className="text-xs mt-1" style={{ color: '#8AAFC8', fontFamily: "'IBM Plex Mono', monospace" }}>{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
            className="mt-4 text-[10px] tracking-[0.15em] uppercase px-4 py-2"
            style={{ color: '#000080', border: '1px solid #C8DFF0' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, platforms, recentOrders } = data;

  const kpis = [
    {
      label: 'Total Orders',
      value: summary.totalOrders.toLocaleString(),
      sub: 'Across all channels',
      icon: ShoppingBag,
    },
    {
      label: 'Active Products',
      value: summary.activeProducts.toLocaleString(),
      sub: `In ${platforms.length} channel${platforms.length !== 1 ? 's' : ''}`,
      icon: Box,
    },
    {
      label: 'Low Stock',
      value: summary.lowStockAlerts.toString(),
      sub: 'Items need reorder',
      icon: AlertTriangle,
    },
    {
      label: 'Total Revenue',
      value: `RM ${summary.totalRevenue.toLocaleString()}`,
      sub: 'All time',
      icon: TrendingUp,
    },
  ];

  const revenueBar = platforms
    .filter((p) => p.revenue > 0)
    .map((p) => ({ name: p.name, revenue: p.revenue }));

  const now = new Date();
  const timestamp = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' \u2014 '
    + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Overview</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Performance Summary
          </h1>
        </div>
        <p className="text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}>
          {timestamp}
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-white p-4"
            style={{ border: '1px solid #C8DFF0' }}
          >
            <div className="flex items-start justify-between mb-3">
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{kpi.label}</p>
              <kpi.icon size={12} className="mt-0.5" style={{ color: '#ADD8E6' }} />
            </div>
            <p
              className="text-2xl"
              style={{ fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '-0.02em', color: '#000080' }}
            >
              {kpi.value}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#6D8196' }}>{kpi.sub}</p>
            <div className="mt-3 h-px" style={{ background: '#EEF5FF' }} />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Order trend chart — no time-series data from API */}
        <div className="lg:col-span-2 bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Order Volume</p>
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Trend</p>
            </div>
          </div>
          <div className="flex items-center justify-center" style={{ height: 180 }}>
            <p className="text-xs text-center" style={{ color: '#8AAFC8' }}>
              Connect channels to see trends
            </p>
          </div>
        </div>

        {/* Revenue by channel */}
        <div className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Revenue Share</p>
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>By Channel</p>
          </div>
          {revenueBar.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={revenueBar}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                barSize={6}
              >
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#6D8196' }}
                  tickLine={false}
                  axisLine={false}
                  width={44}
                />
                <Tooltip
                  contentStyle={{
                    background: '#000080',
                    border: 'none',
                    borderRadius: 0,
                    fontSize: 11,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  labelStyle={{ color: '#ADD8E6' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(v) => [`RM ${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="revenue" radius={0}>
                  {revenueBar.map((entry, i) => (
                    <Cell key={i} fill={i === 0 ? '#000080' : '#ADD8E6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center" style={{ height: 180 }}>
              <p className="text-xs" style={{ color: '#8AAFC8' }}>No data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Channel status + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Channel list */}
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: '#6D8196' }}>Channel Status</p>
          {platforms.length > 0 ? (
            <div className="space-y-2">
              {platforms.map((ch) => {
                const accent = CHANNEL_ACCENTS[ch.name] || '#6D8196';
                const isActive = ch.status === 'active';
                return (
                  <Link
                    key={ch.name}
                    href={`/channels/${ch.name.toLowerCase().replace(' ', '')}`}
                    className="block bg-white p-3.5 transition-colors"
                    style={{ border: '1px solid #C8DFF0' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-1 h-8"
                          style={{ background: isActive ? accent : '#D8EDF8' }}
                        />
                        <div>
                          <p className="text-[11px] tracking-wider uppercase" style={{ color: '#000080' }}>{ch.name}</p>
                          <p
                            className="text-base"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                          >
                            {ch.orders}
                          </p>
                          <p className="text-[9px]" style={{ color: '#6D8196' }}>orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className="text-sm"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                        >
                          RM {ch.revenue.toLocaleString()}
                        </p>
                        <p
                          className="text-[9px] tracking-wider mt-1"
                          style={{ color: isActive ? '#4A7B5F' : '#8AAFC8' }}
                        >
                          {ch.status}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="bg-white p-5 flex items-center justify-center" style={{ border: '1px solid #C8DFF0', minHeight: 120 }}>
              <p className="text-xs" style={{ color: '#8AAFC8' }}>No data yet</p>
            </div>
          )}
        </div>

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Recent Activity</p>
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Latest Orders</p>
            </div>
            <Link
              href="/orders"
              className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
              style={{ color: '#6D8196' }}
            >
              View All <ArrowRight size={10} />
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                  {['Order ID', 'Customer', 'Channel', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase"
                      style={{ color: '#6D8196' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid #F5F9FF' }}
                  >
                    <td
                      className="py-3 text-[11px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                    >
                      #{order.id}
                    </td>
                    <td className="py-3 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
                    <td className="py-3">
                      <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{order.platform}</span>
                    </td>
                    <td
                      className="py-3 text-[11px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                    >
                      RM {order.total.toFixed(2)}
                    </td>
                    <td className="py-3">
                      <span
                        className="text-[10px] tracking-wide"
                        style={{ color: statusStyle[order.status] || '#6D8196' }}
                      >
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: 120 }}>
              <p className="text-xs" style={{ color: '#8AAFC8' }}>No data yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
