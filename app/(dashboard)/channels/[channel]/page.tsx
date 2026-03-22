"use client";

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Settings, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const channelData: Record<string, {
  name: string;
  status: 'connected' | 'disconnected';
  description: string;
  orders: number;
  revenue: number;
  growth: number;
  products: number;
  accent: string;
  apiVersion: string;
  helpUrl: string;
  trend: Array<{ day: string; orders: number; revenue: number }>;
  recentOrders: Array<{ id: string; customer: string; amount: number; status: string; date: string }>;
}> = {
  shopify: {
    name: 'Shopify',
    status: 'connected',
    description: 'Direct-to-consumer storefront',
    orders: 0,
    revenue: 6000,
    growth: 8.7,
    products: 10,
    accent: '#ADD8E6',
    apiVersion: 'v2024-01',
    helpUrl: 'https://shopify.com',
    trend: [
      { day: 'Mar 15', orders: 0, revenue: 1200 },
      { day: 'Mar 16', orders: 0, revenue: 800 },
      { day: 'Mar 17', orders: 0, revenue: 1500 },
      { day: 'Mar 18', orders: 0, revenue: 900 },
      { day: 'Mar 19', orders: 0, revenue: 600 },
      { day: 'Mar 20', orders: 0, revenue: 1000 },
    ],
    recentOrders: [
      { id: 'SHO-001', customer: 'Siti Aminah', amount: 1200.0, status: 'Shipped', date: '18 Mar 2026' },
      { id: 'SHO-002', customer: 'Mei Lin', amount: 890.0, status: 'Pending', date: '16 Mar 2026' },
    ],
  },
  tiktok: {
    name: 'TikTok Shop',
    status: 'disconnected',
    description: 'Social commerce platform',
    orders: 89,
    revenue: 12440,
    growth: 34.2,
    products: 5,
    accent: '#000080',
    apiVersion: '---',
    helpUrl: 'https://seller-my.tiktok.com',
    trend: [],
    recentOrders: [],
  },
  shopee: {
    name: 'Shopee',
    status: 'disconnected',
    description: 'Southeast Asia marketplace',
    orders: 124,
    revenue: 22380,
    growth: 12.4,
    products: 8,
    accent: '#6D8196',
    apiVersion: '---',
    helpUrl: 'https://shopee.com.my/seller',
    trend: [],
    recentOrders: [],
  },
  lazada: {
    name: 'Lazada',
    status: 'disconnected',
    description: 'SEA e-commerce marketplace',
    orders: 34,
    revenue: 8100,
    growth: -5.1,
    products: 6,
    accent: '#6D8196',
    apiVersion: '---',
    helpUrl: 'https://lazada.com.my/seller',
    trend: [],
    recentOrders: [],
  },
  amazon: {
    name: 'Amazon',
    status: 'disconnected',
    description: 'Global marketplace',
    orders: 0,
    revenue: 0,
    growth: 0,
    products: 0,
    accent: '#ADD8E6',
    apiVersion: '---',
    helpUrl: 'https://sellercentral.amazon.com',
    trend: [],
    recentOrders: [],
  },
};

const statusStyle: Record<string, string> = {
  Shipped: '#4A7B5F',
  Processing: '#6D8196',
  Pending: '#8AAFC8',
  Delivered: '#4A7B5F',
};

export default function ChannelDetail() {
  const params = useParams();
  const channel = params.channel as string;
  const data = channelData[channel || ''] || channelData['shopify'];

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Back + Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/integrations"
            className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-3 transition-colors"
            style={{ color: '#6D8196' }}
          >
            <ArrowLeft size={10} />
            Integrations
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-2 h-8" style={{ background: data.accent }} />
            <div>
              <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Channel</p>
              <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
                {data.name}
              </h1>
            </div>
            <span
              className="text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 self-end mb-0.5"
              style={{
                color: data.status === 'connected' ? '#ADD8E6' : '#6D8196',
                background: data.status === 'connected' ? '#E8F4FF' : '#F0F5FF',
              }}
            >
              {data.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-8">
          {data.status === 'connected' ? (
            <>
              <button className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors" style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}>
                <RefreshCw size={10} />
                Sync Now
              </button>
              <button className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors" style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}>
                <Settings size={10} />
                Settings
              </button>
            </>
          ) : (
            <a
              href={data.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2 hover:opacity-90 transition-opacity"
              style={{ background: '#000080' }}
            >
              <ExternalLink size={10} />
              Connect Channel
            </a>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: data.orders.toString() },
          { label: 'Revenue', value: `RM ${data.revenue.toLocaleString()}` },
          { label: 'Products Listed', value: data.products.toString() },
          { label: 'Growth', value: data.growth !== 0 ? `${data.growth > 0 ? '+' : ''}${data.growth}%` : '---' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{kpi.label}</p>
            <p
              className="text-2xl mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Disconnected notice */}
      {data.status === 'disconnected' && (
        <div
          className="px-5 py-4 mb-6 flex items-start justify-between"
          style={{ background: '#F0F8FF', border: '1px solid #C8DFF0' }}
        >
          <div>
            <p className="text-sm tracking-wide mb-1" style={{ color: '#000080' }}>Channel not connected</p>
            <p className="text-xs" style={{ color: '#6D8196' }}>
              Connect your {data.name} account to sync orders, products, and inventory automatically.
            </p>
          </div>
          <a
            href={data.helpUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase flex-shrink-0 ml-4 hover:opacity-80 transition-opacity"
            style={{ color: '#6D8196' }}
          >
            View Setup Guide
            <ExternalLink size={10} />
          </a>
        </div>
      )}

      {/* Chart + Connection info */}
      <div className="grid grid-cols-3 gap-4">
        {/* Chart */}
        <div className="col-span-2 bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Revenue Trend</p>
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Past 6 Days</p>
          </div>
          {data.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data.trend} margin={{ top: 2, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="chGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={data.accent} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={data.accent} stopOpacity={0} />
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
                  formatter={(v) => [`RM ${Number(v).toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={data.accent}
                  strokeWidth={1.5}
                  fill="url(#chGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-xs tracking-wide" style={{ color: '#ADD8E6' }}>
              No data — connect channel to see trends
            </div>
          )}
        </div>

        {/* Connection info */}
        <div className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: '#6D8196' }}>Connection Info</p>
          <div className="space-y-3">
            {[
              { label: 'Platform', value: data.name },
              { label: 'Status', value: data.status },
              { label: 'API Version', value: data.apiVersion },
              { label: 'Description', value: data.description },
            ].map((item) => (
              <div key={item.label} className="pb-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
                <p className="text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ color: '#6D8196' }}>{item.label}</p>
                <p
                  className="text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {data.recentOrders.length > 0 && (
        <div className="bg-white p-5 mt-4" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Recent Orders</p>
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>{data.name}</p>
            </div>
            <Link
              href="/orders"
              className="text-[10px] tracking-[0.1em] uppercase hover:opacity-80 transition-opacity"
              style={{ color: '#6D8196' }}
            >
              View All
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
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
              {data.recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F5F9FF' }}>
                  <td
                    className="py-3 text-[11px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                  >
                    #{order.id}
                  </td>
                  <td className="py-3 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
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
                  <td
                    className="py-3 text-[10px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                  >
                    {order.date}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
