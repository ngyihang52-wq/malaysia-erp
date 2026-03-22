"use client";

import { useState } from 'react';
import { Search, Plus, ChevronDown } from 'lucide-react';

const products = [
  { sku: 'SKU-001', name: 'Batik Heritage Tote Bag', category: 'Bags', price: 189.0, stock: 234, channels: ['Shopee', 'Lazada'], status: 'Active' },
  { sku: 'SKU-002', name: 'Pewter Desk Organizer', category: 'Home', price: 320.0, stock: 12, channels: ['Shopify'], status: 'Low Stock' },
  { sku: 'SKU-003', name: 'Traditional Songket Scarf', category: 'Fashion', price: 450.0, stock: 89, channels: ['Shopee', 'TikTok'], status: 'Active' },
  { sku: 'SKU-004', name: 'Ceramic Pour-Over Set', category: 'Kitchen', price: 260.0, stock: 0, channels: [], status: 'Out of Stock' },
  { sku: 'SKU-005', name: 'Rattan Woven Basket', category: 'Home', price: 145.0, stock: 67, channels: ['Shopee', 'Lazada', 'Shopify'], status: 'Active' },
  { sku: 'SKU-006', name: 'Handmade Nyonya Pouch', category: 'Fashion', price: 98.0, stock: 5, channels: ['TikTok'], status: 'Low Stock' },
  { sku: 'SKU-007', name: 'Bamboo Cutting Board Set', category: 'Kitchen', price: 210.0, stock: 145, channels: ['Shopee', 'Amazon'], status: 'Active' },
  { sku: 'SKU-008', name: 'Linen Throw Cushion Cover', category: 'Home', price: 89.0, stock: 312, channels: ['Shopify', 'Lazada'], status: 'Active' },
  { sku: 'SKU-009', name: 'Kopitiam Enamel Mug', category: 'Kitchen', price: 55.0, stock: 28, channels: ['Shopee', 'TikTok'], status: 'Active' },
  { sku: 'SKU-010', name: 'Shibori Dyed Silk Shawl', category: 'Fashion', price: 680.0, stock: 18, channels: ['Shopify'], status: 'Active' },
];

const categories = ['All', 'Bags', 'Fashion', 'Home', 'Kitchen'];

const statusStyle: Record<string, { color: string; bg: string }> = {
  Active: { color: '#4A7B5F', bg: '#EEF5F1' },
  'Low Stock': { color: '#6D8196', bg: '#E8F0FF' },
  'Out of Stock': { color: '#8AAFC8', bg: '#F0F5FF' },
};

const channelColors: Record<string, string> = {
  Shopee: '#6D8196',
  TikTok: '#000080',
  Lazada: '#ADD8E6',
  Amazon: '#6D8196',
  Shopify: '#ADD8E6',
};

export default function Products() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = products.filter((p) => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Catalogue</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Products
          </h1>
        </div>
        <button
          className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2"
          style={{ background: '#000080' }}
        >
          <Plus size={11} />
          New Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total Products', value: products.length },
          { label: 'Active', value: products.filter((p) => p.status === 'Active').length },
          { label: 'Low / Out of Stock', value: products.filter((p) => p.status !== 'Active').length },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{s.label}</p>
            <p
              className="text-2xl mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
            >
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 mb-3 flex items-center justify-between gap-4" style={{ border: '1px solid #C8DFF0' }}>
        <div className="flex items-center gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors"
              style={{
                background: category === c ? '#000080' : 'transparent',
                color: category === c ? '#FFFFFF' : '#6D8196',
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#ADD8E6' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] outline-none placeholder:text-[#ADD8E6]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#F0F8FF', border: '1px solid #C8DFF0', color: '#000080' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
              {['SKU', 'Product Name', 'Category', 'Price', 'Stock', 'Channels', 'Status'].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 font-normal text-[9px] tracking-[0.15em] uppercase"
                  style={{ color: '#6D8196' }}
                >
                  <span className="flex items-center gap-1">
                    {h}
                    <ChevronDown size={9} style={{ color: '#ADD8E6' }} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr
                key={product.sku}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid #F5F9FF' }}
              >
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                >
                  {product.sku}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{product.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{product.category}</span>
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  RM {product.price.toFixed(2)}
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    color: product.stock === 0 ? '#8AAFC8' : product.stock < 20 ? '#6D8196' : '#000080',
                  }}
                >
                  {product.stock}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1">
                    {product.channels.map((ch) => (
                      <span
                        key={ch}
                        className="px-1.5 py-0.5 text-white text-[8px] tracking-wider"
                        style={{ background: channelColors[ch] || '#6D8196' }}
                      >
                        {ch.slice(0, 2).toUpperCase()}
                      </span>
                    ))}
                    {product.channels.length === 0 && (
                      <span className="text-[9px]" style={{ color: '#ADD8E6' }}>--</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                    style={{
                      color: statusStyle[product.status].color,
                      background: statusStyle[product.status].bg,
                    }}
                  >
                    {product.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] mt-3 tracking-wide" style={{ color: '#6D8196' }}>
        {filtered.length} products
      </p>
    </div>
  );
}
