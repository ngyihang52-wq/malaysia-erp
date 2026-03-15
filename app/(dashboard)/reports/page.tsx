"use client";
import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import TopBar from "@/components/layout/TopBar";

const MONTHLY_REVENUE: { month: string; Shopify: number; TikTok: number; Shopee: number; Lazada: number; Amazon: number }[] = [];

const TOP_PRODUCTS: { name: string; revenue: number; units: number; platform: string; margin: number }[] = [];

const STATE_REVENUE: { state: string; revenue: number; orders: number }[] = [];

const PLATFORM_PERF: { platform: string; revenue: number; orders: number; avgOrder: number; returnRate: number; color: string }[] = [];

const PLATFORMS_COLORS: Record<string, string> = {
  Shopify: "#96BF48",
  TikTok: "#010101",
  Shopee: "#EE4D2D",
  Lazada: "#0F146D",
  Amazon: "#FF9900",
};

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState("this-month");
  const [tab, setTab] = useState<"overview" | "products" | "channels" | "geography">("overview");

  const totalRevenue = PLATFORM_PERF.reduce((a, p) => a + p.revenue, 0);
  const totalOrders = PLATFORM_PERF.reduce((a, p) => a + p.orders, 0);
  const avgOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return (
    <div>
      <TopBar
        title="Reports & Analytics"
        subtitle="Business intelligence across all your channels"
        actions={
          <div className="flex gap-2">
            <select className="erp-input text-sm" style={{ width: "auto" }} value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value="today">Today</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-90">Last 90 Days</option>
              <option value="ytd">Year to Date</option>
            </select>
            <button className="erp-btn erp-btn-secondary text-sm">Export PDF</button>
            <button className="erp-btn erp-btn-secondary text-sm">Export CSV</button>
          </div>
        }
      />

      <div className="p-8 fade-in">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="erp-card">
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Total Revenue</div>
            <div className="text-3xl font-bold">RM 0</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs" style={{ color: "#94a3b8" }}>No data yet</span>
            </div>
          </div>
          <div className="erp-card">
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Total Orders</div>
            <div className="text-3xl font-bold">0</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs" style={{ color: "#94a3b8" }}>No data yet</span>
            </div>
          </div>
          <div className="erp-card">
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Avg Order Value</div>
            <div className="text-3xl font-bold">RM 0</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs" style={{ color: "#94a3b8" }}>No data yet</span>
            </div>
          </div>
          <div className="erp-card">
            <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#64748b" }}>Profit Margin</div>
            <div className="text-3xl font-bold">0%</div>
            <div className="flex items-center gap-1 mt-2">
              <span className="text-xs" style={{ color: "#94a3b8" }}>No data yet</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "#f1f5f9", width: "fit-content" }}>
          {[
            { key: "overview", label: "Overview" },
            { key: "products", label: "Products" },
            { key: "channels", label: "Channels" },
            { key: "geography", label: "Geography" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as typeof tab)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-all"
              style={{
                background: tab === t.key ? "white" : "transparent",
                color: tab === t.key ? "#0f172a" : "#64748b",
                boxShadow: tab === t.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="erp-card">
              <h3 className="font-semibold mb-4">Monthly Revenue by Channel (MYR)</h3>
              {MONTHLY_REVENUE.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={MONTHLY_REVENUE}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => [`RM ${v}`, ""]} />
                    <Legend />
                    {Object.entries(PLATFORMS_COLORS).map(([platform, color]) => (
                      <Area key={platform} type="monotone" dataKey={platform} stroke={color} fill={color} fillOpacity={0.1} strokeWidth={2} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center" style={{ height: 300, color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">📈</div>
                    <div className="text-base font-medium mb-1">No revenue data yet</div>
                    <div className="text-sm">Revenue trends will appear as sales come in</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products Tab */}
        {tab === "products" && (
          <div className="space-y-5">
            <div className="erp-card">
              <h3 className="font-semibold mb-4">Top Products by Revenue</h3>
              {TOP_PRODUCTS.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={TOP_PRODUCTS} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} width={160} />
                      <Tooltip formatter={(v) => [`RM ${v}`, ""]} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="erp-card p-0 overflow-hidden mt-5">
                    <table className="erp-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Revenue</th>
                          <th>Units Sold</th>
                          <th>Margin</th>
                          <th>Channels</th>
                        </tr>
                      </thead>
                      <tbody>
                        {TOP_PRODUCTS.map((p, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium" style={{ color: "#94a3b8" }}>#{idx + 1}</span>
                                <span className="font-medium text-sm" style={{ color: "#0f172a" }}>{p.name}</span>
                              </div>
                            </td>
                            <td className="font-semibold" style={{ color: "#0f172a" }}>RM {p.revenue.toLocaleString()}</td>
                            <td>{p.units} units</td>
                            <td>
                              <span className="font-medium" style={{ color: "#16a34a" }}>{p.margin}%</span>
                            </td>
                            <td className="text-xs" style={{ color: "#64748b" }}>{p.platform}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center" style={{ height: 250, color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">🏷️</div>
                    <div className="text-base font-medium mb-1">No product data yet</div>
                    <div className="text-sm">Product performance will appear as sales come in</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Channels Tab */}
        {tab === "channels" && (
          <div className="space-y-5">
            {PLATFORM_PERF.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-5">
                  <div className="erp-card">
                    <h3 className="font-semibold mb-4">Revenue by Platform</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie data={PLATFORM_PERF} cx="50%" cy="50%" outerRadius={90} dataKey="revenue" nameKey="platform" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                          {PLATFORM_PERF.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [`RM ${v}`, ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="erp-card">
                    <h3 className="font-semibold mb-4">Channel Performance</h3>
                    <div className="space-y-3">
                      {PLATFORM_PERF.map((p) => (
                        <div key={p.platform}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">{p.platform}</span>
                            <span>RM {(p.revenue / 1000).toFixed(1)}K</span>
                          </div>
                          <div className="h-2 rounded-full" style={{ background: "#f1f5f9" }}>
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%`, background: p.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="erp-card p-0 overflow-hidden">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Revenue</th>
                        <th>Orders</th>
                        <th>Avg Order</th>
                        <th>Return Rate</th>
                        <th>% of Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PLATFORM_PERF.map((p) => (
                        <tr key={p.platform}>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                              <span className="font-medium">{p.platform}</span>
                            </div>
                          </td>
                          <td className="font-semibold">RM {p.revenue.toLocaleString()}</td>
                          <td>{p.orders}</td>
                          <td>RM {p.avgOrder}</td>
                          <td>
                            <span style={{ color: p.returnRate > 3 ? "#dc2626" : "#16a34a" }}>{p.returnRate}%</span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 rounded-full flex-1" style={{ background: "#f1f5f9" }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0}%`, background: p.color }} />
                              </div>
                              <span className="text-xs w-8 text-right">{totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(0) : 0}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="erp-card">
                <h3 className="font-semibold mb-4">Channel Performance</h3>
                <div className="flex items-center justify-center" style={{ height: 250, color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">🔗</div>
                    <div className="text-base font-medium mb-1">No channel data yet</div>
                    <div className="text-sm">Channel analytics will appear as sales come in</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Geography Tab */}
        {tab === "geography" && (
          <div className="space-y-5">
            {STATE_REVENUE.length > 0 ? (
              <>
                <div className="erp-card">
                  <h3 className="font-semibold mb-4">Revenue by Malaysian State</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={STATE_REVENUE}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="state" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} tickFormatter={(v) => `RM${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => [`RM ${v}`, ""]} />
                      <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="erp-card p-0 overflow-hidden">
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>State</th>
                        <th>Revenue</th>
                        <th>Orders</th>
                        <th>Avg Order Value</th>
                        <th>% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STATE_REVENUE.map((s) => (
                        <tr key={s.state}>
                          <td className="font-medium">{s.state}</td>
                          <td className="font-semibold">RM {s.revenue.toLocaleString()}</td>
                          <td>{s.orders}</td>
                          <td>RM {s.orders > 0 ? (s.revenue / s.orders).toFixed(0) : 0}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 rounded-full flex-1" style={{ background: "#f1f5f9" }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${STATE_REVENUE[0]?.revenue > 0 ? (s.revenue / STATE_REVENUE[0].revenue) * 100 : 0}%`, background: "#2563eb" }} />
                              </div>
                              <span className="text-xs w-8 text-right">{(() => { const tot = STATE_REVENUE.reduce((a, r) => a + r.revenue, 0); return tot > 0 ? ((s.revenue / tot) * 100).toFixed(0) : 0; })()}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="erp-card">
                <h3 className="font-semibold mb-4">Revenue by Malaysian State</h3>
                <div className="flex items-center justify-center" style={{ height: 300, color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">🗺️</div>
                    <div className="text-base font-medium mb-1">No geographic data yet</div>
                    <div className="text-sm">Regional breakdown will appear as orders come in</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
