"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";

const DEMO_ORDERS: {
  id: string; platform: string; customer: string; email: string; items: number;
  subtotal: number; shippingFee: number; discount: number; total: number;
  status: string; payment: string; tracking: string | null; date: string;
}[] = [];

const platformBadge: Record<string, { bg: string; color: string }> = {
  SHOPIFY: { bg: "#f0fdf4", color: "#166534" },
  TIKTOK: { bg: "#0f172a", color: "#fff" },
  SHOPEE: { bg: "#fff7ed", color: "#9a3412" },
  LAZADA: { bg: "#eff6ff", color: "#1e40af" },
  AMAZON: { bg: "#fffbeb", color: "#92400e" },
};

const statusStyle: Record<string, { bg: string; color: string }> = {
  PENDING: { bg: "#fef3c7", color: "#92400e" },
  CONFIRMED: { bg: "#dbeafe", color: "#1e40af" },
  PROCESSING: { bg: "#ede9fe", color: "#5b21b6" },
  SHIPPED: { bg: "#f0fdf4", color: "#166534" },
  DELIVERED: { bg: "#dcfce7", color: "#14532d" },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b" },
  RETURNED: { bg: "#fff7ed", color: "#9a3412" },
  REFUNDED: { bg: "#f1f5f9", color: "#475569" },
};

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = DEMO_ORDERS.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === "ALL" || o.platform === platformFilter;
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchPlatform && matchStatus;
  });

  const selectedOrder = DEMO_ORDERS.find((o) => o.id === selected);

  return (
    <div>
      <TopBar
        title="Orders"
        subtitle={`${DEMO_ORDERS.length} total orders across all channels`}
        actions={
          <button className="erp-btn erp-btn-primary text-sm">
            Sync Orders
          </button>
        }
      />

      <div className="p-8 fade-in">
        {/* Summary cards */}
        <div className="grid grid-cols-6 gap-4 mb-6">
          {[
            { label: "All", count: 0, color: "#2563eb" },
            { label: "Pending", count: 0, color: "#d97706" },
            { label: "Confirmed", count: 0, color: "#2563eb" },
            { label: "Shipped", count: 0, color: "#7c3aed" },
            { label: "Delivered", count: 0, color: "#16a34a" },
            { label: "Cancelled", count: 0, color: "#dc2626" },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => setStatusFilter(s.label === "All" ? "ALL" : s.label.toUpperCase())}
              className="erp-card text-center cursor-pointer transition-all hover:shadow-md"
              style={{ borderTop: `3px solid ${s.color}` }}
            >
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.count}</div>
              <div className="text-xs font-medium mt-1" style={{ color: "#64748b" }}>{s.label}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="erp-input"
            style={{ maxWidth: "320px" }}
          />
          <select className="erp-input" style={{ width: "160px" }} value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="ALL">All Channels</option>
            <option value="SHOPIFY">Shopify</option>
            <option value="TIKTOK">TikTok</option>
            <option value="SHOPEE">Shopee</option>
            <option value="LAZADA">Lazada</option>
            <option value="AMAZON">Amazon</option>
          </select>
          <select className="erp-input" style={{ width: "160px" }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="flex gap-5">
          {/* Table */}
          <div className="erp-card flex-1 p-0 overflow-hidden">
            {filtered.length > 0 ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      style={{ cursor: "pointer", background: selected === order.id ? "#eff6ff" : undefined }}
                      onClick={() => setSelected(selected === order.id ? null : order.id)}
                    >
                      <td className="font-mono text-xs font-medium" style={{ color: "#2563eb" }}>{order.id}</td>
                      <td>
                        <span className="badge text-xs" style={platformBadge[order.platform]}>
                          {order.platform === "TIKTOK" ? "TikTok" : order.platform.charAt(0) + order.platform.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td>
                        <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{order.customer}</div>
                        <div className="text-xs" style={{ color: "#94a3b8" }}>{order.email}</div>
                      </td>
                      <td className="text-sm" style={{ color: "#374151" }}>{order.items} items</td>
                      <td className="font-semibold text-sm" style={{ color: "#0f172a" }}>RM {order.total.toFixed(2)}</td>
                      <td>
                        <span className="badge text-xs" style={statusStyle[order.status]}>
                          {order.status}
                        </span>
                      </td>
                      <td className="text-xs" style={{ color: "#64748b" }}>{order.date}</td>
                      <td>
                        <button className="erp-btn erp-btn-secondary text-xs py-1 px-3">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-16" style={{ color: "#94a3b8" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">📦</div>
                  <div className="text-base font-medium mb-1">No orders yet</div>
                  <div className="text-sm">Orders from all channels will appear here</div>
                </div>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedOrder && (
            <div className="erp-card w-80 flex-shrink-0" style={{ alignSelf: "flex-start" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold" style={{ color: "#0f172a" }}>Order Details</h3>
                <button onClick={() => setSelected(null)} style={{ color: "#94a3b8", fontSize: "20px" }}>×</button>
              </div>
              <div className="font-mono text-sm font-medium mb-3" style={{ color: "#2563eb" }}>{selectedOrder.id}</div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: "#64748b" }}>Channel</span>
                  <span className="badge text-xs" style={platformBadge[selectedOrder.platform]}>
                    {selectedOrder.platform}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#64748b" }}>Status</span>
                  <span className="badge text-xs" style={statusStyle[selectedOrder.status]}>{selectedOrder.status}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "#64748b" }}>Payment</span>
                  <span className="font-medium" style={{ color: selectedOrder.payment === "PAID" ? "#16a34a" : "#d97706" }}>{selectedOrder.payment}</span>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <div className="font-medium mb-2" style={{ color: "#374151" }}>Customer</div>
                  <div style={{ color: "#0f172a" }}>{selectedOrder.customer}</div>
                  <div className="text-xs" style={{ color: "#94a3b8" }}>{selectedOrder.email}</div>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <div className="font-medium mb-2" style={{ color: "#374151" }}>Pricing</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#64748b" }}>Subtotal</span>
                      <span>RM {selectedOrder.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#64748b" }}>Shipping</span>
                      <span>RM {selectedOrder.shippingFee.toFixed(2)}</span>
                    </div>
                    {selectedOrder.discount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span style={{ color: "#64748b" }}>Discount</span>
                        <span style={{ color: "#16a34a" }}>-RM {selectedOrder.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold pt-1 border-t" style={{ borderColor: "#f1f5f9" }}>
                      <span>Total</span>
                      <span>RM {selectedOrder.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                {selectedOrder.tracking && (
                  <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                    <div className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>Tracking</div>
                    <div className="font-mono text-sm" style={{ color: "#2563eb" }}>{selectedOrder.tracking}</div>
                  </div>
                )}
                <div className="pt-3 flex gap-2">
                  {selectedOrder.status === "CONFIRMED" && (
                    <button className="erp-btn erp-btn-primary text-xs flex-1 justify-center">Ship Order</button>
                  )}
                  {selectedOrder.status === "PENDING" && (
                    <button className="erp-btn erp-btn-secondary text-xs flex-1 justify-center">Confirm</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
