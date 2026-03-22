"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Settings, ExternalLink, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PLATFORM_INFO: Record<string, { name: string; description: string; accent: string; helpUrl: string }> = {
  shopify: { name: 'Shopify', description: 'Direct-to-consumer storefront', accent: '#ADD8E6', helpUrl: 'https://shopify.com' },
  tiktok: { name: 'TikTok Shop', description: 'Social commerce platform', accent: '#000080', helpUrl: 'https://seller-my.tiktok.com' },
  shopee: { name: 'Shopee', description: 'Southeast Asia marketplace', accent: '#6D8196', helpUrl: 'https://shopee.com.my/seller' },
  lazada: { name: 'Lazada', description: 'SEA e-commerce marketplace', accent: '#6D8196', helpUrl: 'https://lazada.com.my/seller' },
  amazon: { name: 'Amazon', description: 'Global marketplace', accent: '#ADD8E6', helpUrl: 'https://sellercentral.amazon.com' },
};

const statusStyle: Record<string, string> = {
  Shipped: '#4A7B5F',
  SHIPPED: '#4A7B5F',
  Processing: '#6D8196',
  PROCESSING: '#6D8196',
  CONFIRMED: '#6D8196',
  Pending: '#8AAFC8',
  PENDING: '#8AAFC8',
  Delivered: '#4A7B5F',
  DELIVERED: '#4A7B5F',
};

interface ChannelState {
  status: 'connected' | 'disconnected';
  apiVersion: string;
  lastSyncAt: string | null;
  orders: number;
  revenue: number;
  products: number;
  recentOrders: Array<{ id: string; orderNumber: string; customer: string; total: number; status: string; date: string }>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChannelDetail() {
  const params = useParams();
  const channel = (params.channel as string)?.toLowerCase() || '';
  const info = PLATFORM_INFO[channel] || PLATFORM_INFO['shopify'];

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChannelState>({
    status: 'disconnected',
    apiVersion: '---',
    lastSyncAt: null,
    orders: 0,
    revenue: 0,
    products: 0,
    recentOrders: [],
  });

  useEffect(() => {
    async function fetchChannelData() {
      setLoading(true);
      try {
        // Fetch credentials to check connection status
        const credRes = await fetch('/api/integrations/credentials', { credentials: 'include' });
        const credData = await credRes.json();
        const platformKey = channel.toUpperCase();
        const cred = credData.success
          ? credData.data.find((c: { platform: string }) => c.platform === platformKey)
          : null;

        // Fetch orders filtered by platform
        const ordersRes = await fetch(`/api/orders?platform=${platformKey}&limit=5`, { credentials: 'include' });
        const ordersData = await ordersRes.json();

        // Fetch dashboard for platform-level stats
        const dashRes = await fetch('/api/dashboard', { credentials: 'include' });
        const dashData = await dashRes.json();
        const platformStats = dashData.success
          ? dashData.data.platforms?.find((p: { name: string }) => p.name.toLowerCase().replace(' ', '') === channel) || null
          : null;

        // Fetch products count
        const prodRes = await fetch(`/api/products?limit=1`, { credentials: 'include' });
        const prodData = await prodRes.json();

        setData({
          status: cred?.isActive ? 'connected' : 'disconnected',
          apiVersion: cred ? 'Active' : '---',
          lastSyncAt: cred?.lastSyncAt || null,
          orders: platformStats?.orders || (ordersData.success ? ordersData.data.pagination?.total || 0 : 0),
          revenue: platformStats?.revenue || 0,
          products: prodData.success ? prodData.data.pagination?.total || 0 : 0,
          recentOrders: ordersData.success
            ? ordersData.data.orders.map((o: { id: string; orderNumber: string; customer: string; total: number; status: string; date: string }) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                customer: o.customer,
                total: o.total,
                status: o.status,
                date: o.date,
              }))
            : [],
        });
      } catch {
        // Keep defaults
      } finally {
        setLoading(false);
      }
    }
    fetchChannelData();
  }, [channel]);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: '#6D8196' }} />
        <span className="ml-2 text-xs tracking-wide" style={{ color: '#6D8196' }}>Loading channel data...</span>
      </div>
    );
  }

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
            <div className="w-2 h-8" style={{ background: info.accent }} />
            <div>
              <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Channel</p>
              <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
                {info.name}
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
              href={info.helpUrl}
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
          { label: 'Last Sync', value: data.lastSyncAt ? formatDate(data.lastSyncAt) : '---' },
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
              Connect your {info.name} account to sync orders, products, and inventory automatically.
            </p>
          </div>
          <a
            href={info.helpUrl}
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
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Channel Performance</p>
          </div>
          <div className="h-40 flex items-center justify-center text-xs tracking-wide" style={{ color: '#ADD8E6' }}>
            Connect channel and sync to see trends
          </div>
        </div>

        {/* Connection info */}
        <div className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: '#6D8196' }}>Connection Info</p>
          <div className="space-y-3">
            {[
              { label: 'Platform', value: info.name },
              { label: 'Status', value: data.status },
              { label: 'API Status', value: data.apiVersion },
              { label: 'Description', value: info.description },
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
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>{info.name}</p>
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
                    #{order.orderNumber}
                  </td>
                  <td className="py-3 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
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
                  <td
                    className="py-3 text-[10px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                  >
                    {formatDate(order.date)}
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
