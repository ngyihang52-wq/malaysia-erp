"use client";

import { useState } from 'react';
import { Play, Plus, Trash2, Download, Clock } from 'lucide-react';

const savedQueries = [
  { name: 'Total orders by channel', query: 'SELECT channel, COUNT(*) as total\nFROM orders\nGROUP BY channel\nORDER BY total DESC;' },
  { name: 'Low stock products', query: "SELECT sku, name, stock\nFROM products\nWHERE stock < reorder_point\nORDER BY stock ASC;" },
  { name: 'Top customers by spend', query: 'SELECT customer_id, name, SUM(amount) as total_spend\nFROM orders\nGROUP BY customer_id, name\nORDER BY total_spend DESC\nLIMIT 10;' },
  { name: 'Daily revenue (30 days)', query: "SELECT DATE(created_at) as date, SUM(amount) as revenue\nFROM orders\nWHERE created_at >= NOW() - INTERVAL '30 days'\nGROUP BY date\nORDER BY date;" },
];

const mockResults = {
  columns: ['channel', 'total'],
  rows: [
    ['Shopee', '124'],
    ['TikTok', '89'],
    ['Lazada', '34'],
    ['Shopify', '0'],
    ['Amazon', '0'],
  ],
};

export default function SQLConsole() {
  const [query, setQuery] = useState(savedQueries[0].query);
  const [results, setResults] = useState<typeof mockResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState(0);

  const handleRun = () => {
    setLoading(true);
    setResults(null);
    const start = Date.now();
    setTimeout(() => {
      setResults(mockResults);
      setExecutionTime(`${Date.now() - start}ms`);
      setLoading(false);
    }, 400);
  };

  const handleSelectQuery = (idx: number) => {
    setActiveQuery(idx);
    setQuery(savedQueries[idx].query);
    setResults(null);
  };

  return (
    <div className="p-6 h-full flex flex-col gap-4" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[9px] tracking-[0.25em] uppercase" style={{ color: '#6D8196' }}>Database</p>
          <h1 className="text-xl mt-0.5" style={{ letterSpacing: '-0.01em', color: '#000080' }}>
            SQL Console
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wide" style={{ color: '#6D8196' }}>
            Connected to: <span style={{ color: '#ADD8E6' }}>malaysia_erp_prod</span>
          </span>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Saved queries sidebar */}
        <div className="w-48 flex-shrink-0">
          <div className="bg-white h-full flex flex-col" style={{ border: '1px solid #C8DFF0' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
              <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>Saved Queries</p>
              <button style={{ color: '#ADD8E6' }}>
                <Plus size={11} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {savedQueries.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectQuery(i)}
                  className="w-full text-left px-4 py-3 transition-colors"
                  style={{
                    background: activeQuery === i ? '#F0F8FF' : 'transparent',
                    borderBottom: '1px solid #F5F9FF',
                  }}
                >
                  <p
                    className="text-[11px] leading-snug"
                    style={{ color: activeQuery === i ? '#000080' : '#6D8196' }}
                  >
                    {q.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor + results */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">
          {/* Editor */}
          <div className="flex flex-col" style={{ background: '#00003A', border: '1px solid #1A1A80' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid #1A1A80' }}>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: '#6D8196' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#1A1A80' }} />
                <span className="w-2 h-2 rounded-full" style={{ background: '#1A1A80' }} />
                <span className="text-[9px] tracking-[0.1em] uppercase ml-2" style={{ color: '#3A5A9A' }}>Query Editor</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  style={{ color: '#3A5A9A' }}
                  onClick={() => setQuery('')}
                >
                  <Trash2 size={11} />
                </button>
                <button
                  onClick={handleRun}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-white text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={{ background: '#6D8196' }}
                >
                  <Play size={10} />
                  {loading ? 'Running...' : 'Run'}
                </button>
              </div>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="p-4 text-[12px] bg-transparent outline-none resize-none leading-relaxed"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                minHeight: 140,
                caretColor: '#ADD8E6',
                color: '#ADD8E6',
              }}
              spellCheck={false}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
              placeholder="-- Write your SQL query here..."
            />
          </div>

          {/* Results */}
          <div className="bg-white flex-1 flex flex-col min-h-0" style={{ border: '1px solid #C8DFF0' }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: '1px solid #EEF5FF' }}>
              <div className="flex items-center gap-3">
                <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>Results</p>
                {results && (
                  <span className="text-[10px]" style={{ color: '#ADD8E6', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {results.rows.length} rows
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {executionTime && (
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: '#6D8196' }}>
                    <Clock size={10} />
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>{executionTime}</span>
                  </div>
                )}
                {results && (
                  <button className="flex items-center gap-1 text-[10px] transition-colors" style={{ color: '#6D8196' }}>
                    <Download size={10} />
                    <span className="tracking-[0.1em] uppercase">Export</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {loading && (
                <div className="p-6 text-center">
                  <div
                    className="w-4 h-4 border-2 rounded-full animate-spin mx-auto mb-2"
                    style={{ borderColor: '#ADD8E6', borderTopColor: 'transparent' }}
                  />
                  <p className="text-[10px] tracking-wide" style={{ color: '#6D8196' }}>Executing query...</p>
                </div>
              )}
              {!loading && !results && (
                <div className="p-8 text-center text-xs tracking-wide" style={{ color: '#ADD8E6' }}>
                  Run a query to see results
                </div>
              )}
              {!loading && results && (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #EEF5FF' }}>
                      {results.columns.map((col) => (
                        <th
                          key={col}
                          className="text-left px-5 py-2.5 font-normal text-[9px] tracking-[0.15em] uppercase"
                          style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#6D8196' }}
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.rows.map((row, i) => (
                      <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid #F5F9FF' }}>
                        {row.map((cell, j) => (
                          <td
                            key={j}
                            className="px-5 py-2.5 text-[11px]"
                            style={{ fontFamily: "'IBM Plex Mono', monospace", color: '#000080' }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
