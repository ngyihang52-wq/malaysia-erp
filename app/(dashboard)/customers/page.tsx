"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";

const DEMO_CUSTOMERS: {
  id: string; name: string; email: string; phone: string; city: string;
  state: string; platform: string; orders: number; totalSpent: number;
  lastOrder: string; joined: string; lastOrderId: string;
}[] = [];

const platformBadge: Record<string, { bg: string; color: string }> = {
  SHOPIFY: { bg: "#f0fdf4", color: "#166534" },
  TIKTOK: { bg: "#0f172a", color: "#fff" },
  SHOPEE: { bg: "#fff7ed", color: "#9a3412" },
  LAZADA: { bg: "#eff6ff", color: "#1e40af" },
  AMAZON: { bg: "#fffbeb", color: "#92400e" },
};

function getTier(spent: number): { label: string; color: string } {
  if (spent >= 3000) return { label: "VIP", color: "#7c3aed" };
  if (spent >= 1500) return { label: "Gold", color: "#d97706" };
  if (spent >= 500) return { label: "Silver", color: "#64748b" };
  return { label: "Bronze", color: "#b45309" };
}

function downloadInvoice(customer: typeof DEMO_CUSTOMERS[0]) {
  const invoiceDate = new Date().toLocaleDateString("en-MY", { year: "numeric", month: "long", day: "numeric" });
  const avgOrder = customer.orders > 0 ? customer.totalSpent / customer.orders : 0;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Invoice - ${customer.lastOrderId}</title>
<style>
  body { font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 40px; color: #1e293b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
  .logo { font-size: 28px; font-weight: 800; color: #2563eb; }
  .logo-sub { font-size: 12px; color: #64748b; margin-top: 4px; }
  .invoice-title { text-align: right; }
  .invoice-title h2 { margin: 0; font-size: 24px; color: #0f172a; }
  .invoice-title p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
  .section { margin-bottom: 30px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .info-block p { margin: 3px 0; font-size: 14px; }
  .info-block .label { color: #64748b; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th { background: #f8fafc; text-align: left; padding: 10px 14px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; border-bottom: 1px solid #e2e8f0; }
  td { padding: 12px 14px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
  .text-right { text-align: right; }
  .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #2563eb; border-bottom: none; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #dcfce7; color: #166534; }
  @media print { body { padding: 20px; } }
</style></head><body>
<div class="header">
  <div><div class="logo">Malaysia ERP</div><div class="logo-sub">Multi-Channel Commerce</div></div>
  <div class="invoice-title"><h2>INVOICE</h2><p>${customer.lastOrderId}</p><p>${invoiceDate}</p></div>
</div>
<div class="section grid">
  <div class="info-block">
    <div class="section-title">Bill To</div>
    <p style="font-weight:600">${customer.name}</p>
    <p>${customer.email}</p>
    <p>${customer.phone}</p>
    <p>${customer.city}, ${customer.state}</p>
    <p>Malaysia</p>
  </div>
  <div class="info-block" style="text-align:right">
    <div class="section-title">Invoice Details</div>
    <p><span class="label">Order ID:</span> ${customer.lastOrderId}</p>
    <p><span class="label">Date:</span> ${customer.lastOrder}</p>
    <p><span class="label">Channel:</span> ${customer.platform}</p>
    <p><span class="label">Status:</span> <span class="badge">PAID</span></p>
  </div>
</div>
<div class="section">
  <div class="section-title">Order Summary</div>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th class="text-right">Unit Price</th><th class="text-right">Amount</th></tr></thead>
    <tbody>
      <tr><td>Order Items (${customer.platform} - ${customer.lastOrderId})</td><td>1</td><td class="text-right">RM ${avgOrder.toFixed(2)}</td><td class="text-right">RM ${avgOrder.toFixed(2)}</td></tr>
      <tr><td>Shipping Fee</td><td>—</td><td class="text-right">—</td><td class="text-right">RM 0.00</td></tr>
      <tr><td>Tax (0%)</td><td>—</td><td class="text-right">—</td><td class="text-right">RM 0.00</td></tr>
      <tr class="total-row"><td colspan="3" class="text-right">Total (MYR)</td><td class="text-right">RM ${avgOrder.toFixed(2)}</td></tr>
    </tbody>
  </table>
</div>
<div class="footer">
  <p>Thank you for your purchase!</p>
  <p>Malaysia ERP &middot; Multi-Channel Commerce &middot; Generated on ${invoiceDate}</p>
</div>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoice-${customer.lastOrderId}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = DEMO_CUSTOMERS.filter((c) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.city.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === "ALL" || c.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  const selectedCustomer = DEMO_CUSTOMERS.find((c) => c.id === selected);

  const totalRevenue = DEMO_CUSTOMERS.reduce((a, c) => a + c.totalSpent, 0);
  const totalOrderCount = DEMO_CUSTOMERS.reduce((a, c) => a + c.orders, 0);
  const avgOrderValue = totalOrderCount > 0 ? totalRevenue / totalOrderCount : 0;

  return (
    <div>
      <TopBar
        title="Customers"
        subtitle={`${DEMO_CUSTOMERS.length} registered customers`}
        actions={
          <button className="erp-btn erp-btn-secondary text-sm">Export CSV</button>
        }
      />

      <div className="p-8 fade-in">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Total Customers</div>
            <div className="text-3xl font-bold">{DEMO_CUSTOMERS.length}</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Total Revenue</div>
            <div className="text-3xl font-bold">RM {totalRevenue.toFixed(0)}</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Avg Order Value</div>
            <div className="text-3xl font-bold">RM {avgOrderValue.toFixed(2)}</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>VIP Customers</div>
            <div className="text-3xl font-bold" style={{ color: "#7c3aed" }}>
              {DEMO_CUSTOMERS.filter((c) => c.totalSpent >= 3000).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <input type="text" placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="erp-input" style={{ maxWidth: "320px" }} />
          <select className="erp-input" style={{ width: "180px" }} value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>
            <option value="ALL">All Channels</option>
            <option value="SHOPIFY">Shopify</option>
            <option value="TIKTOK">TikTok</option>
            <option value="SHOPEE">Shopee</option>
            <option value="LAZADA">Lazada</option>
            <option value="AMAZON">Amazon</option>
          </select>
        </div>

        <div className="flex gap-5">
          {/* Table */}
          <div className="erp-card flex-1 p-0 overflow-x-auto">
            {filtered.length > 0 ? (
              <table className="erp-table" style={{ minWidth: "900px" }}>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Location</th>
                    <th>Channel</th>
                    <th>Order ID</th>
                    <th>Orders</th>
                    <th>Total Spent</th>
                    <th>Tier</th>
                    <th>Last Order</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((customer) => {
                    const tier = getTier(customer.totalSpent);
                    return (
                      <tr
                        key={customer.id}
                        style={{ cursor: "pointer", background: selected === customer.id ? "#eff6ff" : undefined }}
                        onClick={() => setSelected(selected === customer.id ? null : customer.id)}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: "#2563eb" }}>
                              {customer.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{customer.name}</div>
                              <div className="text-xs" style={{ color: "#94a3b8" }}>{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-sm" style={{ color: "#374151" }}>{customer.city}</div>
                          <div className="text-xs" style={{ color: "#94a3b8" }}>{customer.state}</div>
                        </td>
                        <td>
                          <span className="badge text-xs" style={platformBadge[customer.platform]}>
                            {customer.platform}
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-xs" style={{ color: "#2563eb" }}>{customer.lastOrderId}</span>
                        </td>
                        <td className="font-medium text-sm">{customer.orders}</td>
                        <td className="font-semibold text-sm">RM {customer.totalSpent.toFixed(2)}</td>
                        <td>
                          <span className="badge text-xs font-semibold" style={{ background: `${tier.color}22`, color: tier.color }}>
                            {tier.label}
                          </span>
                        </td>
                        <td className="text-xs" style={{ color: "#64748b" }}>{customer.lastOrder}</td>
                        <td>
                          <button
                            className="erp-btn erp-btn-secondary text-xs py-1.5 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadInvoice(customer);
                            }}
                          >
                            Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-16" style={{ color: "#94a3b8" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">👥</div>
                  <div className="text-base font-medium mb-1">No customers yet</div>
                  <div className="text-sm">Customer profiles will appear as orders come in</div>
                </div>
              </div>
            )}
          </div>

          {/* Detail Panel */}
          {selectedCustomer && (
            <div className="erp-card w-72 flex-shrink-0" style={{ alignSelf: "flex-start" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Customer Profile</h3>
                <button onClick={() => setSelected(null)} style={{ color: "#94a3b8", fontSize: "20px" }}>×</button>
              </div>
              <div className="text-center mb-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2" style={{ background: "#2563eb" }}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="font-semibold" style={{ color: "#0f172a" }}>{selectedCustomer.name}</div>
                <span className="badge text-xs mt-1" style={{ background: `${getTier(selectedCustomer.totalSpent).color}22`, color: getTier(selectedCustomer.totalSpent).color }}>
                  {getTier(selectedCustomer.totalSpent).label} Member
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span style={{ color: "#374151" }}>{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#374151" }}>{selectedCustomer.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#374151" }}>{selectedCustomer.city}, {selectedCustomer.state}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "#64748b" }}>Member since {selectedCustomer.joined}</span>
                </div>
                <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-lg" style={{ background: "#f8fafc" }}>
                      <div className="text-xl font-bold" style={{ color: "#0f172a" }}>{selectedCustomer.orders}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>Orders</div>
                    </div>
                    <div className="text-center p-3 rounded-lg" style={{ background: "#f8fafc" }}>
                      <div className="text-base font-bold" style={{ color: "#0f172a" }}>RM {selectedCustomer.orders > 0 ? (selectedCustomer.totalSpent / selectedCustomer.orders).toFixed(0) : "0"}</div>
                      <div className="text-xs" style={{ color: "#64748b" }}>Avg Order</div>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg mt-3" style={{ background: "#eff6ff" }}>
                    <div className="text-xl font-bold" style={{ color: "#2563eb" }}>RM {selectedCustomer.totalSpent.toFixed(2)}</div>
                    <div className="text-xs" style={{ color: "#64748b" }}>Total Lifetime Value</div>
                  </div>
                </div>
                <div className="pt-3">
                  <div className="text-xs font-medium mb-1" style={{ color: "#64748b" }}>Primary Channel</div>
                  <span className="badge" style={platformBadge[selectedCustomer.platform]}>{selectedCustomer.platform}</span>
                </div>
                <button className="erp-btn erp-btn-secondary text-sm w-full justify-center mt-3">View All Orders</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
