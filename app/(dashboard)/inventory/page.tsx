"use client";

import { AlertTriangle, ArrowDown, RefreshCw } from 'lucide-react';

const inventoryItems = [
  { sku: 'SKU-001', name: 'Batik Heritage Tote Bag', location: 'WH-A / Shelf 3', current: 234, min: 50, max: 300, reorderPoint: 60 },
  { sku: 'SKU-002', name: 'Pewter Desk Organizer', location: 'WH-A / Shelf 7', current: 12, min: 20, max: 150, reorderPoint: 25 },
  { sku: 'SKU-003', name: 'Traditional Songket Scarf', location: 'WH-B / Shelf 1', current: 89, min: 30, max: 200, reorderPoint: 40 },
  { sku: 'SKU-004', name: 'Ceramic Pour-Over Set', location: 'WH-B / Shelf 4', current: 0, min: 10, max: 80, reorderPoint: 15 },
  { sku: 'SKU-005', name: 'Rattan Woven Basket', location: 'WH-A / Shelf 2', current: 67, min: 20, max: 120, reorderPoint: 25 },
  { sku: 'SKU-006', name: 'Handmade Nyonya Pouch', location: 'WH-C / Shelf 1', current: 5, min: 15, max: 100, reorderPoint: 20 },
  { sku: 'SKU-007', name: 'Bamboo Cutting Board Set', location: 'WH-A / Shelf 9', current: 145, min: 30, max: 200, reorderPoint: 40 },
  { sku: 'SKU-008', name: 'Linen Throw Cushion Cover', location: 'WH-C / Shelf 5', current: 312, min: 50, max: 400, reorderPoint: 70 },
  { sku: 'SKU-009', name: 'Kopitiam Enamel Mug', location: 'WH-B / Shelf 2', current: 28, min: 30, max: 200, reorderPoint: 40 },
  { sku: 'SKU-010', name: 'Shibori Dyed Silk Shawl', location: 'WH-A / Shelf 5', current: 18, min: 10, max: 80, reorderPoint: 15 },
];

function getStockStatus(item: typeof inventoryItems[0]) {
  if (item.current === 0) return { label: 'Out of Stock', color: '#8AAFC8', bg: '#F0F5FF' };
  if (item.current <= item.reorderPoint) return { label: 'Reorder', color: '#6D8196', bg: '#E8F0FF' };
  if (item.current >= item.max * 0.9) return { label: 'Overstocked', color: '#000080', bg: '#E8F0FF' };
  return { label: 'Normal', color: '#4A7B5F', bg: '#EEF5F1' };
}

function StockBar({ current, min, max }: { current: number; min: number; max: number }) {
  const pct = Math.min((current / max) * 100, 100);
  const warn = current <= min * 1.25;
  return (
    <div className="relative h-1.5 w-full" style={{ background: '#EEF5FF', minWidth: 80 }}>
      <div
        className="absolute left-0 top-0 h-full transition-all"
        style={{
          width: `${pct}%`,
          background: current === 0 ? '#C8DFF0' : warn ? '#6D8196' : '#ADD8E6',
        }}
      />
      <div
        className="absolute top-0 h-full w-px"
        style={{ left: `${(min / max) * 100}%`, background: '#C8DFF0' }}
      />
    </div>
  );
}

export default function Inventory() {
  const alerts = inventoryItems.filter((i) => i.current <= i.reorderPoint);
  const totalValue = inventoryItems.reduce((sum, i) => sum + i.current * 180, 0);

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
          className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors"
          style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}
        >
          <RefreshCw size={11} />
          Sync Stock
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total SKUs', value: inventoryItems.length.toString() },
          { label: 'Reorder Alerts', value: alerts.length.toString(), accent: true },
          { label: 'Out of Stock', value: inventoryItems.filter((i) => i.current === 0).length.toString() },
          { label: 'Est. Stock Value', value: `RM ${(totalValue / 1000).toFixed(0)}k` },
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
      {alerts.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-3 mb-4"
          style={{ background: '#E8F0FF', border: '1px solid #ADD8E6' }}
        >
          <AlertTriangle size={13} style={{ color: '#6D8196' }} />
          <p className="text-[11px] tracking-wide" style={{ color: '#000080' }}>
            {alerts.length} items require reorder — stock below threshold
          </p>
        </div>
      )}

      {/* Inventory table */}
      <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
              {['SKU', 'Product', 'Location', 'Current Stock', 'Level', 'Min / Max', 'Status'].map((h) => (
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
            {inventoryItems.map((item) => {
              const status = getStockStatus(item);
              return (
                <tr
                  key={item.sku}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #F5F9FF' }}
                >
                  <td
                    className="px-5 py-3.5 text-[11px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                  >
                    {item.sku}
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{item.name}</td>
                  <td
                    className="px-5 py-3.5 text-[10px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8AAFC8' }}
                  >
                    {item.location}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-base"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: item.current === 0 ? '#8AAFC8' : item.current <= item.reorderPoint ? '#6D8196' : '#000080',
                        }}
                      >
                        {item.current}
                      </span>
                      {item.current <= item.reorderPoint && item.current > 0 && (
                        <ArrowDown size={11} style={{ color: '#6D8196' }} />
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 w-28">
                    <StockBar current={item.current} min={item.min} max={item.max} />
                  </td>
                  <td
                    className="px-5 py-3.5 text-[10px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#8AAFC8' }}
                  >
                    {item.min} / {item.max}
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
      </div>
    </div>
  );
}
