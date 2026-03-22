"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Settings, ExternalLink, Loader2, Check, AlertCircle, Trash2 } from 'lucide-react';

/* ── Platform metadata ── */
const PLATFORM_INFO: Record<string, {
  name: string;
  description: string;
  accent: string;
  helpUrl: string;
  apiKey: string;
  fields: Array<{ key: string; label: string; placeholder: string; type?: string }>;
}> = {
  shopify: {
    name: 'Shopify',
    description: 'Direct-to-consumer storefront',
    accent: '#ADD8E6',
    helpUrl: 'https://shopify.dev/docs/apps/auth/admin-app-access-tokens',
    apiKey: 'SHOPIFY',
    fields: [
      { key: 'shopDomain', label: 'Shop Domain', placeholder: 'your-store.myshopify.com' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'shpat_xxxxxxxxxxxxx', type: 'password' },
    ],
  },
  tiktok: {
    name: 'TikTok Shop',
    description: 'Social commerce platform',
    accent: '#000080',
    helpUrl: 'https://partner.tiktokshop.com',
    apiKey: 'TIKTOK',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'Your TikTok app key' },
      { key: 'appSecret', label: 'App Secret', placeholder: 'Your TikTok app secret', type: 'password' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Your access token', type: 'password' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'Your TikTok Shop ID' },
    ],
  },
  shopee: {
    name: 'Shopee',
    description: 'Southeast Asia marketplace',
    accent: '#6D8196',
    helpUrl: 'https://open.shopee.com',
    apiKey: 'SHOPEE',
    fields: [
      { key: 'partnerId', label: 'Partner ID', placeholder: 'Your Shopee partner ID' },
      { key: 'partnerKey', label: 'Partner Key', placeholder: 'Your partner key', type: 'password' },
      { key: 'shopId', label: 'Shop ID', placeholder: 'Your Shopee shop ID' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Your access token', type: 'password' },
    ],
  },
  lazada: {
    name: 'Lazada',
    description: 'SEA e-commerce marketplace',
    accent: '#6D8196',
    helpUrl: 'https://open.lazada.com',
    apiKey: 'LAZADA',
    fields: [
      { key: 'appKey', label: 'App Key', placeholder: 'Your Lazada app key' },
      { key: 'appSecret', label: 'App Secret', placeholder: 'Your app secret', type: 'password' },
      { key: 'accessToken', label: 'Access Token', placeholder: 'Your access token', type: 'password' },
    ],
  },
  amazon: {
    name: 'Amazon',
    description: 'Global marketplace',
    accent: '#ADD8E6',
    helpUrl: 'https://developer-docs.amazon.com/sp-api',
    apiKey: 'AMAZON',
    fields: [
      { key: 'sellerId', label: 'Seller ID', placeholder: 'Your Amazon seller ID' },
      { key: 'accessKeyId', label: 'AWS Access Key ID', placeholder: 'AKIA...', type: 'password' },
      { key: 'secretAccessKey', label: 'AWS Secret Access Key', placeholder: 'Your secret key', type: 'password' },
      { key: 'refreshToken', label: 'LWA Refresh Token', placeholder: 'Atzr|...', type: 'password' },
      { key: 'clientId', label: 'LWA Client ID', placeholder: 'amzn1.application-oa2-client...' },
      { key: 'clientSecret', label: 'LWA Client Secret', placeholder: 'Your client secret', type: 'password' },
    ],
  },
};

const statusStyle: Record<string, string> = {
  Shipped: '#4A7B5F', SHIPPED: '#4A7B5F',
  Processing: '#6D8196', PROCESSING: '#6D8196', CONFIRMED: '#6D8196',
  Pending: '#8AAFC8', PENDING: '#8AAFC8',
  Delivered: '#4A7B5F', DELIVERED: '#4A7B5F',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ChannelDetail() {
  const params = useParams();
  const channel = (params.channel as string)?.toLowerCase() || '';
  const info = PLATFORM_INFO[channel];

  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [orders, setOrders] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [products, setProducts] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; orderNumber: string; customer: string; total: number; status: string; date: string }>>([]);

  // Form state
  const [creds, setCreds] = useState<Record<string, string>>({});
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    if (!info) return;
    fetchChannelData();
  }, [channel]);

  async function fetchChannelData() {
    setLoading(true);
    try {
      const credRes = await fetch('/api/integrations/credentials', { credentials: 'include' });
      const credData = await credRes.json();
      const cred = credData.success
        ? credData.data.find((c: { platform: string }) => c.platform === info.apiKey)
        : null;

      setIsConnected(!!cred?.isActive);
      setLastSyncAt(cred?.lastSyncAt || null);

      // Fetch platform orders
      const ordersRes = await fetch(`/api/orders?platform=${info.apiKey}&limit=5`, { credentials: 'include' });
      const ordersData = await ordersRes.json();

      // Fetch dashboard for platform stats
      const dashRes = await fetch('/api/dashboard', { credentials: 'include' });
      const dashData = await dashRes.json();
      const ps = dashData.success
        ? dashData.data.platforms?.find((p: { name: string }) => p.name.toLowerCase().replace(' ', '') === channel)
        : null;

      setOrders(ps?.orders || (ordersData.success ? ordersData.data.pagination?.total || 0 : 0));
      setRevenue(ps?.revenue || 0);
      setProducts(0); // Will be populated once synced

      if (ordersData.success && ordersData.data.orders) {
        setRecentOrders(ordersData.data.orders.map((o: { id: string; orderNumber: string; customer: string; total: number; status: string; date: string }) => ({
          id: o.id, orderNumber: o.orderNumber, customer: o.customer, total: o.total, status: o.status, date: o.date,
        })));
      }
    } catch {
      // Keep defaults
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/integrations/credentials/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform: info.apiKey, credentials: creds }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: `Connected successfully${data.data?.shopName ? ` — ${data.data.shopName}` : ''}` });
      } else {
        setTestResult({ success: false, message: data.error || 'Connection test failed' });
      }
    } catch {
      setTestResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveResult(null);
    try {
      const res = await fetch('/api/integrations/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platform: info.apiKey, name: info.name, credentials: creds }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveResult({ success: true, message: 'Credentials saved successfully!' });
        setIsConnected(true);
        setCreds({});
        setTestResult(null);
        fetchChannelData();
      } else {
        setSaveResult({ success: false, message: data.error || 'Failed to save credentials' });
      }
    } catch {
      setSaveResult({ success: false, message: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch(`/api/sync?platform=${info.apiKey}&type=PRODUCTS`, { method: 'POST', credentials: 'include' });
      await fetch(`/api/sync?platform=${info.apiKey}&type=ORDERS`, { method: 'POST', credentials: 'include' });
      fetchChannelData();
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${info.name}? You can reconnect later.`)) return;
    setDisconnecting(true);
    try {
      await fetch(`/api/integrations/credentials?platform=${info.apiKey}`, { method: 'DELETE', credentials: 'include' });
      setIsConnected(false);
      setLastSyncAt(null);
      setOrders(0);
      setRevenue(0);
      setRecentOrders([]);
    } catch {
      // silent
    } finally {
      setDisconnecting(false);
    }
  }

  if (!info) {
    return (
      <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Link href="/integrations" className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase mb-3" style={{ color: '#6D8196' }}>
          <ArrowLeft size={10} /> Integrations
        </Link>
        <p className="text-sm" style={{ color: '#6D8196' }}>Channel not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Loader2 size={20} className="animate-spin" style={{ color: '#6D8196' }} />
        <span className="ml-2 text-xs tracking-wide" style={{ color: '#6D8196' }}>Loading channel data...</span>
      </div>
    );
  }

  const allFieldsFilled = info.fields.every((f) => creds[f.key]?.trim());

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
                color: isConnected ? '#4A7B5F' : '#6D8196',
                background: isConnected ? '#F0FDF4' : '#F0F5FF',
              }}
            >
              {isConnected ? 'connected' : 'disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-8">
          {isConnected ? (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors disabled:opacity-50"
                style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
              >
                <RefreshCw size={10} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors disabled:opacity-50"
                style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
              >
                <Trash2 size={10} />
                Disconnect
              </button>
            </>
          ) : (
            <a
              href={info.helpUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors"
              style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
            >
              <ExternalLink size={10} />
              API Docs
            </a>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Orders', value: orders.toString() },
          { label: 'Revenue', value: `RM ${revenue.toLocaleString()}` },
          { label: 'Products Listed', value: products.toString() },
          { label: 'Last Sync', value: lastSyncAt ? formatDate(lastSyncAt) : '---' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{kpi.label}</p>
            <p className="text-2xl mt-1" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {/* Connect form (when disconnected) */}
      {!isConnected && (
        <div className="bg-white p-5 mb-6" style={{ border: '1px solid #C8DFF0' }}>
          <div className="mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Setup</p>
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>Connect {info.name}</p>
          </div>

          <p className="text-xs mb-4" style={{ color: '#6D8196' }}>
            Enter your {info.name} API credentials below. You can find these in your{' '}
            <a href={info.helpUrl} target="_blank" rel="noreferrer" className="underline" style={{ color: '#000080' }}>
              {info.name} developer portal
            </a>.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {info.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-[9px] tracking-[0.15em] uppercase mb-1" style={{ color: '#6D8196' }}>
                  {field.label}
                </label>
                <input
                  type={field.type || 'text'}
                  value={creds[field.key] || ''}
                  onChange={(e) => setCreds({ ...creds, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 text-[11px] outline-none"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    background: '#F0F8FF',
                    border: '1px solid #C8DFF0',
                    color: '#000080',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-3"
              style={{
                background: testResult.success ? '#F0FDF4' : '#FFF5F5',
                border: `1px solid ${testResult.success ? '#BBF7D0' : '#FED7D7'}`,
              }}
            >
              {testResult.success ? (
                <Check size={12} style={{ color: '#4A7B5F' }} />
              ) : (
                <AlertCircle size={12} style={{ color: '#DC2626' }} />
              )}
              <p className="text-[11px]" style={{ color: testResult.success ? '#4A7B5F' : '#DC2626' }}>
                {testResult.message}
              </p>
            </div>
          )}

          {/* Save result */}
          {saveResult && (
            <div
              className="flex items-center gap-2 px-3 py-2 mb-3"
              style={{
                background: saveResult.success ? '#F0FDF4' : '#FFF5F5',
                border: `1px solid ${saveResult.success ? '#BBF7D0' : '#FED7D7'}`,
              }}
            >
              {saveResult.success ? (
                <Check size={12} style={{ color: '#4A7B5F' }} />
              ) : (
                <AlertCircle size={12} style={{ color: '#DC2626' }} />
              )}
              <p className="text-[11px]" style={{ color: saveResult.success ? '#4A7B5F' : '#DC2626' }}>
                {saveResult.message}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={!allFieldsFilled || testing}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.1em] uppercase px-4 py-2 transition-colors disabled:opacity-40"
              style={{ background: 'white', border: '1px solid #C8DFF0', color: '#6D8196' }}
            >
              {testing ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              disabled={!allFieldsFilled || saving}
              className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-40"
              style={{ background: '#000080' }}
            >
              {saving ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              {saving ? 'Saving...' : 'Save & Connect'}
            </button>
          </div>
        </div>
      )}

      {/* Connection info + Status */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <div className="mb-4">
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Channel Status</p>
            <p className="text-sm mt-0.5" style={{ color: '#000080' }}>{info.name} Overview</p>
          </div>
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-3 py-2.5" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <Check size={12} style={{ color: '#4A7B5F' }} />
                <p className="text-[11px]" style={{ color: '#4A7B5F' }}>
                  {info.name} is connected and syncing. Use "Sync Now" to pull latest data.
                </p>
              </div>
              <p className="text-xs" style={{ color: '#6D8196' }}>
                Orders, products, and inventory will be synced from your {info.name} store. Data appears in the Dashboard, Orders, and Products pages.
              </p>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs tracking-wide" style={{ color: '#ADD8E6' }}>
              Fill in credentials above to connect {info.name}
            </div>
          )}
        </div>

        {/* Connection info */}
        <div className="bg-white p-5" style={{ border: '1px solid #C8DFF0' }}>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-4" style={{ color: '#6D8196' }}>Connection Info</p>
          <div className="space-y-3">
            {[
              { label: 'Platform', value: info.name },
              { label: 'Status', value: isConnected ? 'Connected' : 'Disconnected' },
              { label: 'Last Sync', value: lastSyncAt ? formatDate(lastSyncAt) : 'Never' },
              { label: 'Description', value: info.description },
            ].map((item) => (
              <div key={item.label} className="pb-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
                <p className="text-[9px] tracking-[0.1em] uppercase mb-0.5" style={{ color: '#6D8196' }}>{item.label}</p>
                <p className="text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="bg-white p-5 mt-4" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>Recent Orders</p>
              <p className="text-sm mt-0.5" style={{ color: '#000080' }}>{info.name}</p>
            </div>
            <Link href="/orders" className="text-[10px] tracking-[0.1em] uppercase hover:opacity-80 transition-opacity" style={{ color: '#6D8196' }}>
              View All
            </Link>
          </div>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                {['Order', 'Customer', 'Amount', 'Status', 'Date'].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid #F5F9FF' }}>
                  <td className="py-3 text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}>
                    #{order.orderNumber}
                  </td>
                  <td className="py-3 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
                  <td className="py-3 text-[11px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}>
                    RM {order.total.toFixed(2)}
                  </td>
                  <td className="py-3">
                    <span className="text-[10px] tracking-wide" style={{ color: statusStyle[order.status] || '#6D8196' }}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 text-[10px]" style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}>
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
