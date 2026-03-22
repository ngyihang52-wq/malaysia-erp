"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  platform: string;
  customer: string;
  email: string;
  items: number;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: string;
  payment: string;
  tracking: string;
  date: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function Orders() {
  const [activeStatus, setActiveStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = useCallback(async (page: number, status: string, searchTerm: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (status !== 'All') params.set('status', status);
      if (searchTerm) params.set('search', searchTerm);

      const res = await fetch(`/api/orders?${params.toString()}`, { credentials: 'include' });
      const json = await res.json();

      if (json.success) {
        setOrders(json.data.orders);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch status counts (unfiltered) for the summary cards
  const fetchStatusCounts = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?limit=0', { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        const allOrders: Order[] = json.data.orders;
        const total = json.data.pagination.total;
        const counts: Record<string, number> = { Total: total };
        for (const s of ['Pending', 'Processing', 'Shipped']) {
          counts[s] = allOrders.filter((o) => o.status === s).length;
        }
        // If limit=0 doesn't return all orders, use what we have
        if (allOrders.length < total) {
          // Fetch with a high limit to get accurate counts
          const res2 = await fetch('/api/orders?limit=9999', { credentials: 'include' });
          const json2 = await res2.json();
          if (json2.success) {
            const all2: Order[] = json2.data.orders;
            counts.Total = json2.data.pagination.total;
            for (const s of ['Pending', 'Processing', 'Shipped']) {
              counts[s] = all2.filter((o) => o.status === s).length;
            }
          }
        }
        setStatusCounts(counts);
      }
    } catch {
      // Silently fail for counts
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    fetchOrders(1, activeStatus, debouncedSearch);
  }, [activeStatus, debouncedSearch, fetchOrders]);

  // Fetch counts on mount
  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  const handlePageChange = (newPage: number) => {
    fetchOrders(newPage, activeStatus, debouncedSearch);
  };

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
          { label: 'Total', count: statusCounts.Total ?? 0, color: '#000080' },
          { label: 'Pending', count: statusCounts.Pending ?? 0, color: '#8AAFC8' },
          { label: 'Processing', count: statusCounts.Processing ?? 0, color: '#6D8196' },
          { label: 'Shipped', count: statusCounts.Shipped ?? 0, color: '#4A7B5F' },
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
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <div className="py-12 flex items-center justify-center gap-2 text-xs tracking-wide" style={{ color: '#6D8196' }}>
                    <Loader2 size={14} className="animate-spin" />
                    Loading orders...
                  </div>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="transition-colors cursor-pointer"
                  style={{ borderBottom: '1px solid #F5F9FF' }}
                >
                  <td
                    className="px-5 py-3.5 text-[11px]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                  >
                    #{order.orderNumber}
                  </td>
                  <td className="px-5 py-3.5 text-xs" style={{ color: '#1A2540' }}>{order.customer}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-[9px] tracking-wider uppercase" style={{ color: '#6D8196' }}>{order.platform}</span>
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
                    RM {order.total.toFixed(2)}
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
                    {formatDate(order.date)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && orders.length === 0 && (
          <div className="py-12 text-center text-xs tracking-wide" style={{ color: '#6D8196' }}>
            No orders yet
          </div>
        )}
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] tracking-wide" style={{ color: '#6D8196' }}>
          Showing {orders.length} of {pagination.total} orders
        </p>

        {pagination.pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="flex items-center justify-center w-7 h-7 transition-colors disabled:opacity-30"
              style={{ border: '1px solid #C8DFF0', color: '#6D8196', background: '#FFFFFF' }}
            >
              <ChevronLeft size={12} />
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, and pages near the current page
                return p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1;
              })
              .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === 'ellipsis' ? (
                  <span key={`e-${idx}`} className="text-[10px] px-1" style={{ color: '#6D8196' }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p as number)}
                    className="flex items-center justify-center w-7 h-7 text-[10px] transition-colors"
                    style={{
                      border: '1px solid #C8DFF0',
                      background: pagination.page === p ? '#000080' : '#FFFFFF',
                      color: pagination.page === p ? '#FFFFFF' : '#6D8196',
                    }}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="flex items-center justify-center w-7 h-7 transition-colors disabled:opacity-30"
              style={{ border: '1px solid #C8DFF0', color: '#6D8196', background: '#FFFFFF' }}
            >
              <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
