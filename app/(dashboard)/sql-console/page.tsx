"use client";

import { useState, useEffect, useCallback } from 'react';
import { Play, Plus, Trash2, Download, Clock, Database, ChevronRight, X, Save } from 'lucide-react';

interface SavedQuery {
  name: string;
  query: string;
}

interface QueryResults {
  columns: string[];
  rows: any[][];
  count: number;
}

interface SchemaTable {
  name: string;
  columns: { name: string; type: string; nullable: boolean }[];
}

const STORAGE_KEY = 'sql-console-saved-queries';

function loadSavedQueries(): SavedQuery[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function persistSavedQueries(queries: SavedQuery[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queries));
  } catch {}
}

export default function SQLConsole() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<QueryResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<string | null>(null);
  const [activeQuery, setActiveQuery] = useState<number | null>(null);

  // Saved queries (localStorage)
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');

  // Schema browser
  const [schema, setSchema] = useState<SchemaTable[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // Load saved queries from localStorage on mount
  useEffect(() => {
    setSavedQueries(loadSavedQueries());
  }, []);

  // Fetch schema on mount
  useEffect(() => {
    const fetchSchema = async () => {
      setSchemaLoading(true);
      setSchemaError(null);
      try {
        const res = await fetch('/api/sql/schema', { credentials: 'include' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || json.message || 'Failed to load schema');
        }
        setSchema(json.data.schema || json.data.tables || []);
      } catch (err: any) {
        setSchemaError(err.message || 'Failed to load schema');
      } finally {
        setSchemaLoading(false);
      }
    };
    fetchSchema();
  }, []);

  const handleRun = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults(null);
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || json.message || 'Query execution failed');
      }
      setResults({
        columns: json.data.columns,
        rows: json.data.rows,
        count: json.data.count,
      });
      setExecutionTime(`${Date.now() - start}ms`);
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
      setExecutionTime(`${Date.now() - start}ms`);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleSelectQuery = (idx: number) => {
    setActiveQuery(idx);
    setQuery(savedQueries[idx].query);
    setResults(null);
    setError(null);
  };

  const handleSaveQuery = () => {
    if (!newQueryName.trim() || !query.trim()) return;
    const updated = [...savedQueries, { name: newQueryName.trim(), query }];
    setSavedQueries(updated);
    persistSavedQueries(updated);
    setActiveQuery(updated.length - 1);
    setNewQueryName('');
    setShowSaveDialog(false);
  };

  const handleDeleteQuery = (idx: number) => {
    const updated = savedQueries.filter((_, i) => i !== idx);
    setSavedQueries(updated);
    persistSavedQueries(updated);
    if (activeQuery === idx) {
      setActiveQuery(null);
    } else if (activeQuery !== null && activeQuery > idx) {
      setActiveQuery(activeQuery - 1);
    }
  };

  const handleExport = () => {
    if (!results) return;
    const header = results.columns.join(',');
    const rows = results.rows.map((row) => row.map((cell) => {
      const str = String(cell ?? '');
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query-results.csv';
    a.click();
    URL.revokeObjectURL(url);
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
        <div className="w-48 flex-shrink-0 flex flex-col gap-3">
          <div className="bg-white flex flex-col" style={{ border: '1px solid #C8DFF0', maxHeight: '50%' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
              <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>Saved Queries</p>
              <button
                style={{ color: '#ADD8E6' }}
                onClick={() => {
                  if (query.trim()) setShowSaveDialog(true);
                }}
                title="Save current query"
              >
                <Plus size={11} />
              </button>
            </div>

            {/* Save dialog */}
            {showSaveDialog && (
              <div className="px-3 py-2 flex gap-1" style={{ borderBottom: '1px solid #EEF5FF' }}>
                <input
                  type="text"
                  value={newQueryName}
                  onChange={(e) => setNewQueryName(e.target.value)}
                  placeholder="Query name..."
                  className="flex-1 text-[10px] px-2 py-1 outline-none min-w-0"
                  style={{ border: '1px solid #C8DFF0', color: '#000080' }}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveQuery();
                    if (e.key === 'Escape') setShowSaveDialog(false);
                  }}
                />
                <button onClick={handleSaveQuery} style={{ color: '#000080' }}>
                  <Save size={11} />
                </button>
                <button onClick={() => setShowSaveDialog(false)} style={{ color: '#6D8196' }}>
                  <X size={11} />
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {savedQueries.length === 0 && (
                <div className="px-4 py-4 text-center">
                  <p className="text-[10px]" style={{ color: '#ADD8E6' }}>No saved queries</p>
                </div>
              )}
              {savedQueries.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center group"
                  style={{
                    background: activeQuery === i ? '#F0F8FF' : 'transparent',
                    borderBottom: '1px solid #F5F9FF',
                  }}
                >
                  <button
                    onClick={() => handleSelectQuery(i)}
                    className="flex-1 text-left px-4 py-3 transition-colors min-w-0"
                  >
                    <p
                      className="text-[11px] leading-snug truncate"
                      style={{ color: activeQuery === i ? '#000080' : '#6D8196' }}
                    >
                      {q.name}
                    </p>
                  </button>
                  <button
                    onClick={() => handleDeleteQuery(i)}
                    className="pr-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#6D8196' }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Schema browser */}
          <div className="bg-white flex-1 flex flex-col min-h-0" style={{ border: '1px solid #C8DFF0' }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #EEF5FF' }}>
              <Database size={10} style={{ color: '#6D8196' }} />
              <p className="text-[9px] tracking-[0.15em] uppercase" style={{ color: '#6D8196' }}>Schema</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {schemaLoading && (
                <div className="p-4 text-center">
                  <div
                    className="w-3 h-3 border-2 rounded-full animate-spin mx-auto mb-1"
                    style={{ borderColor: '#ADD8E6', borderTopColor: 'transparent' }}
                  />
                  <p className="text-[9px]" style={{ color: '#6D8196' }}>Loading...</p>
                </div>
              )}
              {schemaError && (
                <div className="p-3">
                  <p className="text-[9px]" style={{ color: '#CC4444' }}>{schemaError}</p>
                </div>
              )}
              {!schemaLoading && !schemaError && schema.map((table) => (
                <div key={table.name}>
                  <button
                    onClick={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                    className="w-full text-left px-4 py-2 flex items-center gap-1.5 transition-colors hover:bg-[#F0F8FF]"
                    style={{ borderBottom: '1px solid #F5F9FF' }}
                  >
                    <ChevronRight
                      size={9}
                      style={{
                        color: '#6D8196',
                        transform: expandedTable === table.name ? 'rotate(90deg)' : undefined,
                        transition: 'transform 0.15s',
                      }}
                    />
                    <span className="text-[10px]" style={{ color: '#000080', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {table.name}
                    </span>
                  </button>
                  {expandedTable === table.name && (
                    <div style={{ background: '#FAFCFF' }}>
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="flex items-center justify-between px-4 pl-8 py-1.5"
                          style={{ borderBottom: '1px solid #F5F9FF' }}
                        >
                          <span
                            className="text-[9px]"
                            style={{ color: '#6D8196', fontFamily: "'IBM Plex Mono', monospace" }}
                          >
                            {col.name}
                          </span>
                          <span className="text-[8px] tracking-wide uppercase" style={{ color: '#ADD8E6' }}>
                            {col.type}{col.nullable ? '?' : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                  disabled={loading || !query.trim()}
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
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1 text-[10px] transition-colors"
                    style={{ color: '#6D8196' }}
                  >
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
              {!loading && error && (
                <div className="p-5">
                  <div className="px-4 py-3" style={{ background: '#FFF5F5', border: '1px solid #FFDDDD' }}>
                    <p className="text-[9px] tracking-[0.15em] uppercase mb-1" style={{ color: '#CC4444' }}>Error</p>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#993333', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {error}
                    </p>
                  </div>
                </div>
              )}
              {!loading && !error && !results && (
                <div className="p-8 text-center text-xs tracking-wide" style={{ color: '#ADD8E6' }}>
                  Run a query to see results
                </div>
              )}
              {!loading && !error && results && (
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
                            style={{ fontFamily: "'IBM Plex Mono', monospace", color: cell === null ? '#ADD8E6' : '#000080' }}
                          >
                            {cell === null ? 'NULL' : String(cell)}
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
