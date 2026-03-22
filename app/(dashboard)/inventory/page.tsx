"use client";

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, ArrowDown, RefreshCw, Search } from 'lucide-react';

const LOW_STOCK_THRESHOLD = 20;

type InventoryItem = {
  product: { sku: string; name: string; category: string };
  variant: { sku: string; name: string };
  warehouse: { name: string; code: string };
  quantity: number;
  movements: unknown[];
};

type Warehouse = {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
};

type Movement = {
  date: string;
  sku: string;
  type: string;
  qty: number;
  reason: string;
  warehouse: string;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

function getStockStatus(quantity: number) {
  if (quantity === 0) return { label: 'Out of Stock', color: '#8AAFC8', bg: '#F0F5FF' };
  if (quantity < LOW_STOCK_THRESHOLD) return { label: 'Low Stock', color: '#6D8196', bg: '#E8F0FF' };
  if (quantity > 200) return { label: 'Overstocked', color: '#000080', bg: '#E8F0FF' };
  return { label: 'Normal', color: '#4A7B5F', bg: '#EEF5F1' };
}

function StockBar({ current, max }: { current: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const warn = current < LOW_STOCK_THRESHOLD;
  return (
    <div className="relative h-1.5 w-full" style={{ background: '#EEF5FF', minWidth: 80 }}>
      <div
        className="absolute left-0 top-0 h-full transition-all"
        style={{
          width: `${pct}%`,
          background: current === 0 ? '#C8DFF0' : warn ? '#6D8196' : '#ADD8E6',
        }}
      />
    </div>
  );
}

type TabKey = 'stock' | 'movements' | 'lowstock';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('stock');

  const fetchInventory = useCallback(async (page = 1, searchTerm = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/inventory?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setItems(json.data.items ?? []);
        setWarehouses(json.data.warehouses ?? []);
        setMovements(json.data.movements ?? []);
        setPagination(json.data.pagination ?? { page: 1, limit: 50, total: 0, pages: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory(1, search);
  }, [fetchInventory, search]);

  const handleSearch = () => {
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const lowStockItems = items.filter((i) => i.quantity > 0 && i.quantity < LOW_STOCK_THRESHOLD);
  const outOfStockItems = items.filter((i) => i.quantity === 0);
  const alerts = items.filter((i) => i.quantity < LOW_STOCK_THRESHOLD);
  const maxQty = items.length > 0 ? Math.max(...items.map((i) => i.quantity), 1) : 1;

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'stock', label: 'Stock Levels' },
    { key: 'movements', label: 'Movements' },
    { key: 'lowstock', label: 'Low Stock' },
  ];

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Warehouse</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Inventory
          </h1>
        </div>
        <button
          onClick={() => fetchInventory(pagination.page, search)}
          className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors"
          style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
        >
          <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          Sync Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total SKUs', value: loading ? '—' : pagination.total.toString() },
          { label: 'Low Stock Alerts', value: loading ? '—' : alerts.length.toString(), accent: true },
          { label: 'Out of Stock', value: loading ? '—' : outOfStockItems.length.toString() },
          { label: 'Warehouses', value: loading ? '—' : warehouses.length.toString() },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{s.label}</p>
            <p
              className="text-2xl mt-1"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                color: s.accent ? '#6D8196' : '#000080',
              }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Alert banner */}
      {!loading && alerts.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 mb-4"
          style={{ background: '#E8F0FF', border: '1px solid #ADD8E6' }}
        >
          <AlertTriangle size={13} style={{ color: '#6D8196' }} />
          <p className="text-[11px] tracking-wide" style={{ color: '#000080' }}>
            {alerts.length} items below low stock threshold — quantity under {LOW_STOCK_THRESHOLD}
          </p>
        </div>
      )}

      {/* Search bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8AAFC8' }} />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white outline-none"
            style={{ border: '1px solid #C8DFF0', color: '#1A2540', fontFamily: "'IBM Plex Sans', sans-serif" }}
          />
        </div>
        <button
          onClick={handleSearch}
          className="text-[10px] tracking-[0.1em] uppercase px-3 py-2 bg-white transition-colors"
          style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
        >
          Search
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="px-5 py-2.5 text-[10px] tracking-[0.12em] uppercase transition-colors"
            style={{
              color: activeTab === tab.key ? '#000080' : '#6D8196',
              borderBottom: activeTab === tab.key ? '2px solid #000080' : '2px solid transparent',
              background: 'transparent',
            }}
          >
            {tab.label}
            {tab.key === 'lowstock' && !loading && lowStockItems.length > 0 && (
              <span
                className="ml-2 px-1.5 py-0.5 text-[9px]"
                style={{ background: '#E8F0FF', color: '#6D8196' }}
              >
                {lowStockItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white flex items-center justify-center py-20" style={{ border: '1px solid #C8DFF0' }}>
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={18} className="animate-spin" style={{ color: '#8AAFC8' }} />
            <p className="text-xs tracking-wide" style={{ color: '#6D8196' }}>Loading inventory data...</p>
          </div>
        </div>
      )}

      {/* Stock Levels Tab */}
      {!loading && activeTab === 'stock' && (
        <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xs tracking-wide" style={{ color: '#6D8196' }}>No inventory data</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                    {['SKU', 'Product', 'Variant', 'Warehouse', 'Quantity', 'Level', 'Status'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                        style={{ color: '#6D8196' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const status = getStockStatus(item.quantity);
                    return (
                      <tr
                        key={`${item.product.sku}-${item.variant.sku}-${item.warehouse.code}-${idx}`}
                        className="transition-colors"
                        style={{ borderBottom: '1px solid #F5F9FF' }}
                      >
                        <td
                          className="px-5 py-3.5 text-[11px]"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                        >
                          {item.product.sku}
                        </td>
                        <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{item.product.name}</td>
                        <td className="px-5 py-3.5 text-[10px]" style={{ color: '#8AAFC8' }}>
                          {item.variant.name || '—'}
                        </td>
                        <td
                          className="px-5 py-3.5 text-[10px]"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8AAFC8' }}
                        >
                          {item.warehouse.name} / {item.warehouse.code}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-base"
                              style={{
                                fontFamily: "'IBM Plex Mono', monospace",
                                color: item.quantity === 0 ? '#8AAFC8' : item.quantity < LOW_STOCK_THRESHOLD ? '#6D8196' : '#000080',
                              }}
                            >
                              {item.quantity}
                            </span>
                            {item.quantity > 0 && item.quantity < LOW_STOCK_THRESHOLD && (
                              <ArrowDown size={11} style={{ color: '#6D8196' }} />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 w-28">
                          <StockBar current={item.quantity} max={maxQty} />
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                            style={{ color: status.color, background: status.bg }}
                          >
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{ borderTop: '1px solid #EEF5FF' }}
                >
                  <p className="text-[10px]" style={{ color: '#6D8196' }}>
                    Page {pagination.page} of {pagination.pages} — {pagination.total} items
                  </p>
                  <div className="flex gap-1">
                    <button
                      disabled={pagination.page <= 1}
                      onClick={() => fetchInventory(pagination.page - 1, search)}
                      className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase bg-white disabled:opacity-30"
                      style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
                    >
                      Prev
                    </button>
                    <button
                      disabled={pagination.page >= pagination.pages}
                      onClick={() => fetchInventory(pagination.page + 1, search)}
                      className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase bg-white disabled:opacity-30"
                      style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Movements Tab */}
      {!loading && activeTab === 'movements' && (
        <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
          {movements.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xs tracking-wide" style={{ color: '#6D8196' }}>No movement data</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                  {['Date', 'SKU', 'Type', 'Qty', 'Reason', 'Warehouse'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                      style={{ color: '#6D8196' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.map((m, idx) => (
                  <tr
                    key={`${m.sku}-${m.date}-${idx}`}
                    className="transition-colors"
                    style={{ borderBottom: '1px solid #F5F9FF' }}
                  >
                    <td
                      className="px-5 py-3.5 text-[10px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                    >
                      {new Date(m.date).toLocaleDateString()}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[11px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                    >
                      {m.sku}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                        style={{
                          color: m.type === 'IN' ? '#4A7B5F' : '#6D8196',
                          background: m.type === 'IN' ? '#EEF5F1' : '#E8F0FF',
                        }}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td
                      className="px-5 py-3.5 text-base"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: m.type === 'IN' ? '#4A7B5F' : '#000080',
                      }}
                    >
                      {m.type === 'IN' ? '+' : '-'}{m.qty}
                    </td>
                    <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{m.reason}</td>
                    <td
                      className="px-5 py-3.5 text-[10px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8AAFC8' }}
                    >
                      {m.warehouse}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Low Stock Tab */}
      {!loading && activeTab === 'lowstock' && (
        <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
          {lowStockItems.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-xs tracking-wide" style={{ color: '#6D8196' }}>No low stock items</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                  {['SKU', 'Product', 'Warehouse', 'Quantity', 'Level', 'Status'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                      style={{ color: '#6D8196' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item, idx) => {
                  const status = getStockStatus(item.quantity);
                  return (
                    <tr
                      key={`low-${item.product.sku}-${item.warehouse.code}-${idx}`}
                      className="transition-colors"
                      style={{ borderBottom: '1px solid #F5F9FF' }}
                    >
                      <td
                        className="px-5 py-3.5 text-[11px]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                      >
                        {item.product.sku}
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{item.product.name}</td>
                      <td
                        className="px-5 py-3.5 text-[10px]"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8AAFC8' }}
                      >
                        {item.warehouse.name} / {item.warehouse.code}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-base"
                            style={{
                              fontFamily: "'IBM Plex Mono', monospace",
                              color: '#6D8196',
                            }}
                          >
                            {item.quantity}
                          </span>
                          <ArrowDown size={11} style={{ color: '#6D8196' }} />
                        </div>
                      </td>
                      <td className="px-5 py-3.5 w-28">
                        <StockBar current={item.quantity} max={maxQty} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                          style={{ color: status.color, background: status.bg }}
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
