"use client";

import { useState } from 'react';
import { Search, Filter, Download, ChevronDown } from 'lucide-react';

const allOrders = [
  { id: 'ORD-2847', customer: 'Ahmad bin Rashid', channel: 'Shopee', items: 3, amount: 284.0, status: 'Shipped', date: '20 Mar 2026' },
  { id: 'ORD-2846', customer: 'Lim Wei Xin', channel: 'TikTok', items: 1, amount: 156.5, status: 'Processing', date: '20 Mar 2026' },
  { id: 'ORD-2845', customer: 'Nurul Aisyah', channel: 'Shopee', items: 5, amount: 892.0, status: 'Pending', date: '19 Mar 2026' },
  { id: 'ORD-2844', customer: 'Raj Kumar', channel: 'Lazada', items: 2, amount: 445.0, status: 'Delivered', date: '19 Mar 2026' },
  { id: 'ORD-2843', customer: 'Siti Aminah', channel: 'Shopify', items: 4, amount: 1200.0, status: 'Shipped', date: '18 Mar 2026' },
  { id: 'ORD-2842', customer: 'Chen Ming', channel: 'TikTok', items: 2, amount: 320.0, status: 'Delivered', date: '18 Mar 2026' },
  { id: 'ORD-2841', customer: 'Priya Devi', channel: 'Shopee', items: 1, amount: 78.5, status: 'Delivered', date: '17 Mar 2026' },
  { id: 'ORD-2840', customer: 'Azman Yusof', channel: 'Lazada', items: 3, amount: 560.0, status: 'Shipped', date: '17 Mar 2026' },
  { id: 'ORD-2839', customer: 'Mei Lin', channel: 'Shopify', items: 2, amount: 890.0, status: 'Pending', date: '16 Mar 2026' },
  { id: 'ORD-2838', customer: 'Hafiz Kamal', channel: 'Shopee', items: 1, amount: 145.0, status: 'Processing', date: '16 Mar 2026' },
  { id: 'ORD-2837', customer: 'Tan Bee Lian', channel: 'TikTok', items: 4, amount: 674.0, status: 'Delivered', date: '15 Mar 2026' },
  { id: 'ORD-2836', customer: 'Rosnah Binti Ali', channel: 'Shopee', items: 2, amount: 234.0, status: 'Shipped', date: '15 Mar 2026' },
];

const statuses = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered'];

const statusColor: Record<string, string> = {
  Shipped: '#4A7B5F',
  Processing: '#6D8196',
  Pending: '#8AAFC8',
  Delivered: '#4A7B5F',
};

const statusBg: Record<string, string> = {
  Shipped: '#EEF5F1',
  Processing: '#E8F0FF',
  Pending: '#F0F5FF',
  Delivered: '#EEF5F1',
};

export default function Orders() {
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = allOrders.filter((o) => {
    const matchStatus = activeStatus === 'All' || o.status === activeStatus;
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Management</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Orders
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors" style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}>
            <Filter size={11} />
            Filter
          </button>
          <button className="flex items-center gap-1.5 bg-white text-[10px] tracking-[0.1em] uppercase px-3 py-2 transition-colors" style={{ border: '1px solid #C8DFF0', color: '#6D8196' }}>
            <Download size={11} />
            Export
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', count: allOrders.length, color: '#000080' },
          { label: 'Pending', count: allOrders.filter((o) => o.status === 'Pending').length, color: '#8AAFC8' },
          { label: 'Processing', count: allOrders.filter((o) => o.status === 'Processing').length, color: '#6D8196' },
          { label: 'Shipped', count: allOrders.filter((o) => o.status === 'Shipped').length, color: '#4A7B5F' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{s.label}</p>
            <p
              className="text-2xl mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: s.color }}
            >
              {s.count}
            </p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 mb-3 flex items-center justify-between gap-4" style={{ border: '1px solid #C8DFF0' }}>
        <div className="flex items-center gap-1">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(s)}
              className="px-3 py-1.5 text-[10px] tracking-[0.1em] uppercase transition-colors"
              style={{
                background: activeStatus === s ? '#000080' : 'transparent',
                color: activeStatus === s ? '#FFFFFF' : '#6D8196',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#ADD8E6' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders..."
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
              {['Order ID', 'Customer', 'Channel', 'Items', 'Amount', 'Status', 'Date'].map((h) => (
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
            {filtered.map((order) => (
              <tr
                key={order.id}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid #F5F9FF' }}
              >
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                >
                  #{order.id}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{order.channel}</span>
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#4A6080' }}
                >
                  {order.items}
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  RM {order.amount.toFixed(2)}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                    style={{
                      color: statusColor[order.status],
                      background: statusBg[order.status],
                    }}
                  >
                    {order.status}
                  </span>
                </td>
                <td
                  className="px-5 py-3.5 text-[10px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                >
                  {order.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-xs tracking-wide" style={{ color: '#6D8196' }}>
            No orders found
          </div>
        )}
      </div>

      <p className="text-[10px] mt-3 tracking-wide" style={{ color: '#6D8196' }}>
        Showing {filtered.length} of {allOrders.length} orders
      </p>
    </div>
  );
}
