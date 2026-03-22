"use client";

import { useState } from 'react';
import { Search, UserPlus } from 'lucide-react';

const customers = [
  { id: 'CUS-001', name: 'Ahmad bin Rashid', email: 'ahmad.rashid@gmail.com', channel: 'Shopee', orders: 14, spent: 4820.0, joined: 'Jan 2024', tier: 'Gold' },
  { id: 'CUS-002', name: 'Lim Wei Xin', email: 'limwx@outlook.com', channel: 'TikTok', orders: 7, spent: 1450.0, joined: 'Mar 2024', tier: 'Silver' },
  { id: 'CUS-003', name: 'Nurul Aisyah', email: 'nurul.aisyah@gmail.com', channel: 'Shopee', orders: 22, spent: 9840.0, joined: 'Nov 2023', tier: 'Platinum' },
  { id: 'CUS-004', name: 'Raj Kumar', email: 'raj.kumar@hotmail.com', channel: 'Lazada', orders: 5, spent: 2210.0, joined: 'Feb 2024', tier: 'Silver' },
  { id: 'CUS-005', name: 'Siti Aminah', email: 'siti.aminah@gmail.com', channel: 'Shopify', orders: 18, spent: 12400.0, joined: 'Aug 2023', tier: 'Platinum' },
  { id: 'CUS-006', name: 'Chen Ming', email: 'chen.ming@yahoo.com', channel: 'TikTok', orders: 9, spent: 3280.0, joined: 'Apr 2024', tier: 'Silver' },
  { id: 'CUS-007', name: 'Priya Devi', email: 'priya.devi@gmail.com', channel: 'Shopee', orders: 3, spent: 780.0, joined: 'Jun 2024', tier: 'Bronze' },
  { id: 'CUS-008', name: 'Azman Yusof', email: 'azman.y@gmail.com', channel: 'Lazada', orders: 11, spent: 5640.0, joined: 'Dec 2023', tier: 'Gold' },
  { id: 'CUS-009', name: 'Mei Lin', email: 'meilin88@gmail.com', channel: 'Shopify', orders: 6, spent: 3900.0, joined: 'May 2024', tier: 'Silver' },
  { id: 'CUS-010', name: 'Hafiz Kamal', email: 'hafizk@outlook.com', channel: 'Shopee', orders: 2, spent: 310.0, joined: 'Aug 2024', tier: 'Bronze' },
];

const tierStyle: Record<string, { color: string; bg: string }> = {
  Platinum: { color: '#000080', bg: '#E8F0FF' },
  Gold: { color: '#6D8196', bg: '#EEF5FF' },
  Silver: { color: '#4A6080', bg: '#F0F5FF' },
  Bronze: { color: '#8AAFC8', bg: '#F5F9FF' },
};

export default function Customers() {
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  const totalSpend = customers.reduce((s, c) => s + c.spent, 0);

  return (
    <div className="p-6" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>CRM</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            Customers
          </h1>
        </div>
        <button
          className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-4 py-2"
          style={{ background: '#000080' }}
        >
          <UserPlus size={11} />
          Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Customers', value: customers.length.toString() },
          { label: 'Platinum / Gold', value: customers.filter((c) => ['Platinum', 'Gold'].includes(c.tier)).length.toString() },
          { label: 'Avg. Order Value', value: `RM ${(totalSpend / customers.reduce((s, c) => s + c.orders, 0)).toFixed(0)}` },
          { label: 'Total Lifetime Value', value: `RM ${(totalSpend / 1000).toFixed(1)}k` },
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

      {/* Search */}
      <div className="bg-white p-4 mb-3" style={{ border: '1px solid #C8DFF0' }}>
        <div className="relative max-w-sm">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#ADD8E6' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
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
              {['ID', 'Customer', 'Email', 'Channel', 'Orders', 'Total Spent', 'Joined', 'Tier'].map((h) => (
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
            {filtered.map((c) => (
              <tr
                key={c.id}
                className="transition-colors cursor-pointer"
                style={{ borderBottom: '1px solid #F5F9FF' }}
              >
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                >
                  {c.id}
                </td>
                <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{c.name}</td>
                <td className="px-5 py-3.5 text-[10px]" style={{ color: '#4A6080' }}>{c.email}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{c.channel}</span>
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  {c.orders}
                </td>
                <td
                  className="px-5 py-3.5 text-[11px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                >
                  RM {c.spent.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                </td>
                <td
                  className="px-5 py-3.5 text-[10px]"
                  style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                >
                  {c.joined}
                </td>
                <td className="px-5 py-3.5">
                  <span
                    className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                    style={{
                      color: tierStyle[c.tier].color,
                      background: tierStyle[c.tier].bg,
                    }}
                  >
                    {c.tier}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] mt-3 tracking-wide" style={{ color: '#6D8196' }}>
        {filtered.length} customers
      </p>
    </div>
  );
}
