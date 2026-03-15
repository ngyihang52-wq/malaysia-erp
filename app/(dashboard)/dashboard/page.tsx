"use client";
import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import TopBar from "@/components/layout/TopBar";

const PLATFORM_COLORS: Record<string, string> = {
  SHOPIFY: "#96BF48",
  TIKTOK: "#010101",
  SHOPEE: "#EE4D2D",
  LAZADA: "#0F146D",
  AMAZON: "#FF9900",
};

const platformColors: Record<string, string> = {
  SHOPIFY: "platform-shopify",
  TIKTOK: "platform-tiktok",
  SHOPEE: "platform-shopee",
  LAZADA: "platform-lazada",
  AMAZON: "platform-amazon",
};

const statusColors: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef3c7", color: "#92400e" },
  CONFIRMED: { bg: "#dbeafe", color: "#1e40af" },
  PROCESSING: { bg: "#ede9fe", color: "#5b21b6" },
  SHIPPED: { bg: "#f0fdf4", color: "#166534" },
  DELIVERED: { bg: "#dcfce7", color: "#14532d" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
};

interface DashboardSavedQuery {
  id: string;
  name: string;
  sql: string;
  isTemplate?: boolean;
  lastExecutedAt?: string;
  lastRowCount?: number;
  lastExecutionTimeMs?: number;
  lastError?: string;
}

interface DashboardSummary {
  totalRevenue: number;
  totalOrders: number;
  activeProducts: number;
  lowStockAlerts: number;
  newCustomers: number;
}

interface DashboardPlatform {
  name: string;
  orders: number;
  revenue: string;
  color: string;
  status: string;
}

interface DashboardRecentOrder {
  id: string;
  platform: string;
  customer: string;
  total: number;
  status: string;
  time: string;
}

interface DashboardLowStockItem {
  name: string;
  sku: string;
  stock: number;
  reorder: number;
}

function StatCard({ title, value, change, sub, color }: { title: string; value: string; change?: string; sub?: string; color?: string }) {
  const positive = change?.startsWith("+");
  return (
    <div className="erp-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium" style={{ color: "#64748b" }}>{title}</p>
        {change && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
            background: positive ? "#dcfce7" : "#fee2e2",
            color: positive ? "#166534" : "#991b1b"
          }}>
            {change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold" style={{ color: color || "#0f172a" }}>{value}</p>
      {sub && <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [savedQueries, setSavedQueries] = useState<DashboardSavedQuery[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalRevenue: 0, totalOrders: 0, activeProducts: 0, lowStockAlerts: 0, newCustomers: 0,
  });
  const [platforms, setPlatforms] = useState<DashboardPlatform[]>([
    { name: "Shopify", orders: 0, revenue: "RM 0", color: "#96BF48", status: "Connected" },
    { name: "TikTok", orders: 0, revenue: "RM 0", color: "#010101", status: "Connected" },
    { name: "Shopee", orders: 0, revenue: "RM 0", color: "#EE4D2D", status: "Connected" },
    { name: "Lazada", orders: 0, revenue: "RM 0", color: "#0F146D", status: "Connected" },
    { name: "Amazon", orders: 0, revenue: "RM 0", color: "#FF9900", status: "Connected" },
  ]);
  const [recentOrders, setRecentOrders] = useState<DashboardRecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<DashboardLowStockItem[]>([]);
  const [revenueData, setRevenueData] = useState<{ date: string; Shopify: number; TikTok: number; Shopee: number; Lazada: number; Amazon: number }[]>([]);
  const [platformDistribution, setPlatformDistribution] = useState<{ name: string; value: number; color: string }[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<{ status: string; count: number }[]>([]);

  useEffect(() => {
    // Load saved SQL queries from localStorage
    try {
      const stored = localStorage.getItem("erp-sql-saved-queries");
      if (stored) {
        const queries = JSON.parse(stored) as DashboardSavedQuery[];
        setSavedQueries(queries.filter((q) => !q.isTemplate));
      }
    } catch {
      // Ignore parse errors
    }

    // Fetch dashboard data from API
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          const data = json.data;
          if (data.summary) {
            setSummary(data.summary);
          }
          if (data.platforms) {
            setPlatforms(data.platforms);
          }
          if (data.recentOrders) {
            setRecentOrders(data.recentOrders);
          }
          if (data.lowStockItems) {
            setLowStockItems(data.lowStockItems);
          }
          if (data.revenueData) {
            setRevenueData(data.revenueData);
          }
          if (data.platformDistribution) {
            setPlatformDistribution(data.platformDistribution);
          }
          if (data.ordersByStatus) {
            setOrdersByStatus(data.ordersByStatus);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="Overview"
        actions={
          <div className="flex gap-2">
            <select className="erp-input text-sm py-2" style={{ width: "auto" }}>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>This month</option>
            </select>
            <button className="erp-btn erp-btn-primary text-sm">
              Sync All Channels
            </button>
          </div>
        }
      />

      <div className="p-8 fade-in">
        {loading ? (
          <div className="p-8 text-center" style={{ color: "#94a3b8" }}>
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-5 mb-8">
              <StatCard title="Total Revenue (MYR)" value={`RM ${summary.totalRevenue.toLocaleString()}`} sub="vs last week" />
              <StatCard title="Total Orders" value={String(summary.totalOrders)} sub="Across all channels" />
              <StatCard title="Active Products" value={String(summary.activeProducts)} sub={`In ${platforms.filter((p) => p.status === "Connected").length} channels`} />
              <StatCard title="Low Stock Alerts" value={String(summary.lowStockAlerts)} sub="Need reorder" />
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-5 gap-3 mb-8">
              {platforms.map((p) => (
                <div key={p.name} className="erp-card text-center" style={{ borderTop: `3px solid ${p.color}` }}>
                  <div className="text-sm font-semibold mb-1" style={{ color: "#374151" }}>{p.name}</div>
                  <div className="text-lg font-bold" style={{ color: "#0f172a" }}>{p.orders}</div>
                  <div className="text-xs" style={{ color: "#64748b" }}>orders</div>
                  <div className="text-sm font-medium mt-1" style={{ color: p.color }}>{p.revenue}</div>
                  <div className="mt-2">
                    <span className="badge" style={{ background: "#dcfce7", color: "#166534", fontSize: "10px" }}>
                      ● {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              {/* Revenue Chart */}
              <div className="erp-card col-span-2">
                <h3 className="font-semibold mb-4" style={{ color: "#0f172a" }}>Revenue by Channel (Last 7 days)</h3>
                {revenueData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `RM${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(value) => [`RM ${value}`, ""]} />
                      <Legend />
                      {Object.entries(PLATFORM_COLORS).map(([platform, color]) => (
                        <Line key={platform} type="monotone" dataKey={platform === "TIKTOK" ? "TikTok" : platform.charAt(0) + platform.slice(1).toLowerCase()} stroke={color} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center" style={{ height: 260, color: "#94a3b8" }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">📊</div>
                      <div className="text-sm">No revenue data yet</div>
                      <div className="text-xs mt-1">Connect your channels to start tracking</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Platform Distribution */}
              <div className="erp-card">
                <h3 className="font-semibold mb-4" style={{ color: "#0f172a" }}>Order Distribution</h3>
                {platformDistribution.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={platformDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value">
                          {platformDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`${v}%`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-2 mt-2">
                      {platformDistribution.map((p) => (
                        <div key={p.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                            <span style={{ color: "#374151" }}>{p.name}</span>
                          </div>
                          <span className="font-medium" style={{ color: "#0f172a" }}>{p.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center" style={{ height: 260, color: "#94a3b8" }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🥧</div>
                      <div className="text-sm">No orders yet</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Orders by Status + Bottom Row */}
            <div className="grid grid-cols-3 gap-5 mb-8">
              <div className="erp-card">
                <h3 className="font-semibold mb-4" style={{ color: "#0f172a" }}>Orders by Status</h3>
                {ordersByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ordersByStatus} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis type="category" dataKey="status" tick={{ fontSize: 12, fill: "#94a3b8" }} width={70} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center" style={{ height: 200, color: "#94a3b8" }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">📋</div>
                      <div className="text-sm">No orders yet</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="erp-card col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: "#0f172a" }}>Recent Orders</h3>
                  <a href="/orders" className="text-sm" style={{ color: "#2563eb" }}>View all</a>
                </div>
                {recentOrders.length > 0 ? (
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Channel</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="font-mono text-xs" style={{ color: "#2563eb" }}>{order.id}</td>
                          <td>
                            <span className={`badge ${platformColors[order.platform]}`} style={{ fontSize: "11px" }}>
                              {order.platform === "TIKTOK" ? "TikTok" : order.platform.charAt(0) + order.platform.slice(1).toLowerCase()}
                            </span>
                          </td>
                          <td style={{ color: "#374151" }}>{order.customer}</td>
                          <td className="font-medium" style={{ color: "#0f172a" }}>RM {order.total.toFixed(2)}</td>
                          <td>
                            <span className="badge" style={{ background: statusColors[order.status]?.bg, color: statusColors[order.status]?.color, fontSize: "11px" }}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex items-center justify-center py-12" style={{ color: "#94a3b8" }}>
                    <div className="text-center">
                      <div className="text-3xl mb-2">📦</div>
                      <div className="text-sm">No recent orders</div>
                      <div className="text-xs mt-1">Orders will appear here once placed</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Low Stock */}
            <div className="erp-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: "#0f172a" }}>Low Stock Alerts</h3>
                <a href="/inventory" className="text-sm" style={{ color: "#2563eb" }}>Manage Inventory</a>
              </div>
              {lowStockItems.length > 0 ? (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Current Stock</th>
                      <th>Reorder Point</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item.sku}>
                        <td className="font-medium" style={{ color: "#0f172a" }}>{item.name}</td>
                        <td className="font-mono text-xs" style={{ color: "#64748b" }}>{item.sku}</td>
                        <td>
                          <span className="font-bold" style={{ color: item.stock <= 3 ? "#dc2626" : "#d97706" }}>
                            {item.stock} units
                          </span>
                        </td>
                        <td style={{ color: "#64748b" }}>{item.reorder} units</td>
                        <td>
                          <button className="erp-btn erp-btn-primary text-xs py-1.5 px-3">
                            Reorder
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center py-8" style={{ color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-3xl mb-2">✅</div>
                    <div className="text-sm">No low stock alerts</div>
                    <div className="text-xs mt-1">All products are well stocked</div>
                  </div>
                </div>
              )}
            </div>

            {/* Saved SQL Queries */}
            {savedQueries.length > 0 && (
              <div className="erp-card mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold" style={{ color: "#0f172a" }}>
                    Saved SQL Queries
                  </h3>
                  <a href="/sql-console" className="text-sm" style={{ color: "#2563eb" }}>
                    Open SQL Console →
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {savedQueries.map((query) => (
                    <a
                      key={query.id}
                      href={`/sql-console?queryId=${query.id}`}
                      className="block p-4 rounded-lg transition-all"
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#2563eb";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Header: Name + Status Badge */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: "#0f172a" }}>
                          {query.name}
                        </span>
                        {query.lastExecutedAt && (
                          <span
                            className="badge"
                            style={{
                              background: query.lastError ? "#fee2e2" : "#dcfce7",
                              color: query.lastError ? "#991b1b" : "#166534",
                              fontSize: "10px",
                              padding: "1px 8px",
                            }}
                          >
                            {query.lastError ? "Error" : "OK"}
                          </span>
                        )}
                      </div>

                      {/* SQL Preview */}
                      <div
                        className="font-mono text-xs mb-3 overflow-hidden"
                        style={{
                          color: "#64748b",
                          maxHeight: "34px",
                          lineHeight: "1.4",
                        }}
                      >
                        {query.sql
                          .split("\n")
                          .filter((l) => !l.trim().startsWith("--"))
                          .join(" ")
                          .replace(/\s+/g, " ")
                          .trim()
                          .substring(0, 80)}
                        ...
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-xs" style={{ color: "#94a3b8" }}>
                        {query.lastExecutedAt ? (
                          <>
                            <span>
                              {new Date(query.lastExecutedAt).toLocaleDateString()}{" "}
                              {new Date(query.lastExecutedAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            {query.lastRowCount !== undefined && (
                              <span style={{ color: "#16a34a" }}>
                                {query.lastRowCount} rows
                              </span>
                            )}
                            {query.lastExecutionTimeMs !== undefined && (
                              <span>{query.lastExecutionTimeMs}ms</span>
                            )}
                          </>
                        ) : (
                          <span>Not yet executed</span>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
