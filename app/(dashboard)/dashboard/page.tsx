"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie,
  LineChart, Line,
} from "recharts";
import {
  ShoppingBag, Box, AlertTriangle, TrendingUp, ArrowRight,
  Loader2, Activity, Users, Package, RefreshCw, CheckCircle2,
  XCircle, Clock,
} from "lucide-react";
import Link from "next/link";

/* ─────────────────── TYPES ─────────────────── */

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockAlerts: number;
  newCustomers: number;
}
interface PlatformData { name: string; orders: number; revenue: number; status: "active" | "disconnected"; }
interface RecentOrder { id: string; platform: string; customer: string; total: number; status: string; time: string; }
interface DashboardData { summary: DashboardSummary; platforms: PlatformData[]; recentOrders: RecentOrder[]; }

/* ─────────────────── CONSTANTS ─────────────────── */

const NAVY = "#000080";
const SLATE = "#6D8196";
const LIGHT = "#ADD8E6";
const BORDER = "#C8DFF0";
const BG = "#EEF5FF";
const MONO = "'IBM Plex Mono', monospace";
const SANS = "'IBM Plex Sans', sans-serif";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#8AAFC8", CONFIRMED: "#6D8196", PROCESSING: "#6D8196",
  SHIPPED: "#4A7B5F", DELIVERED: "#4A7B5F", CANCELLED: "#B05050",
  RETURNED: "#B05050", REFUNDED: "#8AAFC8",
};

const TIER_COLORS: Record<string, string> = {
  VIP: "#000080", Gold: "#C5960C", Silver: "#6D8196", Bronze: "#A67C52",
};

const CHANNEL_ACCENTS: Record<string, string> = {
  SHOPIFY: LIGHT, TIKTOK: NAVY, SHOPEE: SLATE, LAZADA: LIGHT, AMAZON: SLATE,
};

/* ─────────────────── ANALYTICS HOOK ─────────────────── */

function useAnalytic<T>(metric: string, params: string = "", enabled: boolean = true) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchData = useCallback(async () => {
    if (!enabled || fetched) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?metric=${metric}${params}`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        if (json.success) setData(json.data);
      }
    } catch { /* silent */ } finally {
      setLoading(false);
      setFetched(true);
    }
  }, [metric, params, enabled, fetched]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading };
}

/* ─────────────────── EMPTY STATE ─────────────────── */

function Empty({ text = "No data yet" }: { text?: string }) {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: 120 }}>
      <p className="text-xs" style={{ color: "#8AAFC8" }}>{text}</p>
    </div>
  );
}

function CardHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-4">
      <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: SLATE }}>{label}</p>
      {sub && <p className="text-sm mt-0.5" style={{ color: NAVY }}>{sub}</p>}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white p-5 ${className}`} style={{ border: `1px solid ${BORDER}` }}>{children}</div>;
}

function MiniLoader() {
  return <div className="flex items-center justify-center" style={{ minHeight: 120 }}><Loader2 size={16} className="animate-spin" style={{ color: LIGHT }} /></div>;
}

/* ─────────────────── TAB: OVERVIEW ─────────────────── */

function OverviewTab({ platforms, recentOrders, period }: { platforms: PlatformData[]; recentOrders: RecentOrder[]; period: string }) {
  const { data: orderTrend, loading: l1 } = useAnalytic<{ date: string; count: number }[]>("order-trend", `&period=${period}`);
  const { data: revenueTrend, loading: l2 } = useAnalytic<{ date: string; revenue: number }[]>("revenue-trend", `&period=${period}`);
  const { data: orderStatus, loading: l3 } = useAnalytic<{ status: string; count: number }[]>("order-status");
  const { data: syncHealth, loading: l4 } = useAnalytic<{ platform: string; isActive: boolean; lastSyncAt: string | null; syncs24h: { success: number; failed: number; running: number } }[]>("sync-health");

  return (
    <div className="space-y-3">
      {/* Row 1: Order Volume + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <CardHeader label="Order Volume" sub="Trend" />
          {l1 ? <MiniLoader /> : orderTrend && orderTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={orderTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs><linearGradient id="ogr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={NAVY} stopOpacity={0.15} /><stop offset="100%" stopColor={NAVY} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke={BG} strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: SLATE, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 9, fill: SLATE, fontFamily: MONO }} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={{ background: NAVY, border: "none", fontSize: 11, fontFamily: MONO }} labelStyle={{ color: LIGHT }} itemStyle={{ color: "#FFF" }} />
                <Area type="monotone" dataKey="count" stroke={NAVY} fill="url(#ogr)" strokeWidth={1.5} name="Orders" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <Empty text="Connect channels to see trends" />}
        </Card>

        <Card>
          <CardHeader label="Order Status" sub="Breakdown" />
          {l3 ? <MiniLoader /> : orderStatus && orderStatus.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={orderStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                    {orderStatus.map((s) => <Cell key={s.status} fill={STATUS_COLORS[s.status] || SLATE} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: NAVY, border: "none", fontSize: 11, fontFamily: MONO }} labelStyle={{ color: LIGHT }} itemStyle={{ color: "#FFF" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {orderStatus.map((s) => (
                  <div key={s.status} className="flex items-center gap-1">
                    <div className="w-2 h-2" style={{ background: STATUS_COLORS[s.status] || SLATE }} />
                    <span className="text-[9px] uppercase" style={{ color: SLATE }}>{s.status} ({s.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty />}
        </Card>
      </div>

      {/* Row 2: Revenue Trend */}
      <Card>
        <CardHeader label="Revenue" sub="Trend" />
        {l2 ? <MiniLoader /> : revenueTrend && revenueTrend.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs><linearGradient id="rgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={LIGHT} stopOpacity={0.3} /><stop offset="100%" stopColor={LIGHT} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid stroke={BG} strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: SLATE, fontFamily: MONO }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: SLATE, fontFamily: MONO }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: NAVY, border: "none", fontSize: 11, fontFamily: MONO }} labelStyle={{ color: LIGHT }} itemStyle={{ color: "#FFF" }} formatter={(v) => [`RM ${Number(v).toLocaleString()}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke={NAVY} fill="url(#rgr)" strokeWidth={1.5} name="Revenue" />
            </AreaChart>
          </ResponsiveContainer>
        ) : <Empty text="Connect channels to see revenue trends" />}
      </Card>

      {/* Row 3: Channels + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div>
          <p className="text-[9px] tracking-[0.2em] uppercase mb-3" style={{ color: SLATE }}>Channel Status</p>
          <div className="space-y-2">
            {platforms.map((ch) => {
              const accent = CHANNEL_ACCENTS[ch.name] || SLATE;
              const isActive = ch.status === "active";
              return (
                <Link key={ch.name} href={`/channels/${ch.name.toLowerCase()}`} className="block bg-white p-3.5 transition-colors" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1 h-8" style={{ background: isActive ? accent : "#D8EDF8" }} />
                      <div>
                        <p className="text-[11px] tracking-wider uppercase" style={{ color: NAVY }}>{ch.name}</p>
                        <p className="text-base" style={{ fontFamily: MONO, color: NAVY }}>{ch.orders}</p>
                        <p className="text-[9px]" style={{ color: SLATE }}>orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ fontFamily: MONO, color: NAVY }}>RM {ch.revenue.toLocaleString()}</p>
                      <p className="text-[9px] tracking-wider mt-1" style={{ color: isActive ? "#4A7B5F" : "#8AAFC8" }}>{ch.status}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div><CardHeader label="Recent Activity" sub="Latest Orders" /></div>
            <Link href="/orders" className="flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase hover:opacity-80" style={{ color: SLATE }}>View All <ArrowRight size={10} /></Link>
          </div>
          {recentOrders.length > 0 ? (
            <table className="w-full">
              <thead><tr style={{ borderBottom: `1px solid ${BG}` }}>
                {["Order ID", "Customer", "Channel", "Amount", "Status"].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: SLATE }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{recentOrders.map((o) => (
                <tr key={o.id} style={{ borderBottom: "1px solid #F5F9FF" }}>
                  <td className="py-3 text-[11px]" style={{ fontFamily: MONO, color: SLATE }}>#{o.id}</td>
                  <td className="py-3 text-xs" style={{ color: "#1A2540" }}>{o.customer}</td>
                  <td className="py-3"><span className="text-[9px] tracking-wider uppercase" style={{ color: SLATE }}>{o.platform}</span></td>
                  <td className="py-3 text-[11px]" style={{ fontFamily: MONO, color: NAVY }}>RM {o.total.toFixed(2)}</td>
                  <td className="py-3"><span className="text-[10px] tracking-wide" style={{ color: STATUS_COLORS[o.status] || SLATE }}>{o.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          ) : <Empty />}
        </Card>
      </div>

      {/* Row 4: Sync Health */}
      <Card>
        <CardHeader label="Sync Health" sub="Platform Status" />
        {l4 ? <MiniLoader /> : syncHealth && syncHealth.length > 0 ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"].map((p) => {
              const s = syncHealth.find((x) => x.platform === p);
              const connected = s?.isActive ?? false;
              const syncs = s?.syncs24h ?? { success: 0, failed: 0, running: 0 };
              const statusColor = !connected ? "#C8DFF0" : syncs.failed > 0 ? "#B05050" : syncs.success > 0 ? "#4A7B5F" : "#8AAFC8";
              return (
                <div key={p} className="p-3 text-center" style={{ border: `1px solid ${BORDER}` }}>
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: statusColor }} />
                    <p className="text-[10px] tracking-wider uppercase" style={{ color: NAVY }}>{p}</p>
                  </div>
                  {connected ? (
                    <>
                      <div className="flex items-center justify-center gap-2 text-[9px]" style={{ color: SLATE }}>
                        <span style={{ color: "#4A7B5F" }}><CheckCircle2 size={9} className="inline mr-0.5" />{syncs.success}</span>
                        <span style={{ color: "#B05050" }}><XCircle size={9} className="inline mr-0.5" />{syncs.failed}</span>
                        {syncs.running > 0 && <span><RefreshCw size={9} className="inline mr-0.5 animate-spin" />{syncs.running}</span>}
                      </div>
                      <p className="text-[8px] mt-1" style={{ fontFamily: MONO, color: SLATE }}>
                        {s?.lastSyncAt ? new Date(s.lastSyncAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "Never"}
                      </p>
                    </>
                  ) : (
                    <p className="text-[9px]" style={{ color: "#C8DFF0" }}>Not connected</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : <Empty text="No integrations configured" />}
      </Card>
    </div>
  );
}

/* ─────────────────── TAB: SALES ─────────────────── */

function SalesTab({ period }: { period: string }) {
  const { data: heatmap, loading: l1 } = useAnalytic<{ date: string; count: number }[]>("sales-heatmap", "&period=90d");
  const { data: topProducts, loading: l2 } = useAnalytic<{ name: string; sku: string; unitsSold: number; revenue: number }[]>("top-products", `&period=${period}&limit=10`);
  const { data: aov, loading: l3 } = useAnalytic<{ overall: { orders: number; revenue: number; aov: number }; byPlatform: { platform: string; orders: number; aov: number }[] }>("aov", `&period=${period}`);
  const { data: margins, loading: l4 } = useAnalytic<{ name: string; sku: string; costPrice: number; avgSellingPrice: number; marginPct: number }[]>("profit-margins", "&limit=20");
  const { data: returnRate, loading: l5 } = useAnalytic<{ totalOrders: number; returnedOrders: number; returnRate: number }>("return-rate", `&period=${period}`);

  // Build heatmap grid (13 weeks × 7 days)
  const heatmapGrid = (() => {
    if (!heatmap) return [];
    const map = new Map(heatmap.map((d) => [d.date, d.count]));
    const days: { date: string; count: number; day: number; week: number }[] = [];
    const now = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const weekIdx = Math.floor((89 - i) / 7);
      days.push({ date: key, count: map.get(key) || 0, day: dayOfWeek, week: weekIdx });
    }
    return days;
  })();

  const maxCount = Math.max(1, ...heatmapGrid.map((d) => d.count));

  return (
    <div className="space-y-3">
      {/* AOV + Return Rate cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader label="Average Order Value" sub="AOV" />
          {l3 ? <MiniLoader /> : aov ? (
            <div>
              <p className="text-3xl" style={{ fontFamily: MONO, color: NAVY }}>RM {aov.overall.aov.toFixed(2)}</p>
              <p className="text-[10px] mt-1" style={{ color: SLATE }}>{aov.overall.orders} orders · RM {aov.overall.revenue.toLocaleString()} total</p>
              {aov.byPlatform.length > 0 && (
                <div className="mt-3 space-y-1">
                  {aov.byPlatform.map((p) => (
                    <div key={p.platform} className="flex items-center justify-between text-[10px]">
                      <span style={{ color: SLATE }}>{p.platform}</span>
                      <span style={{ fontFamily: MONO, color: NAVY }}>RM {p.aov.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : <Empty />}
        </Card>

        <Card>
          <CardHeader label="Return & Cancel" sub="Rate" />
          {l5 ? <MiniLoader /> : returnRate ? (
            <div className="text-center">
              <p className="text-3xl" style={{ fontFamily: MONO, color: returnRate.returnRate > 10 ? "#B05050" : NAVY }}>
                {returnRate.returnRate.toFixed(1)}%
              </p>
              <p className="text-[10px] mt-1" style={{ color: SLATE }}>
                {returnRate.returnedOrders} of {returnRate.totalOrders} orders
              </p>
              <p className="text-[9px] mt-2" style={{ color: returnRate.returnRate > 10 ? "#B05050" : "#4A7B5F" }}>
                {returnRate.returnRate > 10 ? "⚠ Above 10% threshold" : "✓ Healthy rate"}
              </p>
            </div>
          ) : <Empty />}
        </Card>

        <Card>
          <CardHeader label="Sales Heatmap" sub="90 Days" />
          {l1 ? <MiniLoader /> : heatmapGrid.length > 0 ? (
            <div>
              <div className="flex gap-[2px] flex-wrap" style={{ maxWidth: 300 }}>
                {heatmapGrid.map((d) => {
                  const intensity = d.count / maxCount;
                  const bg = d.count === 0 ? BG : `rgba(0, 0, 128, ${0.15 + intensity * 0.75})`;
                  return <div key={d.date} className="w-[10px] h-[10px]" style={{ background: bg }} title={`${d.date}: ${d.count} orders`} />;
                })}
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[8px]" style={{ color: SLATE }}>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((v) => (
                  <div key={v} className="w-[10px] h-[10px]" style={{ background: v === 0 ? BG : `rgba(0, 0, 128, ${0.15 + v * 0.75})` }} />
                ))}
                <span className="text-[8px]" style={{ color: SLATE }}>More</span>
              </div>
            </div>
          ) : <Empty />}
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader label="Top Products" sub="By Units Sold" />
        {l2 ? <MiniLoader /> : topProducts && topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, topProducts.length * 32)}>
            <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={8}>
              <XAxis type="number" tick={{ fontSize: 9, fill: SLATE, fontFamily: MONO }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: SLATE }} tickLine={false} axisLine={false} width={120} />
              <Tooltip contentStyle={{ background: NAVY, border: "none", fontSize: 11, fontFamily: MONO }} labelStyle={{ color: LIGHT }} itemStyle={{ color: "#FFF" }} />
              <Bar dataKey="unitsSold" name="Units Sold" radius={0}>
                {topProducts.map((_, i) => <Cell key={i} fill={i === 0 ? NAVY : LIGHT} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : <Empty />}
      </Card>

      {/* Profit Margins */}
      <Card>
        <CardHeader label="Profit Margins" sub="By Product" />
        {l4 ? <MiniLoader /> : margins && margins.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: `1px solid ${BG}` }}>
                {["Product", "SKU", "Cost", "Avg Sell", "Margin"].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: SLATE }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{margins.map((m) => (
                <tr key={m.sku} style={{ borderBottom: "1px solid #F5F9FF" }}>
                  <td className="py-2.5 text-xs" style={{ color: "#1A2540" }}>{m.name}</td>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{m.sku}</td>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>RM {m.costPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>RM {m.avgSellingPrice.toFixed(2)}</td>
                  <td className="py-2.5 text-[10px] font-medium" style={{ fontFamily: MONO, color: m.marginPct < 0 ? "#B05050" : m.marginPct < 20 ? "#C5960C" : "#4A7B5F" }}>
                    {m.marginPct.toFixed(1)}%
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty text="Add products with cost & selling prices to see margins" />}
      </Card>
    </div>
  );
}

/* ─────────────────── TAB: CUSTOMERS ─────────────────── */

function CustomersTab({ period }: { period: string }) {
  const { data: topCustomers, loading: l1 } = useAnalytic<{ name: string; email: string | null; totalOrders: number; totalSpent: number; platform: string | null; tier: string }[]>("top-customers", "&limit=10");
  const { data: tiers, loading: l2 } = useAnalytic<{ tier: string; count: number }[]>("customer-tiers");
  const { data: repeatRate, loading: l3 } = useAnalytic<{ totalCustomers: number; repeatCustomers: number; repeatRate: number }>("repeat-rate");
  const { data: activityFeed, loading: l4 } = useAnalytic<{ type: string; message: string; time: string }[]>("activity-feed", "&limit=20");

  // suppress unused var warning
  void period;

  return (
    <div className="space-y-3">
      {/* Row 1: Repeat Rate + Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <Card>
          <CardHeader label="Repeat Purchase" sub="Rate" />
          {l3 ? <MiniLoader /> : repeatRate ? (
            <div className="text-center">
              <p className="text-3xl" style={{ fontFamily: MONO, color: NAVY }}>{repeatRate.repeatRate.toFixed(1)}%</p>
              <p className="text-[10px] mt-1" style={{ color: SLATE }}>
                {repeatRate.repeatCustomers} of {repeatRate.totalCustomers} customers
              </p>
              <p className="text-[9px] mt-2" style={{ color: repeatRate.repeatRate > 30 ? "#4A7B5F" : "#8AAFC8" }}>
                {repeatRate.repeatRate > 30 ? "✓ Strong loyalty" : "Build retention programs"}
              </p>
            </div>
          ) : <Empty />}
        </Card>

        <Card>
          <CardHeader label="Customer Tiers" sub="Distribution" />
          {l2 ? <MiniLoader /> : tiers && tiers.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie data={tiers} dataKey="count" nameKey="tier" cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} strokeWidth={0}>
                    {tiers.map((t) => <Cell key={t.tier} fill={TIER_COLORS[t.tier] || SLATE} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: NAVY, border: "none", fontSize: 11, fontFamily: MONO }} labelStyle={{ color: LIGHT }} itemStyle={{ color: "#FFF" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
                {tiers.map((t) => (
                  <div key={t.tier} className="flex items-center gap-1">
                    <div className="w-2 h-2" style={{ background: TIER_COLORS[t.tier] || SLATE }} />
                    <span className="text-[9px] uppercase" style={{ color: SLATE }}>{t.tier} ({t.count})</span>
                  </div>
                ))}
              </div>
            </>
          ) : <Empty />}
        </Card>

        <Card>
          <CardHeader label="Activity Feed" sub="Recent" />
          {l4 ? <MiniLoader /> : activityFeed && activityFeed.length > 0 ? (
            <div className="space-y-2 max-h-[240px] overflow-y-auto">
              {activityFeed.map((item, i) => (
                <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: "1px solid #F5F9FF" }}>
                  <div className="mt-0.5 flex-shrink-0">
                    {item.type === "order" ? <ShoppingBag size={10} style={{ color: NAVY }} /> :
                     item.type === "sync" ? <RefreshCw size={10} style={{ color: LIGHT }} /> :
                     <Activity size={10} style={{ color: SLATE }} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] truncate" style={{ color: "#1A2540" }}>{item.message}</p>
                    <p className="text-[8px]" style={{ fontFamily: MONO, color: SLATE }}>
                      {new Date(item.time).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty />}
        </Card>
      </div>

      {/* Top Customers */}
      <Card>
        <CardHeader label="Top Customers" sub="By Total Spent" />
        {l1 ? <MiniLoader /> : topCustomers && topCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: `1px solid ${BG}` }}>
                {["#", "Name", "Email", "Orders", "Total Spent", "Platform", "Tier"].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: SLATE }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{topCustomers.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F5F9FF" }}>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{i + 1}</td>
                  <td className="py-2.5 text-xs" style={{ color: "#1A2540" }}>{c.name}</td>
                  <td className="py-2.5 text-[10px]" style={{ color: SLATE }}>{c.email || "—"}</td>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>{c.totalOrders}</td>
                  <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>RM {c.totalSpent.toLocaleString()}</td>
                  <td className="py-2.5"><span className="text-[9px] tracking-wider uppercase" style={{ color: SLATE }}>{c.platform || "—"}</span></td>
                  <td className="py-2.5">
                    <span className="text-[9px] tracking-wider uppercase px-1.5 py-0.5" style={{ color: TIER_COLORS[c.tier] || SLATE, background: BG }}>{c.tier}</span>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <Empty />}
      </Card>
    </div>
  );
}

/* ─────────────────── TAB: INVENTORY ─────────────────── */

function InventoryTab({ period }: { period: string }) {
  const { data: lowStock, loading: l1 } = useAnalytic<{ name: string; sku: string; quantity: number; reorderPoint: number; reorderQty: number; warehouse: string }[]>("low-stock");
  const { data: turnover, loading: l2 } = useAnalytic<{ name: string; sku: string; currentStock: number; unitsSold: number; turnoverRate: number }[]>("inventory-turnover", `&period=${period}&limit=20`);

  return (
    <div className="space-y-3">
      {/* Low Stock Alerts */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={14} style={{ color: "#B05050" }} />
          <CardHeader label="Low Stock Alerts" sub="Items Below Reorder Point" />
        </div>
        {l1 ? <MiniLoader /> : lowStock && lowStock.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: `1px solid ${BG}` }}>
                {["Product", "SKU", "Warehouse", "Current Qty", "Reorder At", "Reorder Qty"].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: SLATE }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{lowStock.map((item, i) => {
                const critical = item.quantity <= Math.floor(item.reorderPoint * 0.5);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F5F9FF", background: critical ? "#FFF5F5" : undefined }}>
                    <td className="py-2.5 text-xs" style={{ color: "#1A2540" }}>{item.name}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{item.sku}</td>
                    <td className="py-2.5 text-[10px]" style={{ color: SLATE }}>{item.warehouse}</td>
                    <td className="py-2.5 text-[10px] font-medium" style={{ fontFamily: MONO, color: critical ? "#B05050" : "#C5960C" }}>{item.quantity}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{item.reorderPoint}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>{item.reorderQty}</td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <Empty text="All items above reorder point — no alerts" />}
      </Card>

      {/* Inventory Turnover */}
      <Card>
        <CardHeader label="Inventory Turnover" sub="Units Sold vs Current Stock" />
        {l2 ? <MiniLoader /> : turnover && turnover.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr style={{ borderBottom: `1px solid ${BG}` }}>
                {["Product", "SKU", "Current Stock", "Units Sold", "Turnover", "Status"].map((h) => (
                  <th key={h} className="text-left pb-2.5 font-normal text-[9px] tracking-[0.15em] uppercase" style={{ color: SLATE }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{turnover.map((item, i) => {
                const status = item.turnoverRate > 2 ? "Fast" : item.turnoverRate > 0.5 ? "Normal" : item.turnoverRate > 0 ? "Slow" : "Dead";
                const statusColor = status === "Fast" ? "#4A7B5F" : status === "Normal" ? NAVY : status === "Slow" ? "#C5960C" : "#B05050";
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #F5F9FF" }}>
                    <td className="py-2.5 text-xs" style={{ color: "#1A2540" }}>{item.name}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{item.sku}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>{item.currentStock}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>{item.unitsSold}</td>
                    <td className="py-2.5 text-[10px]" style={{ fontFamily: MONO, color: NAVY }}>{item.turnoverRate.toFixed(2)}x</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 h-1.5 rounded-full" style={{ background: BG }}>
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, item.turnoverRate * 30)}%`, background: statusColor }} />
                        </div>
                        <span className="text-[9px] tracking-wider uppercase" style={{ color: statusColor }}>{status}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        ) : <Empty text="Add products and process orders to see turnover data" />}
      </Card>
    </div>
  );
}

/* ─────────────────── LOADING SKELETON ─────────────────── */

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse" style={{ fontFamily: SANS }}>
      <div className="flex items-end justify-between">
        <div><div className="h-3 w-16 rounded" style={{ background: BG }} /><div className="h-6 w-48 rounded mt-1" style={{ background: BG }} /></div>
        <div className="h-3 w-32 rounded" style={{ background: BG }} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-4 h-32" style={{ border: `1px solid ${BORDER}` }}>
            <div className="h-3 w-20 rounded mb-3" style={{ background: BG }} />
            <div className="h-8 w-24 rounded" style={{ background: BG }} />
            <div className="h-3 w-28 rounded mt-2" style={{ background: BG }} />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────── MAIN DASHBOARD ─────────────────── */

const TABS = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "sales", label: "Sales", icon: ShoppingBag },
  { id: "customers", label: "Customers", icon: Users },
  { id: "inventory", label: "Inventory", icon: Package },
] as const;

const PERIODS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "ytd", label: "This year" },
];

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [period, setPeriod] = useState("7d");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard", { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to load dashboard (${res.status})`);
        const json = await res.json();
        if (!json.success) throw new Error("Dashboard API returned an error");
        setData(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]" style={{ fontFamily: SANS }}>
        <div className="text-center">
          <p className="text-sm" style={{ color: SLATE }}>Failed to load dashboard</p>
          <p className="text-xs mt-1" style={{ color: "#8AAFC8", fontFamily: MONO }}>{error}</p>
          <button onClick={() => { setLoading(true); setError(null); window.location.reload(); }} className="mt-4 text-[10px] tracking-[0.15em] uppercase px-4 py-2" style={{ color: NAVY, border: `1px solid ${BORDER}` }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { summary, platforms, recentOrders } = data;

  const kpis = [
    { label: "Total Orders", value: summary.totalOrders.toLocaleString(), sub: "Across all channels", icon: ShoppingBag },
    { label: "Active Products", value: summary.activeProducts.toLocaleString(), sub: `In ${platforms.length} channel${platforms.length !== 1 ? "s" : ""}`, icon: Box },
    { label: "Low Stock", value: summary.lowStockAlerts.toString(), sub: "Items need reorder", icon: AlertTriangle },
    { label: "Total Revenue", value: `RM ${summary.totalRevenue.toLocaleString()}`, sub: "All time", icon: TrendingUp },
  ];

  const now = new Date();
  const timestamp = now.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) + " \u2014 " + now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: SANS }}>
      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: SLATE }}>Overview</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: "-0.01em", color: NAVY }}>Performance Summary</h1>
        </div>
        <p className="text-[10px]" style={{ fontFamily: MONO, color: SLATE }}>{timestamp}</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white p-4" style={{ border: `1px solid ${BORDER}` }}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: SLATE }}>{kpi.label}</p>
              <kpi.icon size={12} className="mt-0.5" style={{ color: LIGHT }} />
            </div>
            <p className="text-2xl" style={{ fontFamily: MONO, letterSpacing: "-0.02em", color: NAVY }}>{kpi.value}</p>
            <p className="text-[10px] mt-1" style={{ color: SLATE }}>{kpi.sub}</p>
            <div className="mt-3 h-px" style={{ background: BG }} />
          </div>
        ))}
      </div>

      {/* Tab bar + Period selector */}
      <div className="flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase transition-colors"
                style={{
                  color: isActive ? NAVY : SLATE,
                  borderBottom: isActive ? `2px solid ${NAVY}` : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                <tab.icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 bg-white appearance-none cursor-pointer"
          style={{ border: `1px solid ${BORDER}`, color: NAVY, fontFamily: MONO }}
        >
          {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && <OverviewTab platforms={platforms} recentOrders={recentOrders} period={period} />}
      {activeTab === "sales" && <SalesTab period={period} />}
      {activeTab === "customers" && <CustomersTab period={period} />}
      {activeTab === "inventory" && <InventoryTab period={period} />}
    </div>
  );
}
