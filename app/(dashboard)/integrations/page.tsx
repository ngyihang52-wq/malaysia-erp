"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Settings } from 'lucide-react';

const channels = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Direct-to-consumer storefront',
    status: 'connected',
    lastSync: '20 Mar 2026, 09:38',
    orders: 0,
    revenue: 6000,
    apiVersion: 'v2024-01',
    store: 'malaysia-erp.myshopify.com',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Southeast Asia marketplace',
    status: 'disconnected',
    lastSync: 'Never',
    orders: 124,
    revenue: 22380,
    apiVersion: '---',
    store: '---',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    description: 'Social commerce platform',
    status: 'disconnected',
    lastSync: 'Never',
    orders: 89,
    revenue: 12440,
    apiVersion: '---',
    store: '---',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    description: 'SEA e-commerce marketplace',
    status: 'disconnected',
    lastSync: 'Never',
    orders: 34,
    revenue: 8100,
    apiVersion: '---',
    store: '---',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Global marketplace',
    status: 'disconnected',
    lastSync: 'Never',
    orders: 0,
    revenue: 0,
    apiVersion: '---',
    store: '---',
  },
];

const channelAccent: Record<string, string> = {
  shopify: '#ADD8E6',
  shopee: '#6D8196',
  tiktok: '#000080',
  lazada: '#6D8196',
  amazon: '#ADD8E6',
};

export default function Integrations() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 1500);
  };

  const connected = channels.filter((c) => c.status === 'connected').length;

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Channels</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Integrations
          </h1>
        </div>
        <p className="text-xs" style={{ color: '#6D8196' }}>
          <span style={{ color: '#ADD8E6', fontFamily: "'IBM Plex Mono', monospace" }}>
            {connected}
          </span>
          /{channels.length} channels connected
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Connected', value: connected.toString(), color: '#ADD8E6' },
          { label: 'Disconnected', value: (channels.length - connected).toString(), color: '#6D8196' },
          { label: 'Total Channels', value: channels.length.toString(), color: '#000080' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{s.label}</p>
            <p
              className="text-2xl mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: s.color }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Channel cards */}
      <div className="grid grid-cols-1 gap-3">
        {channels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white p-5 flex items-center justify-between"
            style={{ border: '1px solid #C8DFF0' }}
          >
            {/* Left */}
            <div className="flex items-center gap-4">
              <div
                className="w-1 h-12 flex-shrink-0"
                style={{ background: channelAccent[ch.id] }}
              />
              <div>
                <div className="flex items-center gap-2.5 mb-0.5">
                  <h3 className="text-sm tracking-wide" style={{ color: '#000080' }}>{ch.name}</h3>
                  {ch.status === 'connected' ? (
                    <CheckCircle2 size={12} style={{ color: '#ADD8E6' }} />
                  ) : (
                    <XCircle size={12} style={{ color: '#C8DFF0' }} />
                  )}
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase px-2 py-0.5"
                    style={{
                      color: ch.status === 'connected' ? '#ADD8E6' : '#6D8196',
                      background: ch.status === 'connected' ? '#E8F4FF' : '#F0F5FF',
                    }}
                  >
                    {ch.status}
                  </span>
                </div>
                <p className="text-[10px]" style={{ color: '#6D8196' }}>{ch.description}</p>
                {ch.store !== '---' && (
                  <p className="text-[10px] mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#ADD8E6' }}>
                    {ch.store}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: '#6D8196' }}>Orders</p>
                <p
                  className="text-lg"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  {ch.orders}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: '#6D8196' }}>Revenue</p>
                <p
                  className="text-lg"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  RM {ch.revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[9px] tracking-[0.1em] uppercase" style={{ color: '#6D8196' }}>Last Sync</p>
                <p
                  className="text-[10px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4A6080' }}
                >
                  {ch.lastSync}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {ch.status === 'connected' ? (
                <>
                  <button
                    onClick={() => handleSync(ch.id)}
                    className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors"
                    style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
                  >
                    <RefreshCw size={10} className={syncing === ch.id ? 'animate-spin' : ''} />
                    Sync
                  </button>
                  <Link
                    href={`/channels/${ch.id}`}
                    className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors"
                    style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
                  >
                    <Settings size={10} />
                    Manage
                  </Link>
                </>
              ) : (
                <Link
                  href={`/channels/${ch.id}`}
                  className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2 hover:opacity-90 transition-opacity"
                  style={{ background: '#000080' }}
                >
                  <ExternalLink size={10} />
                  Connect
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
