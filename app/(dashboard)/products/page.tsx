"use client";
import { useState, useEffect, useCallback } from "react";
import TopBar from "@/components/layout/TopBar";

type ProductType = {
  id: string; sku: string; name: string; category: string; brand: string;
  costPrice: number; variants: number;
  channels: Record<string, number>;
  stock: Record<string, number>; isActive: boolean; image: string;
};

const ALL_PLATFORMS = ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"];

const platformBadge: Record<string, { bg: string; color: string }> = {
  SHOPIFY: { bg: "#f0fdf4", color: "#166534" },
  TIKTOK: { bg: "#0f172a", color: "#fff" },
  SHOPEE: { bg: "#fff7ed", color: "#9a3412" },
  LAZADA: { bg: "#eff6ff", color: "#1e40af" },
  AMAZON: { bg: "#fffbeb", color: "#92400e" },
};

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selected, setSelected] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductType[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      if (search) params.set("search", search);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (json.success) {
        setProducts(json.data.products);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = ["ALL", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const selectedProduct = products.find((p) => p.id === selected);

  const totalProducts = pagination.total || products.length;
  const activeCount = products.filter((p) => p.isActive).length;
  const totalVariants = products.reduce((a, p) => a + (p.variants || 0), 0);
  const lowStockCount = products.filter((p) => Object.values(p.stock).reduce((a, b) => a + b, 0) < 10).length;
  const channelsListed = new Set(products.flatMap((p) => Object.keys(p.channels))).size || 0;

  return (
    <div>
      <TopBar
        title="Products"
        subtitle="Manage your product catalog across all channels"
        actions={
          <div className="flex gap-2">
            <button className="erp-btn erp-btn-secondary text-sm">Import Products</button>
            <button className="erp-btn erp-btn-primary text-sm">+ Add Product</button>
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
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { label: "Total Products", value: String(totalProducts) },
                { label: "Active", value: String(activeCount) },
                { label: "Total Variants", value: String(totalVariants) },
                { label: "Low Stock", value: String(lowStockCount) },
                { label: "Channels Listed", value: String(channelsListed || 5) },
              ].map((s) => (
                <div key={s.label} className="erp-card text-center">
                  <div className="text-2xl font-bold" style={{ color: "#0f172a" }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex gap-3 mb-5">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="erp-input"
                style={{ maxWidth: "320px" }}
              />
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className="erp-btn erp-btn-secondary text-sm py-2"
                    style={{
                      background: categoryFilter === cat ? "#2563eb" : undefined,
                      color: categoryFilter === cat ? "white" : undefined,
                      borderColor: categoryFilter === cat ? "#2563eb" : undefined,
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-5">
              {/* Product Table */}
              <div className="erp-card flex-1 p-0 overflow-hidden">
                {filtered.length > 0 ? (
                  <table className="erp-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Cost</th>
                        <th>Channels & Prices</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((product) => {
                        const totalStock = Object.values(product.stock).reduce((a, b) => a + b, 0);
                        const isLowStock = totalStock < 10;
                        return (
                          <tr
                            key={product.id}
                            style={{ cursor: "pointer", background: selected === product.id ? "#eff6ff" : undefined }}
                            onClick={() => setSelected(selected === product.id ? null : product.id)}
                          >
                            <td>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{ background: "#f8fafc" }}>
                                  {product.image}
                                </div>
                                <div>
                                  <div className="font-medium text-sm" style={{ color: "#0f172a" }}>{product.name}</div>
                                  <div className="text-xs" style={{ color: "#94a3b8" }}>{product.brand}</div>
                                </div>
                              </div>
                            </td>
                            <td className="font-mono text-xs" style={{ color: "#64748b" }}>{product.sku}</td>
                            <td className="text-sm" style={{ color: "#374151" }}>{product.category}</td>
                            <td className="font-medium text-sm" style={{ color: "#0f172a" }}>RM {product.costPrice.toFixed(2)}</td>
                            <td>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(product.channels).map(([platform, price]) => (
                                  <span key={platform} className="badge text-xs px-1.5 py-0.5" style={{ ...platformBadge[platform], fontSize: "10px" }}>
                                    {platform === "TIKTOK" ? "TT" : platform.charAt(0) + platform.slice(1, 2).toLowerCase()}
                                    {" "}RM{price}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td>
                              <span style={{ color: isLowStock ? "#dc2626" : "#16a34a", fontWeight: "600", fontSize: "14px" }}>
                                {totalStock}
                              </span>
                              <span className="text-xs ml-1" style={{ color: "#94a3b8" }}>units</span>
                            </td>
                            <td>
                              <span className="badge text-xs" style={product.isActive ? { bg: "#dcfce7", color: "#166534" } as React.CSSProperties : { bg: "#f1f5f9", color: "#475569" } as React.CSSProperties}>
                                <span style={{ background: product.isActive ? "#dcfce7" : "#f1f5f9", color: product.isActive ? "#166534" : "#475569", padding: "2px 8px", borderRadius: "9999px", fontSize: "11px" }}>
                                  {product.isActive ? "Active" : "Inactive"}
                                </span>
                              </span>
                            </td>
                            <td>
                              <div className="flex gap-1">
                                <button className="erp-btn erp-btn-secondary text-xs py-1 px-2">Edit</button>
                                <button className="erp-btn erp-btn-secondary text-xs py-1 px-2">Sync</button>
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
                      <div className="text-4xl mb-3">🏷️</div>
                      <div className="text-base font-medium mb-1">No products yet</div>
                      <div className="text-sm">Add products or import from your channels</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detail Panel */}
              {selectedProduct && (
                <div className="erp-card w-80 flex-shrink-0" style={{ alignSelf: "flex-start" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold" style={{ color: "#0f172a" }}>Product Details</h3>
                    <button onClick={() => setSelected(null)} style={{ color: "#94a3b8", fontSize: "20px" }}>×</button>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-6xl mb-2">{selectedProduct.image}</div>
                    <div className="font-semibold" style={{ color: "#0f172a" }}>{selectedProduct.name}</div>
                    <div className="text-xs font-mono mt-1" style={{ color: "#94a3b8" }}>{selectedProduct.sku}</div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: "#64748b" }}>Category</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#64748b" }}>Brand</span>
                      <span>{selectedProduct.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#64748b" }}>Cost Price</span>
                      <span className="font-medium">RM {selectedProduct.costPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: "#64748b" }}>Variants</span>
                      <span>{selectedProduct.variants}</span>
                    </div>

                    <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                      <div className="font-medium mb-2" style={{ color: "#374151" }}>Channel Prices</div>
                      {ALL_PLATFORMS.map((platform) => {
                        const price = selectedProduct.channels[platform as keyof typeof selectedProduct.channels];
                        return (
                          <div key={platform} className="flex items-center justify-between py-1">
                            <span className="badge text-xs" style={platformBadge[platform]}>
                              {platform}
                            </span>
                            {price ? (
                              <span className="font-medium">RM {price.toFixed(2)}</span>
                            ) : (
                              <span className="text-xs" style={{ color: "#94a3b8" }}>Not listed</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-3 border-t" style={{ borderColor: "#f1f5f9" }}>
                      <div className="font-medium mb-2" style={{ color: "#374151" }}>Stock by Warehouse</div>
                      {Object.entries(selectedProduct.stock).map(([wh, qty]) => (
                        <div key={wh} className="flex justify-between py-1 text-sm">
                          <span style={{ color: "#64748b" }}>{wh}</span>
                          <span className={`font-medium ${qty < 5 ? "text-red-600" : ""}`}>{qty} units</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 flex gap-2">
                      <button className="erp-btn erp-btn-primary text-xs flex-1 justify-center">Push to Channels</button>
                      <button className="erp-btn erp-btn-secondary text-xs flex-1 justify-center">Edit</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
