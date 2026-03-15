"use client";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";

type WarehouseName = "Main Warehouse (KL)" | "Backup Store (PJ)" | "Fulfillment Center (SG)";
const WAREHOUSES: WarehouseName[] = ["Main Warehouse (KL)", "Backup Store (PJ)", "Fulfillment Center (SG)"];

const DEMO_INVENTORY: {
  id: string; sku: string; name: string; category: string;
  warehouses: Record<string, number>;
  reorderPoint: number; reorderQty: number; reserved: number; lastMovement: string;
}[] = [];

const MOVEMENTS: {
  date: string; sku: string; type: string; qty: number; reason: string; warehouse: string;
}[] = [];

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("ALL");
  const [tab, setTab] = useState<"stock" | "movements" | "low-stock">("stock");
  const [adjustModal, setAdjustModal] = useState<string | null>(null);

  const getTotal = (item: typeof DEMO_INVENTORY[0]) =>
    Object.values(item.warehouses).reduce((a, b) => a + b, 0);

  const filtered = DEMO_INVENTORY.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const lowStockItems = DEMO_INVENTORY.filter((item) => getTotal(item) <= item.reorderPoint);

  return (
    <div>
      <TopBar
        title="Inventory"
        subtitle="Track stock levels across all warehouses"
        actions={
          <div className="flex gap-2">
            <button className="erp-btn erp-btn-secondary text-sm">Export</button>
            <button className="erp-btn erp-btn-primary text-sm">+ Adjustment</button>
          </div>
        }
      />

      <div className="p-8 fade-in">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Total SKUs</div>
            <div className="text-3xl font-bold" style={{ color: "#0f172a" }}>{DEMO_INVENTORY.length}</div>
            <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>Across 3 warehouses</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Total Units</div>
            <div className="text-3xl font-bold" style={{ color: "#0f172a" }}>
              {DEMO_INVENTORY.reduce((acc, item) => acc + getTotal(item), 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>All locations</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#64748b" }}>Reserved</div>
            <div className="text-3xl font-bold" style={{ color: "#d97706" }}>
              {DEMO_INVENTORY.reduce((acc, item) => acc + item.reserved, 0)}
            </div>
            <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>Pending fulfillment</div>
          </div>
          <div className="erp-card">
            <div className="text-sm font-medium mb-1" style={{ color: "#dc2626" }}>Low Stock</div>
            <div className="text-3xl font-bold" style={{ color: "#dc2626" }}>{lowStockItems.length}</div>
            <div className="text-xs mt-1" style={{ color: "#94a3b8" }}>Below reorder point</div>
          </div>
        </div>

        {/* Warehouse Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {WAREHOUSES.map((wh) => {
            const total = DEMO_INVENTORY.reduce((acc, item) => acc + (item.warehouses[wh as keyof typeof item.warehouses] || 0), 0);
            return (
              <div key={wh} className="erp-card">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm" style={{ color: "#374151" }}>{wh}</span>
                </div>
                <div className="text-2xl font-bold" style={{ color: "#0f172a" }}>{total}</div>
                <div className="text-xs" style={{ color: "#94a3b8" }}>units in stock</div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: "#f1f5f9", width: "fit-content" }}>
          {[{ key: "stock", label: "Stock Levels" }, { key: "movements", label: "Movements" }, { key: "low-stock", label: `Low Stock (${lowStockItems.length})` }].map((t) => (
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

        {/* Stock Table */}
        {tab === "stock" && (
          <div>
            <div className="flex gap-3 mb-4">
              <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="erp-input" style={{ maxWidth: "320px" }} />
              <select className="erp-input" style={{ width: "200px" }} value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)}>
                <option value="ALL">All Warehouses</option>
                {WAREHOUSES.map((wh) => <option key={wh}>{wh}</option>)}
              </select>
            </div>
            <div className="erp-card p-0 overflow-hidden">
              {filtered.length > 0 ? (
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product / SKU</th>
                      <th>Category</th>
                      {WAREHOUSES.map((wh) => <th key={wh}>{wh.split(" ")[0]} {wh.split(" ")[1]}</th>)}
                      <th>Total</th>
                      <th>Reserved</th>
                      <th>Available</th>
                      <th>Reorder Point</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const total = getTotal(item);
                      const available = total - item.reserved;
                      const isLow = total <= item.reorderPoint;
                      return (
                        <tr key={item.id}>
                          <td>
                            <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{item.name}</div>
                            <div className="text-xs font-mono" style={{ color: "#94a3b8" }}>{item.sku}</div>
                          </td>
                          <td className="text-sm" style={{ color: "#374151" }}>{item.category}</td>
                          {WAREHOUSES.map((wh) => (
                            <td key={wh} className="text-sm font-medium" style={{ color: (item.warehouses[wh] || 0) === 0 ? "#94a3b8" : "#374151" }}>
                              {item.warehouses[wh] || 0}
                            </td>
                          ))}
                          <td className="font-bold text-sm" style={{ color: isLow ? "#dc2626" : "#0f172a" }}>{total}</td>
                          <td className="text-sm" style={{ color: "#d97706" }}>{item.reserved}</td>
                          <td className="font-medium text-sm" style={{ color: available <= 5 ? "#dc2626" : "#16a34a" }}>{available}</td>
                          <td className="text-sm" style={{ color: "#64748b" }}>{item.reorderPoint}</td>
                          <td>
                            <div className="flex gap-1">
                              <button onClick={() => setAdjustModal(item.sku)} className="erp-btn erp-btn-secondary text-xs py-1 px-2">Adjust</button>
                              {isLow && <button className="erp-btn erp-btn-primary text-xs py-1 px-2">Reorder</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center py-16" style={{ color: "#94a3b8" }}>
                  <div className="text-center">
                    <div className="text-4xl mb-3">📦</div>
                    <div className="text-base font-medium mb-1">No inventory items yet</div>
                    <div className="text-sm">Add products to start tracking stock levels</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Movements */}
        {tab === "movements" && (
          <div className="erp-card p-0 overflow-hidden">
            {MOVEMENTS.length > 0 ? (
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>SKU</th>
                    <th>Type</th>
                    <th>Quantity</th>
                    <th>Warehouse</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {MOVEMENTS.map((m, idx) => (
                    <tr key={idx}>
                      <td className="text-xs" style={{ color: "#64748b" }}>{m.date}</td>
                      <td className="font-mono text-xs" style={{ color: "#2563eb" }}>{m.sku}</td>
                      <td>
                        <span className="badge text-xs" style={{
                          background: m.type === "IN" ? "#dcfce7" : m.type === "OUT" ? "#fee2e2" : "#ede9fe",
                          color: m.type === "IN" ? "#166534" : m.type === "OUT" ? "#991b1b" : "#5b21b6"
                        }}>
                          {m.type}
                        </span>
                      </td>
                      <td className="font-bold text-sm" style={{ color: m.qty > 0 ? "#16a34a" : "#dc2626" }}>
                        {m.qty > 0 ? "+" : ""}{m.qty}
                      </td>
                      <td className="text-sm" style={{ color: "#374151" }}>{m.warehouse}</td>
                      <td className="text-sm" style={{ color: "#64748b" }}>{m.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-16" style={{ color: "#94a3b8" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">📋</div>
                  <div className="text-base font-medium mb-1">No movements recorded</div>
                  <div className="text-sm">Stock movements will appear here</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Low Stock */}
        {tab === "low-stock" && (
          <div className="erp-card p-0 overflow-hidden">
            {lowStockItems.length > 0 ? (
              <>
                <div className="p-4 border-b" style={{ background: "#fef3c7", borderColor: "#fde68a" }}>
                  <p className="text-sm font-medium" style={{ color: "#92400e" }}>
                    {lowStockItems.length} items are at or below their reorder point. Take action to prevent stockouts.
                  </p>
                </div>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Current Stock</th>
                      <th>Reorder Point</th>
                      <th>Suggested Order</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{item.name}</div>
                          <div className="text-xs font-mono" style={{ color: "#94a3b8" }}>{item.sku}</div>
                        </td>
                        <td>
                          <span className="font-bold text-lg" style={{ color: "#dc2626" }}>{getTotal(item)}</span>
                          <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>units</span>
                        </td>
                        <td style={{ color: "#64748b" }}>{item.reorderPoint} units</td>
                        <td style={{ color: "#374151" }}>{item.reorderQty} units</td>
                        <td>
                          <button className="erp-btn erp-btn-primary text-sm">Create Purchase Order</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="flex items-center justify-center py-16" style={{ color: "#94a3b8" }}>
                <div className="text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="text-base font-medium mb-1">All stock levels healthy</div>
                  <div className="text-sm">No items below reorder point</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Adjust Modal */}
        {adjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="erp-card w-96">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Stock Adjustment</h3>
                <button onClick={() => setAdjustModal(null)} style={{ color: "#94a3b8", fontSize: "20px" }}>×</button>
              </div>
              <div className="text-sm mb-4" style={{ color: "#64748b" }}>SKU: <span className="font-mono font-medium" style={{ color: "#2563eb" }}>{adjustModal}</span></div>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Warehouse</label>
                  <select className="erp-input">
                    {WAREHOUSES.map((wh) => <option key={wh}>{wh}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Adjustment Type</label>
                  <select className="erp-input">
                    <option value="IN">Add Stock (IN)</option>
                    <option value="OUT">Remove Stock (OUT)</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Quantity</label>
                  <input type="number" className="erp-input" placeholder="0" min="1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Reason</label>
                  <input type="text" className="erp-input" placeholder="e.g. Purchase order #123" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="erp-btn erp-btn-primary flex-1 justify-center">Apply Adjustment</button>
                  <button onClick={() => setAdjustModal(null)} className="erp-btn erp-btn-secondary flex-1 justify-center">Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
