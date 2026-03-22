"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import { ShoppingBag, Box, AlertTriangle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const orderTrend = [
  { day: 'Mar 1', orders: 8, revenue: 1240 },
  { day: 'Mar 3', orders: 14, revenue: 2180 },
  { day: 'Mar 5', orders: 11, revenue: 1690 },
  { day: 'Mar 7', orders: 19, revenue: 2940 },
  { day: 'Mar 9', orders: 7, revenue: 1080 },
  { day: 'Mar 11', orders: 22, revenue: 3410 },
  { day: 'Mar 13', orders: 16, revenue: 2480 },
  { day: 'Mar 15', orders: 28, revenue: 4320 },
  { day: 'Mar 17', orders: 12, revenue: 1860 },
  { day: 'Mar 19', orders: 31, revenue: 4780 },
  { day: 'Mar 20', orders: 25, revenue: 3860 },
];

const channelData = [
  { name: 'Shopee', orders: 124, revenue: 22380, growth: 12.4, status: 'connected', accent: '#6D8196' },
  { name: 'TikTok', orders: 89, revenue: 12440, growth: 34.2, status: 'disconnected', accent: '#000080' },
  { name: 'Lazada', orders: 34, revenue: 8100, growth: -5.1, status: 'disconnected', accent: '#ADD8E6' },
  { name: 'Amazon', orders: 0, revenue: 0, growth: 0, status: 'disconnected', accent: '#6D8196' },
  { name: 'Shopify', orders: 0, revenue: 6000, growth: 8.7, status: 'connected', accent: '#ADD8E6' },
];

const revenueBar = channelData.filter((c) => c.revenue > 0).map((c) => ({
  name: c.name,
  revenue: c.revenue,
}));

const recentOrders = [
  { id: 'ORD-2847', customer: 'Ahmad bin Rashid', channel: 'Shopee', amount: 284.0, status: 'Shipped' },
  { id: 'ORD-2846', customer: 'Lim Wei Xin', channel: 'TikTok', amount: 156.5, status: 'Processing' },
  { id: 'ORD-2845', customer: 'Nurul Aisyah', channel: 'Shopee', amount: 892.0, status: 'Pending' },
  { id: 'ORD-2844', customer: 'Raj Kumar', channel: 'Lazada', amount: 445.0, status: 'Delivered' },
  { id: 'ORD-2843', customer: 'Siti Aminah', channel: 'Shopify', amount: 1200.0, status: 'Shipped' },
];

const statusStyle: Record<string, string> = {
  Shipped: '#4A7B5F',
  Processing: '#6D8196',
  Pending: '#8AAFC8',
  Delivered: '#4A7B5F',
};

const kpis = [
  {
    label: 'Total Orders',
    value: '247',
    sub: 'Across all channels',
    icon: ShoppingBag,
    trend: '+12.4%',
    up: true,
  },
  {
    label: 'Active Products',
    value: '1,842',
    sub: 'In 5 channels',
    icon: Box,
    trend: '+3.1%',
    up: true,
  },
  {
    label: 'Low Stock',
    value: '18',
    sub: 'Items need reorder',
    icon: AlertTriangle,
    trend: '+5 new',
    up: false,
  },
  {
    label: 'Total Revenue',
    value: 'RM 48,920',
    sub: 'Last 7 days',
    icon: TrendingUp,
    trend: '+8.7%',
    up: true,
  },
];

export default function Dashboard() {
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
          20 Mar 2026 — 09:41
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
            <div className="mt-3 flex items-center gap-1.5">
              {kpi.up ? (
                <TrendingUp size={10} style={{ color: '#4A7B5F' }} />
              ) : (
                <TrendingDown size={10} style={{ color: '#6D8196' }} />
              )}
              <span
                className="text-[10px]"
                style={{ color: kpi.up ? '#4A7B5F' : '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {kpi.trend}
              </span>
            </div>
            <div className="mt-3 h-px" style={{ background: '#EEF5FF' }}>
              <div
                className="h-full"
                style={{
                  width: kpi.up ? '70%' : '30%',
                  background: kpi.up ? '#6D8196' : '#ADD8E6',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Order trend chart */}
        <div className="lg:col-span-2 bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Order Volume</p>
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Past 20 Days</p>
            </div>
            <div className="flex items-center gap-1 text-[10px]" style={{ color: '#4A7B5F', fontFamily: "'IBM Plex Mono', monospace" }}>
              <TrendingUp size={11} />
              +12.4%
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={orderTrend} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6D8196" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#6D8196" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="#EEF5FF" />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 9, fill: '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}
                tickLine={false}
                axisLine={false}
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
              />
              <Area
                type="monotone"
                dataKey="orders"
                stroke="#6D8196"
                strokeWidth={1.5}
                fill="url(#ordGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#6D8196', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by channel */}
        <div className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Revenue Share</p>
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>By Channel</p>
          </div>
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
                {revenueBar.map((_, i) => (
                  <Cell key={i} fill={i === 0 ? '#000080' : '#ADD8E6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channel status + Recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Channel list */}
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: '#6D8196' }}>Channel Status</p>
          <div className="space-y-2">
            {channelData.map((ch) => (
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
                      style={{ background: ch.status === 'connected' ? ch.accent : '#D8EDF8' }}
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
                    {ch.growth !== 0 && (
                      <p
                        className="text-[10px]"
                        style={{
                          color: ch.growth > 0 ? '#4A7B5F' : '#6D8196',
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        {ch.growth > 0 ? '+' : ''}{ch.growth}%
                      </p>
                    )}
                    <p
                      className="text-[9px] tracking-wider mt-1"
                      style={{ color: ch.status === 'connected' ? '#4A7B5F' : '#8AAFC8' }}
                    >
                      {ch.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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
                    <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{order.channel}</span>
                  </td>
                  <td
                    className="py-3 text-[11px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                  >
                    RM {order.amount.toFixed(2)}
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
        </div>
      </div>
    </div>
  );
}
