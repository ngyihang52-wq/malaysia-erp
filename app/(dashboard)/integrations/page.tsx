"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ExternalLink, RefreshCw, Settings, Loader2 } from 'lucide-react';

/* ── Static platform definitions (styling / copy only) ── */
const PLATFORMS = [
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Direct-to-consumer storefront',
    helpUrl: 'https://help.shopify.com/en/manual',
    apiVersion: 'v2024-01',
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    description: 'Social commerce platform',
    helpUrl: 'https://seller.tiktokglobalshop.com',
    apiVersion: 'v202309',
  },
  {
    id: 'shopee',
    name: 'Shopee',
    description: 'Southeast Asia marketplace',
    helpUrl: 'https://seller.shopee.com.my',
    apiVersion: 'v2',
  },
  {
    id: 'lazada',
    name: 'Lazada',
    description: 'SEA e-commerce marketplace',
    helpUrl: 'https://sellercenter.lazada.com.my',
    apiVersion: 'v2',
  },
  {
    id: 'amazon',
    name: 'Amazon',
    description: 'Global marketplace',
    helpUrl: 'https://sellercentral.amazon.com',
    apiVersion: 'SP-API 2023',
  },
];

const channelAccent: Record<string, string> = {
  shopify: '#ADD8E6',
  shopee: '#6D8196',
  tiktok: '#000080',
  lazada: '#6D8196',
  amazon: '#ADD8E6',
};

/* ── Types ── */
interface Credential {
  id: string;
  platform: string;
  name: string;
  isActive: boolean;
  lastSyncAt: string | null;
  createdAt: string;
  lastSync: object | null;
}

interface MergedChannel {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected';
  lastSync: string;
  orders: number;
  revenue: number;
  apiVersion: string;
  store: string;
}

/* ── Helpers ── */
function formatSyncDate(iso: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Never';
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }) + ', ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function mergeChannels(credentials: Credential[]): MergedChannel[] {
  const credByPlatform = new Map<string, Credential>();
  for (const c of credentials) {
    if (c.isActive) credByPlatform.set(c.platform.toLowerCase(), c);
  }

  return PLATFORMS.map((p) => {
    const cred = credByPlatform.get(p.id);
    if (cred) {
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: 'connected' as const,
        lastSync: formatSyncDate(cred.lastSyncAt),
        orders: 0,
        revenue: 0,
        apiVersion: p.apiVersion,
        store: cred.name,
      };
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      status: 'disconnected' as const,
      lastSync: 'Never',
      orders: 0,
      revenue: 0,
      apiVersion: '---',
      store: '---',
    };
  });
}

/* ── Component ── */
export default function Integrations() {
  const [syncing, setSyncing] = useState<string | null>(null);
  const [channels, setChannels] = useState<MergedChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchCredentials() {
      try {
        const res = await fetch('/api/integrations/credentials', { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to fetch integrations (${res.status})`);
        const json = await res.json();
        if (!json.success) throw new Error('API returned unsuccessful response');
        if (!cancelled) {
          setChannels(mergeChannels(json.data ?? []));
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load integrations');
          // Fall back to all-disconnected so the page is still usable
          setChannels(mergeChannels([]));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchCredentials();
    return () => { cancelled = true; };
  }, []);

  const handleSync = async (id: string) => {
    setSyncing(id);
    const platform = id.toUpperCase();
    try {
      await fetch(`/api/sync?platform=${platform}&type=PRODUCTS`, { method: 'POST', credentials: 'include' });
      await fetch(`/api/sync?platform=${platform}&type=ORDERS`, { method: 'POST', credentials: 'include' });
    } catch {
      // silent
    } finally {
      setSyncing(null);
    }
  };

  const connected = channels.filter((c) => c.status === 'connected').length;

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: '#ADD8E6' }} />
          <p className="text-xs tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>
            Loading integrations...
          </p>
        </div>
      </div>
    );
  }

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

      {/* Error banner */}
      {error && (
        <div
          className="mb-4 px-4 py-3 text-xs"
          style={{ background: '#FFF5F5', border: '1px solid #FED7D7', color: '#9B2C2C' }}
        >
          {error}
        </div>
      )}

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
            className="bg-white px-5 py-4 flex items-center gap-4"
            style={{ border: '1px solid #C8DFF0' }}
          >
            {/* Accent bar */}
            <div className="w-1 h-10 flex-shrink-0" style={{ background: channelAccent[ch.id] }} />

            {/* Name + status — fixed width */}
            <div style={{ width: '180px', flexShrink: 0 }}>
              <div className="flex items-center gap-1.5 mb-1" style={{ flexWrap: 'nowrap' }}>
                <h3 className="text-sm tracking-wide truncate" style={{ color: '#000080' }}>{ch.name}</h3>
                {ch.status === 'connected'
                  ? <CheckCircle2 size={11} className="flex-shrink-0" style={{ color: '#ADD8E6' }} />
                  : <XCircle size={11} className="flex-shrink-0" style={{ color: '#C8DFF0' }} />}
              </div>
              <span
                className="inline-block text-[8px] tracking-[0.12em] uppercase px-1.5 py-0.5"
                style={{
                  color: ch.status === 'connected' ? '#ADD8E6' : '#6D8196',
                  background: ch.status === 'connected' ? '#E8F4FF' : '#F0F5FF',
                }}
              >
                {ch.status === 'connected' ? ch.store : ch.description}
              </span>
            </div>

            {/* Stats — flex-1 space, equal-width columns */}
            <div className="flex-1 grid gap-2" style={{ gridTemplateColumns: '120px 140px 1fr' }}>
              <div className="text-center items-center">
                <p className="text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ color: '#6D8196' }}>Orders</p>
                <p className="text-base" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
                  {ch.orders}
                </p>
              </div>
              <div className="text-center items-center">
                <p className="text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ color: '#6D8196' }}>Revenue</p>
                <p className="text-base" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
                  RM {ch.revenue.toLocaleString()}
                </p>
              </div>
              <div className="text-center items-center">
                <p className="text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ color: '#6D8196', whiteSpace: 'nowrap' }}>Last Sync</p>
                <p className="text-sm" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4A6080' }}>
                  {ch.lastSync}
                </p>
              </div>
            </div>

            {/* Actions — fixed, flush right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {ch.status === 'connected' ? (
                <>
                  <button
                    onClick={() => handleSync(ch.id)}
                    className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2"
                    style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
                  >
                    <RefreshCw size={10} className={syncing === ch.id ? 'animate-spin' : ''} />
                    Sync
                  </button>
                  <Link
                    href={`/channels/${ch.id}`}
                    className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2"
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
