"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";

const PLATFORMS = [
  {
    key: "SHOPIFY",
    name: "Shopify",
    description: "Connect your Shopify store to sync products, orders, and inventory",
    icon: "🟢",
    color: "#96BF48",
    connected: true,
    shopName: "my-jewelry-store.myshopify.com",
    lastSync: "2026-03-11 10:30",
    ordersToday: 12,
    status: "active",
    features: ["Products", "Orders", "Inventory", "Webhooks"],
    apiDocs: "https://shopify.dev/docs/api",
    authType: "OAuth + Access Token",
    fields: [
      { key: "shopDomain", label: "Shop Domain", placeholder: "mystore.myshopify.com", type: "text" },
      { key: "accessToken", label: "Access Token", placeholder: "shpat_...", type: "password" },
    ],
  },
  {
    key: "TIKTOK",
    name: "TikTok Shop",
    description: "Sync your TikTok Shop products and orders for Malaysia market",
    icon: "⚫",
    color: "#010101",
    connected: true,
    shopName: "My Jewelry MY",
    lastSync: "2026-03-11 10:15",
    ordersToday: 8,
    status: "active",
    features: ["Products", "Orders", "Inventory", "Fulfillment"],
    apiDocs: "https://partner.tiktokshop.com/docv2",
    authType: "App Key + OAuth",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "App Key from TikTok Partner Center", type: "text" },
      { key: "appSecret", label: "App Secret", placeholder: "App Secret", type: "password" },
      { key: "accessToken", label: "Access Token", placeholder: "Access Token", type: "password" },
      { key: "shopId", label: "Shop ID", placeholder: "Your Shop ID", type: "text" },
    ],
  },
  {
    key: "SHOPEE",
    name: "Shopee Malaysia",
    description: "Connect to Shopee Malaysia marketplace via Open Platform API",
    icon: "🟠",
    color: "#EE4D2D",
    connected: true,
    shopName: "Jewelry Collection MY",
    lastSync: "2026-03-11 10:00",
    ordersToday: 18,
    status: "active",
    features: ["Products", "Orders", "Inventory", "Logistics", "Vouchers"],
    apiDocs: "https://open.shopee.com/documents",
    authType: "Partner ID + Key + OAuth",
    fields: [
      { key: "partnerId", label: "Partner ID", placeholder: "Your Partner ID", type: "text" },
      { key: "partnerKey", label: "Partner Key", placeholder: "Partner Key", type: "password" },
      { key: "shopId", label: "Shop ID", placeholder: "Your Shop ID", type: "text" },
      { key: "accessToken", label: "Access Token", placeholder: "Access Token", type: "password" },
    ],
  },
  {
    key: "LAZADA",
    name: "Lazada Malaysia",
    description: "Integrate with Lazada Open Platform for Malaysia (LazMall & Marketplace)",
    icon: "🔵",
    color: "#0F146D",
    connected: true,
    shopName: "LuxeJewel Official Store",
    lastSync: "2026-03-11 09:45",
    ordersToday: 6,
    status: "active",
    features: ["Products", "Orders", "Inventory", "Price Management"],
    apiDocs: "https://open.lazada.com/apps/doc/api",
    authType: "App Key + Secret + OAuth",
    fields: [
      { key: "appKey", label: "App Key", placeholder: "App Key from Lazada Open Platform", type: "text" },
      { key: "appSecret", label: "App Secret", placeholder: "App Secret", type: "password" },
      { key: "accessToken", label: "Access Token", placeholder: "Access Token", type: "password" },
    ],
  },
  {
    key: "AMAZON",
    name: "Amazon Malaysia",
    description: "Connect to Amazon.com.my via Selling Partner API (SP-API)",
    icon: "🟡",
    color: "#FF9900",
    connected: false,
    shopName: null,
    lastSync: null,
    ordersToday: 0,
    status: "disconnected",
    features: ["Listings", "Orders", "FBA Inventory", "Reports", "Catalog"],
    apiDocs: "https://developer-docs.amazon.com/sp-api",
    authType: "AWS IAM + LWA OAuth",
    fields: [
      { key: "sellerId", label: "Seller ID", placeholder: "Your Amazon Seller ID", type: "text" },
      { key: "clientId", label: "LWA Client ID", placeholder: "amzn1.application-oa2-client...", type: "text" },
      { key: "clientSecret", label: "LWA Client Secret", placeholder: "Client Secret", type: "password" },
      { key: "refreshToken", label: "Refresh Token", placeholder: "Atzr|...", type: "password" },
      { key: "accessKeyId", label: "AWS Access Key ID", placeholder: "AKIA...", type: "text" },
      { key: "secretAccessKey", label: "AWS Secret Access Key", placeholder: "Secret Access Key", type: "password" },
    ],
  },
];

const SYNC_HISTORY = [
  { platform: "SHOPEE", type: "ORDERS", status: "SUCCESS", count: 18, time: "2026-03-11 10:00" },
  { platform: "TIKTOK", type: "PRODUCTS", status: "SUCCESS", count: 42, time: "2026-03-11 10:15" },
  { platform: "SHOPIFY", type: "ORDERS", status: "SUCCESS", count: 12, time: "2026-03-11 10:30" },
  { platform: "LAZADA", type: "INVENTORY", status: "PARTIAL", count: 30, time: "2026-03-11 09:45" },
  { platform: "AMAZON", type: "ORDERS", status: "FAILED", count: 0, time: "2026-03-11 09:00" },
];

export default function IntegrationsPage() {
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const platform = PLATFORMS.find((p) => p.key === configuring);

  const handleSync = (platformKey: string) => {
    setSyncing(platformKey);
    setTimeout(() => setSyncing(null), 3000);
  };

  return (
    <div>
      <TopBar
        title="Platform Integrations"
        subtitle="Connect and manage your e-commerce channels"
        actions={
          <button className="erp-btn erp-btn-primary text-sm" onClick={() => { PLATFORMS.filter(p => p.connected).forEach(p => handleSync(p.key)); }}>
            Sync All Channels
          </button>
        }
      />

      <div className="p-8 fade-in">
        {/* Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="erp-card">
            <div className="text-3xl font-bold" style={{ color: "#16a34a" }}>4</div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Connected Channels</div>
          </div>
          <div className="erp-card">
            <div className="text-3xl font-bold">44</div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Orders Today (All Channels)</div>
          </div>
          <div className="erp-card">
            <div className="text-3xl font-bold" style={{ color: "#dc2626" }}>1</div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Failed Syncs</div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {PLATFORMS.map((p) => (
            <div key={p.key} className="erp-card" style={{ borderLeft: `4px solid ${p.color}` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{p.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg" style={{ color: "#0f172a" }}>{p.name}</h3>
                      {p.connected ? (
                        <span className="badge text-xs" style={{ background: "#dcfce7", color: "#166534" }}>● Connected</span>
                      ) : (
                        <span className="badge text-xs" style={{ background: "#fee2e2", color: "#991b1b" }}>○ Disconnected</span>
                      )}
                    </div>
                    <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{p.description}</p>
                    {p.shopName && (
                      <p className="text-xs mt-1 font-mono" style={{ color: "#94a3b8" }}>Store: {p.shopName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {p.connected && p.lastSync && (
                    <div className="text-right mr-4">
                      <div className="text-xs" style={{ color: "#94a3b8" }}>Last Sync</div>
                      <div className="text-sm font-medium" style={{ color: "#374151" }}>{p.lastSync}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>{p.ordersToday} orders today</div>
                    </div>
                  )}

                  {p.connected && (
                    <button
                      onClick={() => handleSync(p.key)}
                      disabled={syncing === p.key}
                      className="erp-btn erp-btn-secondary text-sm"
                    >
                      {syncing === p.key ? "Syncing..." : "Sync Now"}
                    </button>
                  )}

                  <button
                    onClick={() => { setConfiguring(p.key); setFormData({}); }}
                    className="erp-btn text-sm"
                    style={{ background: p.connected ? "white" : p.color, color: p.connected ? "#374151" : "white", border: p.connected ? "1px solid #e2e8f0" : "none" }}
                  >
                    {p.connected ? "Settings" : "Connect"}
                  </button>
                </div>
              </div>

              {p.connected && (
                <div className="mt-4 pt-4 border-t flex items-center gap-6" style={{ borderColor: "#f1f5f9" }}>
                  <div className="flex gap-2">
                    {p.features.map((f) => (
                      <span key={f} className="badge text-xs" style={{ background: "#f1f5f9", color: "#374151" }}>{f}</span>
                    ))}
                  </div>
                  <div className="text-xs ml-auto" style={{ color: "#94a3b8" }}>Auth: {p.authType}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sync History */}
        <div className="erp-card">
          <h3 className="font-semibold mb-4" style={{ color: "#0f172a" }}>Recent Sync Activity</h3>
          <table className="erp-table">
            <thead>
              <tr>
                <th>Platform</th>
                <th>Type</th>
                <th>Status</th>
                <th>Records</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {SYNC_HISTORY.map((log, idx) => (
                <tr key={idx}>
                  <td>
                    <span className="font-medium text-sm" style={{ color: "#374151" }}>{log.platform}</span>
                  </td>
                  <td>
                    <span className="badge text-xs" style={{ background: "#f1f5f9", color: "#374151" }}>{log.type}</span>
                  </td>
                  <td>
                    <span className="badge text-xs" style={{
                      background: log.status === "SUCCESS" ? "#dcfce7" : log.status === "PARTIAL" ? "#fef3c7" : "#fee2e2",
                      color: log.status === "SUCCESS" ? "#166534" : log.status === "PARTIAL" ? "#92400e" : "#991b1b"
                    }}>
                      {log.status}
                    </span>
                  </td>
                  <td className="text-sm" style={{ color: "#374151" }}>{log.count} records</td>
                  <td className="text-xs" style={{ color: "#64748b" }}>{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config Modal */}
      {configuring && platform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <div className="p-6 border-b" style={{ borderColor: "#e2e8f0" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{platform.icon}</span>
                  <div>
                    <h2 className="text-lg font-semibold">{platform.name} Configuration</h2>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{platform.authType}</p>
                  </div>
                </div>
                <button onClick={() => setConfiguring(null)} style={{ color: "#94a3b8", fontSize: "24px" }}>×</button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                <strong>How to connect:</strong> Get your API credentials from the{" "}
                <span style={{ textDecoration: "underline" }}>{platform.name} Developer Portal</span>{" "}
                and paste them below.
              </div>

              <div className="space-y-4">
                {platform.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium mb-1.5">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="erp-input"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="erp-btn erp-btn-primary flex-1 justify-center"
                  style={{ background: platform.color }}
                  onClick={() => setConfiguring(null)}
                >
                  {platform.connected ? "Update Configuration" : "Connect " + platform.name}
                </button>
                <button onClick={() => setConfiguring(null)} className="erp-btn erp-btn-secondary">
                  Cancel
                </button>
              </div>

              {platform.connected && (
                <button className="mt-3 w-full text-sm text-center py-2" style={{ color: "#dc2626" }}>
                  Disconnect {platform.name}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
