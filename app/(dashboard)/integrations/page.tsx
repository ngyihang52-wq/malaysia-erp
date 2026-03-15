"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";

// ── Static UI metadata only (no runtime state) ──────────────────────────────

const PLATFORM_CONFIG = [
  {
    key: "SHOPIFY",
    name: "Shopify",
    description: "Connect your Shopify store to sync products, orders, and inventory",
    icon: "\uD83D\uDFE2",
    color: "#96BF48",
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
    icon: "\u26AB",
    color: "#010101",
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
    icon: "\uD83D\uDFE0",
    color: "#EE4D2D",
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
    icon: "\uD83D\uDD35",
    color: "#0F146D",
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
    icon: "\uD83D\uDFE1",
    color: "#FF9900",
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

// ── Types ────────────────────────────────────────────────────────────────────

interface Credential {
  platform: string;
  name: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSync: string | null;
}

interface SyncRecord {
  platform: string;
  type: string;
  status: string;
  recordsCount: number;
  startedAt: string | null;
  completedAt: string | null;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IntegrationsPage() {
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  // API-driven state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [syncHistory, setSyncHistory] = useState<SyncRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal feedback state
  const [modalStatus, setModalStatus] = useState<{ type: "success" | "error" | "testing" | "saving"; message: string } | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/credentials");
      if (res.ok) {
        const json = await res.json();
        setCredentials(json.data ?? []);
      }
    } catch {
      // silently fail — page will show everything as disconnected
    }
  }, []);

  const fetchSyncHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/sync/history");
      if (res.ok) {
        const json = await res.json();
        setSyncHistory(json.data ?? []);
      }
    } catch {
      // silently fail
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchCredentials(), fetchSyncHistory()]);
  }, [fetchCredentials, fetchSyncHistory]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await refreshAll();
      setLoading(false);
    })();
  }, [refreshAll]);

  // ── Derived / merged data ────────────────────────────────────────────────

  const getCredential = (platformKey: string): Credential | undefined =>
    credentials.find((c) => c.platform === platformKey);

  const isConnected = (platformKey: string): boolean => {
    const cred = getCredential(platformKey);
    return !!cred?.isActive;
  };

  const connectedCount = PLATFORM_CONFIG.filter((p) => isConnected(p.key)).length;
  const failedSyncs = syncHistory.filter((s) => s.status === "FAILED").length;

  const platform = PLATFORM_CONFIG.find((p) => p.key === configuring);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const formatDateTime = (iso: string | null): string => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-MY", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleSync = async (platformKey: string) => {
    setSyncing(platformKey);
    try {
      const prodRes = await fetch(`/api/sync?platform=${platformKey}&type=PRODUCTS`, { method: "POST" });
      const orderRes = await fetch(`/api/sync?platform=${platformKey}&type=ORDERS`, { method: "POST" });

      if (prodRes.ok && orderRes.ok) {
        showToast("success", `${platformKey} synced successfully`);
      } else {
        const errData = await (prodRes.ok ? orderRes : prodRes).json().catch(() => null);
        showToast("error", errData?.error ?? `Sync failed for ${platformKey}`);
      }
      await refreshAll();
    } catch {
      showToast("error", `Network error while syncing ${platformKey}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncAll = async () => {
    const connected = PLATFORM_CONFIG.filter((p) => isConnected(p.key));
    for (const p of connected) {
      await handleSync(p.key);
    }
  };

  const handleSave = async () => {
    if (!platform) return;

    // 1. Test credentials
    setModalStatus({ type: "testing", message: "Testing credentials..." });
    try {
      const testRes = await fetch("/api/integrations/credentials/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.key, credentials: formData }),
      });

      if (!testRes.ok) {
        const errData = await testRes.json().catch(() => null);
        setModalStatus({ type: "error", message: errData?.error ?? "Credential test failed. Please check your credentials." });
        return;
      }
    } catch {
      setModalStatus({ type: "error", message: "Network error while testing credentials." });
      return;
    }

    // 2. Save credentials
    setModalStatus({ type: "saving", message: "Saving credentials..." });
    try {
      const shopName = formData.shopDomain || formData.shopId || formData.sellerId || platform.name;
      const saveRes = await fetch("/api/integrations/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: platform.key, name: shopName, credentials: formData }),
      });

      if (saveRes.ok) {
        setModalStatus({ type: "success", message: "Connected successfully!" });
        await refreshAll();
        setTimeout(() => {
          setConfiguring(null);
          setModalStatus(null);
        }, 1200);
      } else {
        const errData = await saveRes.json().catch(() => null);
        setModalStatus({ type: "error", message: errData?.error ?? "Failed to save credentials." });
      }
    } catch {
      setModalStatus({ type: "error", message: "Network error while saving credentials." });
    }
  };

  const handleDisconnect = async () => {
    if (!platform) return;
    setModalStatus({ type: "saving", message: "Disconnecting..." });
    try {
      const res = await fetch(`/api/integrations/credentials?platform=${platform.key}`, { method: "DELETE" });
      if (res.ok) {
        setModalStatus({ type: "success", message: `${platform.name} disconnected.` });
        await refreshAll();
        setTimeout(() => {
          setConfiguring(null);
          setModalStatus(null);
        }, 1200);
      } else {
        const errData = await res.json().catch(() => null);
        setModalStatus({ type: "error", message: errData?.error ?? "Failed to disconnect." });
      }
    } catch {
      setModalStatus({ type: "error", message: "Network error while disconnecting." });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <TopBar
        title="Platform Integrations"
        subtitle="Connect and manage your e-commerce channels"
        actions={
          <button className="erp-btn erp-btn-primary text-sm" onClick={handleSyncAll}>
            Sync All Channels
          </button>
        }
      />

      <div className="p-8 fade-in">
        {/* Toast */}
        {toast && (
          <div
            className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in"
            style={{
              background: toast.type === "success" ? "#dcfce7" : "#fee2e2",
              color: toast.type === "success" ? "#166534" : "#991b1b",
              border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
            }}
          >
            {toast.message}
          </div>
        )}

        {/* Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="erp-card">
            <div className="text-3xl font-bold" style={{ color: "#16a34a" }}>
              {loading ? "-" : connectedCount}
            </div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Connected Channels</div>
          </div>
          <div className="erp-card">
            <div className="text-3xl font-bold">
              {loading ? "-" : PLATFORM_CONFIG.filter((p) => isConnected(p.key)).length}
            </div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Active Integrations</div>
          </div>
          <div className="erp-card">
            <div className="text-3xl font-bold" style={{ color: "#dc2626" }}>
              {loading ? "-" : failedSyncs}
            </div>
            <div className="text-sm mt-1" style={{ color: "#64748b" }}>Failed Syncs</div>
          </div>
        </div>

        {/* Platform Cards */}
        <div className="grid grid-cols-1 gap-4 mb-8">
          {PLATFORM_CONFIG.map((p) => {
            const cred = getCredential(p.key);
            const connected = isConnected(p.key);

            return (
              <div key={p.key} className="erp-card" style={{ borderLeft: `4px solid ${p.color}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{p.icon}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg" style={{ color: "#0f172a" }}>{p.name}</h3>
                        {connected ? (
                          <span className="badge text-xs" style={{ background: "#dcfce7", color: "#166534" }}>&#x25CF; Connected</span>
                        ) : (
                          <span className="badge text-xs" style={{ background: "#fee2e2", color: "#991b1b" }}>&#x25CB; Disconnected</span>
                        )}
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{p.description}</p>
                      {cred?.name && (
                        <p className="text-xs mt-1 font-mono" style={{ color: "#94a3b8" }}>Store: {cred.name}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {connected && cred?.lastSyncAt && (
                      <div className="text-right mr-4">
                        <div className="text-xs" style={{ color: "#94a3b8" }}>Last Sync</div>
                        <div className="text-sm font-medium" style={{ color: "#374151" }}>{formatDateTime(cred.lastSyncAt)}</div>
                      </div>
                    )}

                    {connected && (
                      <button
                        onClick={() => handleSync(p.key)}
                        disabled={syncing === p.key}
                        className="erp-btn erp-btn-secondary text-sm"
                      >
                        {syncing === p.key ? "Syncing..." : "Sync Now"}
                      </button>
                    )}

                    <button
                      onClick={() => { setConfiguring(p.key); setFormData({}); setModalStatus(null); }}
                      className="erp-btn text-sm"
                      style={{ background: connected ? "white" : p.color, color: connected ? "#374151" : "white", border: connected ? "1px solid #e2e8f0" : "none" }}
                    >
                      {connected ? "Settings" : "Connect"}
                    </button>
                  </div>
                </div>

                {connected && (
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
            );
          })}
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
              {syncHistory.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="text-center text-sm" style={{ color: "#94a3b8", padding: "24px 0" }}>
                    No sync activity yet
                  </td>
                </tr>
              )}
              {syncHistory.map((log, idx) => (
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
                  <td className="text-sm" style={{ color: "#374151" }}>{log.recordsCount} records</td>
                  <td className="text-xs" style={{ color: "#64748b" }}>{formatDateTime(log.completedAt ?? log.startedAt)}</td>
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
                <button onClick={() => { setConfiguring(null); setModalStatus(null); }} style={{ color: "#94a3b8", fontSize: "24px" }}>&times;</button>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#f0f9ff", color: "#0369a1", border: "1px solid #bae6fd" }}>
                <strong>How to connect:</strong> Get your API credentials from the{" "}
                <span style={{ textDecoration: "underline" }}>{platform.name} Developer Portal</span>{" "}
                and paste them below.
              </div>

              {/* Modal feedback */}
              {modalStatus && (
                <div
                  className="mb-4 p-3 rounded-lg text-sm"
                  style={{
                    background:
                      modalStatus.type === "success" ? "#dcfce7"
                      : modalStatus.type === "error" ? "#fee2e2"
                      : "#f1f5f9",
                    color:
                      modalStatus.type === "success" ? "#166534"
                      : modalStatus.type === "error" ? "#991b1b"
                      : "#374151",
                    border: `1px solid ${
                      modalStatus.type === "success" ? "#bbf7d0"
                      : modalStatus.type === "error" ? "#fecaca"
                      : "#e2e8f0"
                    }`,
                  }}
                >
                  {modalStatus.message}
                </div>
              )}

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
                      disabled={modalStatus?.type === "testing" || modalStatus?.type === "saving"}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  className="erp-btn erp-btn-primary flex-1 justify-center"
                  style={{ background: platform.color }}
                  onClick={handleSave}
                  disabled={modalStatus?.type === "testing" || modalStatus?.type === "saving"}
                >
                  {modalStatus?.type === "testing"
                    ? "Testing..."
                    : modalStatus?.type === "saving"
                    ? "Saving..."
                    : isConnected(platform.key)
                    ? "Update Configuration"
                    : "Connect " + platform.name}
                </button>
                <button onClick={() => { setConfiguring(null); setModalStatus(null); }} className="erp-btn erp-btn-secondary">
                  Cancel
                </button>
              </div>

              {isConnected(platform.key) && (
                <button
                  className="mt-3 w-full text-sm text-center py-2"
                  style={{ color: "#dc2626" }}
                  onClick={handleDisconnect}
                  disabled={modalStatus?.type === "testing" || modalStatus?.type === "saving"}
                >
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
