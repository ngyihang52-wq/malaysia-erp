"use client";

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  costPrice: number;
  variants: number;
  channels: Record<string, number>;
  stock: Record<string, number>;
  totalStock: number;
  isActive: boolean;
  image: string;
  images: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

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

function getStatus(product: Product): string {
  if (!product.isActive || product.totalStock === 0) return 'Out of Stock';
  if (product.totalStock < 20) return 'Low Stock';
  return 'Active';
}

export default function Products() {
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 50, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async (page: number, searchQuery: string, categoryFilter: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '50');
      if (searchQuery) params.set('search', searchQuery);
      if (categoryFilter && categoryFilter !== 'All') params.set('category', categoryFilter);

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setProducts(json.data.products);
        setPagination(json.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchProducts(1, debouncedSearch, category);
  }, [debouncedSearch, category, fetchProducts]);

  const goToPage = (page: number) => {
    fetchProducts(page, debouncedSearch, category);
  };

  const activeCount = products.filter((p) => getStatus(p) === 'Active').length;
  const issueCount = products.filter((p) => getStatus(p) !== 'Active').length;

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
          { label: 'Total Products', value: pagination.total },
          { label: 'Active', value: activeCount },
          { label: 'Low / Out of Stock', value: issueCount },
        ].map((s) => (
          <div key={s.label} className="bg-white p-4" style={{ border: '1px solid #C8DFF0' }}>
            <p className="text-[9px] tracking-[0.2em] uppercase" style={{ color: '#6D8196' }}>{s.label}</p>
            <p
              className="text-2xl mt-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
            >
              {loading ? '--' : s.value}
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
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={20} className="animate-spin" style={{ color: '#000080' }} />
                    <span className="text-[11px] tracking-wide" style={{ color: '#6D8196' }}>Loading products...</span>
                  </div>
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <span className="text-[11px] tracking-wide" style={{ color: '#6D8196' }}>No products yet</span>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const status = getStatus(product);
                const channelNames = Object.keys(product.channels);
                const primaryPrice = channelNames.length > 0
                  ? Math.min(...Object.values(product.channels))
                  : product.costPrice;

                return (
                  <tr
                    key={product.id}
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
                      RM {primaryPrice.toFixed(2)}
                    </td>
                    <td
                      className="px-5 py-3.5 text-[11px]"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        color: product.totalStock === 0 ? '#8AAFC8' : product.totalStock < 20 ? '#6D8196' : '#000080',
                      }}
                    >
                      {product.totalStock}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {channelNames.map((ch) => (
                          <span
                            key={ch}
                            className="px-1.5 py-0.5 text-white text-[8px] tracking-wider"
                            style={{ background: channelColors[ch] || '#6D8196' }}
                          >
                            {ch.slice(0, 2).toUpperCase()}
                          </span>
                        ))}
                        {channelNames.length === 0 && (
                          <span className="text-[9px]" style={{ color: '#ADD8E6' }}>--</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className="px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase"
                        style={{
                          color: statusStyle[status].color,
                          background: statusStyle[status].bg,
                        }}
                      >
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: count + pagination */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] tracking-wide" style={{ color: '#6D8196' }}>
          {loading ? '...' : `${pagination.total} products`}
        </p>

        {pagination.pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="p-1 transition-colors disabled:opacity-30"
              style={{ color: '#000080' }}
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter((p) => {
                // Show first, last, current, and neighbors
                return p === 1 || p === pagination.pages || Math.abs(p - pagination.page) <= 1;
              })
              .reduce<(number | string)[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                typeof p === 'string' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-[10px]" style={{ color: '#6D8196' }}>...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className="min-w-[24px] h-6 text-[10px] tracking-wider transition-colors"
                    style={{
                      background: p === pagination.page ? '#000080' : 'transparent',
                      color: p === pagination.page ? '#FFFFFF' : '#6D8196',
                    }}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              className="p-1 transition-colors disabled:opacity-30"
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
