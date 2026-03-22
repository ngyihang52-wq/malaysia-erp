"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, UserPlus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  platform: string;
  orders: number;
  totalSpent: number;
  lastOrder: string;
  lastOrderId: string;
  joined: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const tierStyle: Record<string, { color: string; bg: string }> = {
  VIP: { color: '#000080', bg: '#E8F0FF' },
  Gold: { color: '#6D8196', bg: '#EEF5FF' },
  Silver: { color: '#4A6080', bg: '#F0F5FF' },
  Bronze: { color: '#8AAFC8', bg: '#F5F9FF' },
};

function getTier(totalSpent: number): string {
  if (totalSpent > 3000) return 'VIP';
  if (totalSpent >= 1500) return 'Gold';
  if (totalSpent >= 500) return 'Silver';
  return 'Bronze';
}

function formatJoined(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function Customers() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCustomers = useCallback(async (page: number, searchQuery: string, platformFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (searchQuery) params.set('search', searchQuery);
      if (platformFilter) params.set('platform', platformFilter);

      const res = await fetch(`/api/customers?${params.toString()}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch customers');
      const json = await res.json();

      if (json.success) {
        setCustomers(json.data.customers);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(1, '', '');
  }, [fetchCustomers]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchCustomers(1, value, platform);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    fetchCustomers(newPage, search, platform);
  };

  const totalSpend = customers.reduce((s, c) => s + c.totalSpent, 0);
  const totalOrders = customers.reduce((s, c) => s + c.orders, 0);
  const vipGoldCount = customers.filter((c) => {
    const tier = getTier(c.totalSpent);
    return tier === 'VIP' || tier === 'Gold';
  }).length;

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
          { label: 'Total Customers', value: pagination.total.toString() },
          { label: 'VIP / Gold', value: loading ? '—' : vipGoldCount.toString() },
          { label: 'Avg. Order Value', value: loading || totalOrders === 0 ? '—' : `RM ${(totalSpend / totalOrders).toFixed(0)}` },
          { label: 'Total Lifetime Value', value: loading ? '—' : `RM ${(totalSpend / 1000).toFixed(1)}k` },
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
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by name, email or city..."
            className="w-full pl-8 pr-3 py-1.5 text-[11px] outline-none placeholder:text-[#ADD8E6]"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: '#F0F8FF', border: '1px solid #C8DFF0', color: '#000080' }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white" style={{ border: '1px solid #C8DFF0' }}>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={20} className="animate-spin" style={{ color: '#6D8196' }} />
            <span className="ml-2 text-[11px]" style={{ color: '#6D8196' }}>Loading customers...</span>
          </div>
        ) : customers.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-[11px]" style={{ color: '#6D8196' }}>No customers yet</span>
          </div>
        ) : (
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
              {customers.map((c) => {
                const tier = getTier(c.totalSpent);
                return (
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
                      <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{c.platform}</span>
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
                      RM {c.totalSpent.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[10px]"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                    >
                      {formatJoined(c.joined)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                        style={{
                          color: tierStyle[tier].color,
                          background: tierStyle[tier].bg,
                        }}
                      >
                        {tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer / Pagination */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] tracking-wide" style={{ color: '#6D8196' }}>
          {loading ? '...' : `${pagination.total} customers`}
        </p>

        {pagination.pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 disabled:opacity-30"
              style={{ color: '#000080' }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and pages around current
                return p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="text-[10px] px-1" style={{ color: '#6D8196' }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className="text-[10px] px-2 py-0.5"
                    style={{
                      color: p === pagination.page ? '#fff' : '#000080',
                      background: p === pagination.page ? '#000080' : 'transparent',
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1 disabled:opacity-30"
              style={{ color: '#000080' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
