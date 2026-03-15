"use client";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopBar from "@/components/layout/TopBar";

// ============================================================
// TYPES
// ============================================================

interface ParamConfig {
  name: string;
  type: "text" | "number" | "date" | "dropdown";
  value: string;
  defaultValue: string;
  options?: string[];
}

interface QueryResult {
  rows: Record<string, unknown>[];
  columns: string[];
  rowCount: number;
  executionTimeMs: number;
  limited: boolean;
}

interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  params: ParamConfig[];
  isTemplate?: boolean;
  // Execution metadata (persisted for dashboard display)
  lastExecutedAt?: string;
  lastRowCount?: number;
  lastExecutionTimeMs?: number;
  lastError?: string;
}

interface HistoryEntry {
  id: string;
  sql: string;
  executedAt: string;
  rowCount: number;
  executionTimeMs: number;
  error?: string;
}

interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
}

// ============================================================
// TEMPLATE QUERIES
// ============================================================

const TEMPLATE_QUERIES: SavedQuery[] = [
  {
    id: "tpl-1",
    name: "Orders by Platform",
    sql: `SELECT\n  o."integrationId",\n  o.status,\n  COUNT(*) AS order_count,\n  SUM(o.total) AS total_revenue\nFROM "Order" o\nWHERE o.status = :status\nGROUP BY o."integrationId", o.status\nORDER BY total_revenue DESC`,
    params: [
      { name: "status", type: "dropdown", value: "DELIVERED", defaultValue: "DELIVERED", options: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] },
    ],
    isTemplate: true,
  },
  {
    id: "tpl-2",
    name: "Low Stock Products",
    sql: `SELECT\n  p.name,\n  p.sku,\n  ii.quantity,\n  ii."reorderPoint",\n  w.name AS warehouse\nFROM "InventoryItem" ii\nJOIN "Product" p ON ii."productId" = p.id\nJOIN "Warehouse" w ON ii."warehouseId" = w.id\nWHERE ii.quantity < :threshold\nORDER BY ii.quantity ASC`,
    params: [{ name: "threshold", type: "number", value: "10", defaultValue: "10" }],
    isTemplate: true,
  },
  {
    id: "tpl-3",
    name: "Customer Spending by State",
    sql: `SELECT\n  c.state,\n  COUNT(c.id) AS customer_count,\n  SUM(c."totalSpent") AS total_spent,\n  AVG(c."totalOrders") AS avg_orders\nFROM "Customer" c\nWHERE c.country = :country\nGROUP BY c.state\nORDER BY total_spent DESC`,
    params: [{ name: "country", type: "text", value: "Malaysia", defaultValue: "Malaysia" }],
    isTemplate: true,
  },
  {
    id: "tpl-4",
    name: "Recent Orders with Customers",
    sql: `SELECT\n  o."orderNumber",\n  c.name AS customer_name,\n  c.email,\n  o.total,\n  o.status,\n  o."createdAt"\nFROM "Order" o\nLEFT JOIN "Customer" c ON o."customerId" = c.id\nORDER BY o."createdAt" DESC\nLIMIT :limit`,
    params: [{ name: "limit", type: "number", value: "50", defaultValue: "50" }],
    isTemplate: true,
  },
  {
    id: "tpl-5",
    name: "Product Channel Pricing",
    sql: `SELECT\n  p.name,\n  p.sku,\n  p."costPrice",\n  cp."sellingPrice",\n  pi.platform,\n  cp.status\nFROM "ChannelProduct" cp\nJOIN "Product" p ON cp."productId" = p.id\nJOIN "PlatformIntegration" pi ON cp."integrationId" = pi.id\nWHERE pi.platform = :platform\nORDER BY p.name`,
    params: [
      { name: "platform", type: "dropdown", value: "SHOPEE", defaultValue: "SHOPEE", options: ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"] },
    ],
    isTemplate: true,
  },
  {
    id: "tpl-6",
    name: "Sync History",
    sql: `SELECT\n  sl.type,\n  sl.status,\n  sl."recordsCount",\n  sl.message,\n  sl."startedAt",\n  sl."completedAt",\n  pi.platform\nFROM "SyncLog" sl\nJOIN "PlatformIntegration" pi ON sl."integrationId" = pi.id\nWHERE sl.status = :syncStatus\nORDER BY sl."startedAt" DESC`,
    params: [
      { name: "syncStatus", type: "dropdown", value: "SUCCESS", defaultValue: "SUCCESS", options: ["RUNNING", "SUCCESS", "FAILED", "PARTIAL"] },
    ],
    isTemplate: true,
  },
];

const DEFAULT_SQL = `-- Write your SQL query here\n-- Use :paramName for parameterized values\n-- Press Ctrl+Enter (Cmd+Enter) to execute\n\nSELECT\n  p.name,\n  p.sku,\n  p."costPrice",\n  p."isActive"\nFROM "Product" p\nWHERE p."isActive" = true\nORDER BY p.name\nLIMIT :limit`;

// ============================================================
// SQL KEYWORD HIGHLIGHTING
// ============================================================

const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER",
  "FULL", "CROSS", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "AS",
  "ORDER", "BY", "GROUP", "HAVING", "LIMIT", "OFFSET", "DISTINCT",
  "COUNT", "SUM", "AVG", "MAX", "MIN", "CASE", "WHEN", "THEN", "ELSE",
  "END", "WITH", "UNION", "ALL", "LIKE", "BETWEEN", "EXISTS", "COALESCE",
  "CAST", "ASC", "DESC", "TRUE", "FALSE", "ILIKE",
]);

function highlightSQL(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    const parts: React.ReactNode[] = [];
    // Tokenize with regex
    const tokenRegex = /('(?:[^'\\]|\\.)*')|(\-\-[^\n]*)|(:([a-zA-Z_][a-zA-Z0-9_]*))|(\b\d+(?:\.\d+)?\b)|([a-zA-Z_][a-zA-Z0-9_]*)|(\S)/g;
    let match;
    let lastIndex = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      // Add any whitespace before this token
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }

      const [full, strLiteral, comment, param, , numLiteral, word] = match;

      if (comment) {
        parts.push(<span key={`${lineIdx}-${match.index}`} style={{ color: "#94a3b8" }}>{full}</span>);
      } else if (strLiteral) {
        parts.push(<span key={`${lineIdx}-${match.index}`} style={{ color: "#16a34a" }}>{full}</span>);
      } else if (param) {
        parts.push(<span key={`${lineIdx}-${match.index}`} style={{ color: "#2563eb", fontWeight: 600 }}>{full}</span>);
      } else if (numLiteral) {
        parts.push(<span key={`${lineIdx}-${match.index}`} style={{ color: "#d97706" }}>{full}</span>);
      } else if (word && SQL_KEYWORDS.has(word.toUpperCase())) {
        parts.push(<span key={`${lineIdx}-${match.index}`} style={{ color: "#7c3aed", fontWeight: 600 }}>{full}</span>);
      } else {
        parts.push(full);
      }

      lastIndex = match.index + full.length;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <div key={lineIdx} style={{ minHeight: "1.6em" }}>
        {parts.length > 0 ? parts : "\u00A0"}
      </div>
    );
  });
}

// ============================================================
// PARAM EXTRACTION
// ============================================================

function extractParams(sqlText: string): string[] {
  // Match :paramName but not ::type_casts
  const regex = /(?<![:]):([a-zA-Z_][a-zA-Z0-9_]*)/g;
  const matches = new Set<string>();
  let match;
  while ((match = regex.exec(sqlText)) !== null) {
    matches.add(match[1]);
  }
  return Array.from(matches);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

function SqlConsoleContent() {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const searchParams = useSearchParams();

  // Core state
  const [sql, setSql] = useState(DEFAULT_SQL);
  const [params, setParams] = useState<ParamConfig[]>([
    { name: "limit", type: "number", value: "50", defaultValue: "50" },
  ]);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Config
  const [rowLimit, setRowLimit] = useState(100);

  // Sorting
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Saved queries + history
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(TEMPLATE_QUERIES);
  const [queryHistory, setQueryHistory] = useState<HistoryEntry[]>([]);
  const [saveName, setSaveName] = useState("");

  // Schema
  const [schema, setSchema] = useState<TableSchema[]>([]);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  // Panel
  const [activePanel, setActivePanel] = useState<"params" | "schema" | "saved" | "history">("params");

  // ---- Load saved queries + history from localStorage ----
  useEffect(() => {
    try {
      const stored = localStorage.getItem("erp-sql-saved-queries");
      if (stored) {
        const userQueries = JSON.parse(stored) as SavedQuery[];
        setSavedQueries([...TEMPLATE_QUERIES, ...userQueries]);
      }
      const hist = localStorage.getItem("erp-sql-history");
      if (hist) {
        setQueryHistory(JSON.parse(hist) as HistoryEntry[]);
      }
    } catch {
      // Ignore parse errors
    }
    setInitialLoadDone(true);
  }, []);

  // ---- Auto-detect parameters from SQL ----
  useEffect(() => {
    const detected = extractParams(sql);
    setParams((prev) => {
      const existing = new Map(prev.map((p) => [p.name, p]));
      return detected.map(
        (name) =>
          existing.get(name) || {
            name,
            type: "text" as const,
            value: "",
            defaultValue: "",
            options: [],
          }
      );
    });
  }, [sql]);

  // ---- Load query from URL ?queryId= ----
  useEffect(() => {
    if (!initialLoadDone) return;
    const queryId = searchParams.get("queryId");
    if (queryId) {
      const match = savedQueries.find((q) => q.id === queryId);
      if (match) {
        setSql(match.sql);
        setParams(match.params.map((p) => ({ ...p })));
        setActivePanel("params");
        setResults(null);
        setError(null);
      }
      // Clean URL to prevent re-loading on future renders
      window.history.replaceState({}, "", "/sql-console");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLoadDone]);

  // ---- Fetch schema ----
  const fetchSchema = useCallback(async () => {
    if (schema.length > 0) return; // Already loaded
    setSchemaLoading(true);
    try {
      const res = await fetch("/api/sql/schema");
      const data = await res.json();
      if (data.success) {
        setSchema(data.data.schema);
      }
    } catch {
      // Ignore
    } finally {
      setSchemaLoading(false);
    }
  }, [schema.length]);

  useEffect(() => {
    if (activePanel === "schema") {
      fetchSchema();
    }
  }, [activePanel, fetchSchema]);

  // ---- Update a parameter config ----
  const updateParam = (index: number, field: string, value: unknown) => {
    setParams((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // ---- Add to history ----
  const addToHistory = useCallback(
    (querySql: string, rowCount: number, executionTimeMs: number, histError?: string) => {
      const entry: HistoryEntry = {
        id: `h-${Date.now()}`,
        sql: querySql,
        executedAt: new Date().toISOString(),
        rowCount,
        executionTimeMs,
        error: histError,
      };
      setQueryHistory((prev) => {
        const updated = [entry, ...prev].slice(0, 50);
        localStorage.setItem("erp-sql-history", JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  // ---- Update saved query metadata after execution ----
  const updateSavedQueryMetadata = useCallback(
    (querySql: string, rowCount: number, timeMs: number, execError?: string) => {
      try {
        const stored = localStorage.getItem("erp-sql-saved-queries");
        if (!stored) return;
        const userQueries = JSON.parse(stored) as SavedQuery[];
        let changed = false;
        const updated = userQueries.map((q) => {
          if (q.sql === querySql) {
            changed = true;
            return {
              ...q,
              lastExecutedAt: new Date().toISOString(),
              lastRowCount: rowCount,
              lastExecutionTimeMs: timeMs,
              lastError: execError,
            };
          }
          return q;
        });
        if (changed) {
          localStorage.setItem("erp-sql-saved-queries", JSON.stringify(updated));
          setSavedQueries([...TEMPLATE_QUERIES, ...updated]);
        }
      } catch {
        // Ignore
      }
    },
    []
  );

  // ---- Execute query ----
  const executeQuery = useCallback(async () => {
    if (!sql.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSortColumn(null);

    try {
      // Convert :paramName → $N positional placeholders
      let processedSql = sql;
      const paramValues: (string | number | null)[] = [];

      params.forEach((param, index) => {
        const regex = new RegExp(`(?<![:]):${param.name}\\b`, "g");
        processedSql = processedSql.replace(regex, `$${index + 1}`);

        let val: string | number | null = param.value || param.defaultValue;
        if (param.type === "number") {
          val = val ? Number(val) : null;
        }
        paramValues.push(val);
      });

      const res = await fetch("/api/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sql: processedSql,
          params: paramValues,
          limit: rowLimit,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error);
        addToHistory(sql, 0, 0, data.error);
        updateSavedQueryMetadata(sql, 0, 0, data.error);
      } else {
        setResults(data.data);
        addToHistory(sql, data.data.rowCount, data.data.executionTimeMs);
        updateSavedQueryMetadata(sql, data.data.rowCount, data.data.executionTimeMs);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Execution failed";
      setError(msg);
      addToHistory(sql, 0, 0, msg);
      updateSavedQueryMetadata(sql, 0, 0, msg);
    } finally {
      setLoading(false);
    }
  }, [sql, params, rowLimit, loading, addToHistory, updateSavedQueryMetadata]);

  // ---- Save query ----
  const saveQuery = () => {
    if (!saveName.trim()) return;
    const newQuery: SavedQuery = {
      id: `q-${Date.now()}`,
      name: saveName,
      sql,
      params: [...params],
      // Attach execution metadata if available
      lastExecutedAt: results ? new Date().toISOString() : undefined,
      lastRowCount: results?.rowCount,
      lastExecutionTimeMs: results?.executionTimeMs,
      lastError: error || undefined,
    };
    const userQueries = savedQueries.filter((q) => !q.isTemplate);
    const updated = [...userQueries, newQuery];
    localStorage.setItem("erp-sql-saved-queries", JSON.stringify(updated));
    setSavedQueries([...TEMPLATE_QUERIES, ...updated]);
    setSaveName("");
  };

  // ---- Load query ----
  const loadQuery = (query: SavedQuery) => {
    setSql(query.sql);
    setParams(query.params.map((p) => ({ ...p })));
    setActivePanel("params");
    setResults(null);
    setError(null);
  };

  // ---- Delete saved query ----
  const deleteQuery = (id: string) => {
    const userQueries = savedQueries.filter((q) => !q.isTemplate && q.id !== id);
    localStorage.setItem("erp-sql-saved-queries", JSON.stringify(userQueries));
    setSavedQueries([...TEMPLATE_QUERIES, ...userQueries]);
  };

  // ---- Sort results ----
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedRows = useMemo(() => {
    if (!results || !sortColumn) return results?.rows || [];
    return [...results.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      const comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [results, sortColumn, sortDirection]);

  // ---- Export CSV ----
  const exportCSV = () => {
    if (!results) return;
    const header = results.columns.join(",");
    const rows = results.rows.map((row) =>
      results.columns
        .map((col) => {
          const val = row[col];
          const str = val === null || val === undefined ? "" : String(val);
          return str.includes(",") || str.includes('"') || str.includes("\n")
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        })
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `query-results-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ---- Insert text at cursor ----
  const insertAtCursor = (text: string) => {
    const textarea = editorRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newSql = sql.substring(0, start) + text + sql.substring(end);
    setSql(newSql);
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    });
  };

  // ---- Toggle schema table expansion ----
  const toggleTable = (tableName: string) => {
    setExpandedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  // ---- Format cell value for display ----
  const formatCellValue = (val: unknown): string => {
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "object") return JSON.stringify(val);
    return String(val);
  };

  // ---- Keyboard shortcuts ----
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter → execute
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      executeQuery();
    }
    // Tab → insert 2 spaces
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newSql = sql.substring(0, start) + "  " + sql.substring(end);
      setSql(newSql);
      requestAnimationFrame(() => {
        if (editorRef.current) {
          editorRef.current.selectionStart = editorRef.current.selectionEnd = start + 2;
        }
      });
    }
  };

  const editorFontStyle: React.CSSProperties = {
    fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontSize: "13px",
    lineHeight: "1.6",
    tabSize: 2,
  };

  return (
    <div>
      <TopBar
        title="SQL Console"
        subtitle="Execute parameterized queries against your ERP database"
        actions={
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                className="erp-input text-sm py-2"
                style={{ width: "180px" }}
                placeholder="Query name..."
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveQuery()}
              />
              <button
                className="erp-btn erp-btn-secondary text-sm"
                onClick={saveQuery}
                disabled={!saveName.trim()}
                style={{ opacity: saveName.trim() ? 1 : 0.5 }}
              >
                Save Query
              </button>
            </div>
            <button
              className="erp-btn erp-btn-primary text-sm"
              onClick={executeQuery}
              disabled={loading || !sql.trim()}
              style={{ opacity: loading || !sql.trim() ? 0.6 : 1 }}
            >
              {loading ? "Running..." : "▶ Run Query"}
            </button>
          </div>
        }
      />

      <div className="p-8 fade-in">
        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="erp-card text-center">
            <div className="text-2xl font-bold" style={{ color: "#0f172a" }}>
              {schema.length || "—"}
            </div>
            <div className="text-xs mt-1" style={{ color: "#64748b" }}>Database Tables</div>
          </div>
          <div className="erp-card text-center">
            <div className="text-2xl font-bold" style={{ color: "#2563eb" }}>
              {savedQueries.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "#64748b" }}>Saved Queries</div>
          </div>
          <div className="erp-card text-center">
            <div className="text-2xl font-bold" style={{ color: "#7c3aed" }}>
              {queryHistory.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "#64748b" }}>History Entries</div>
          </div>
          <div className="erp-card text-center">
            <div className="text-2xl font-bold" style={{ color: results ? "#16a34a" : "#94a3b8" }}>
              {results ? `${results.executionTimeMs}ms` : "—"}
            </div>
            <div className="text-xs mt-1" style={{ color: "#64748b" }}>Last Execution</div>
          </div>
        </div>

        {/* Editor + Side Panel */}
        <div className="flex gap-5 mb-6">
          {/* SQL Editor */}
          <div className="erp-card p-0 overflow-hidden flex-1">
            {/* Editor Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#374151" }}>
                  Query Editor
                </span>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {params.length} parameter{params.length !== 1 ? "s" : ""} detected
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <select
                  className="erp-input text-xs py-1.5"
                  style={{ width: "110px" }}
                  value={rowLimit}
                  onChange={(e) => setRowLimit(Number(e.target.value))}
                >
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={250}>250 rows</option>
                  <option value={500}>500 rows</option>
                  <option value={1000}>1000 rows</option>
                </select>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  Ctrl+Enter to run
                </span>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex" style={{ minHeight: "220px", maxHeight: "350px" }}>
              {/* Line Numbers */}
              <div
                className="select-none text-right px-3 py-3 overflow-hidden"
                style={{
                  ...editorFontStyle,
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRight: "1px solid #e2e8f0",
                  minWidth: "48px",
                }}
              >
                {sql.split("\n").map((_, i) => (
                  <div key={i} style={{ height: "1.6em" }}>
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Editor Area (overlay + textarea) */}
              <div className="flex-1 relative">
                {/* Syntax highlighted overlay */}
                <pre
                  className="absolute inset-0 p-3 m-0 pointer-events-none overflow-hidden"
                  style={{
                    ...editorFontStyle,
                    color: "#0f172a",
                    background: "white",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                    border: "none",
                  }}
                  aria-hidden="true"
                >
                  {highlightSQL(sql)}
                </pre>

                {/* Transparent textarea on top */}
                <textarea
                  ref={editorRef}
                  value={sql}
                  onChange={(e) => setSql(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="absolute inset-0 w-full h-full p-3 outline-none resize-none"
                  style={{
                    ...editorFontStyle,
                    color: "transparent",
                    caretColor: "#0f172a",
                    background: "transparent",
                    border: "none",
                    whiteSpace: "pre-wrap",
                    wordWrap: "break-word",
                  }}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                />
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="erp-card w-80 flex-shrink-0 overflow-hidden" style={{ alignSelf: "flex-start", maxHeight: "450px" }}>
            {/* Panel Tabs */}
            <div className="flex gap-0.5 mb-4 p-1 rounded-lg" style={{ background: "#f1f5f9" }}>
              {(["params", "schema", "saved", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActivePanel(tab)}
                  className="px-2 py-1.5 rounded-md text-xs font-medium flex-1 transition-all"
                  style={{
                    background: activePanel === tab ? "white" : "transparent",
                    color: activePanel === tab ? "#0f172a" : "#64748b",
                    boxShadow: activePanel === tab ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {tab === "params" ? `Params (${params.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div style={{ maxHeight: "360px", overflowY: "auto" }}>
              {/* ---- PARAMS PANEL ---- */}
              {activePanel === "params" && (
                <div>
                  {params.length === 0 ? (
                    <div className="text-sm p-3 rounded-lg" style={{ background: "#f8fafc", color: "#64748b" }}>
                      No parameters detected. Use{" "}
                      <code
                        className="font-mono text-xs"
                        style={{ background: "#ede9fe", color: "#7c3aed", padding: "2px 6px", borderRadius: "4px" }}
                      >
                        :paramName
                      </code>{" "}
                      in your SQL query to add parameters.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {params.map((param, idx) => (
                        <div
                          key={param.name}
                          className="p-3 rounded-lg"
                          style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-mono text-xs font-bold" style={{ color: "#2563eb" }}>
                              :{param.name}
                            </span>
                          </div>

                          {/* Type selector */}
                          <select
                            className="erp-input text-xs py-1.5 mb-2"
                            value={param.type}
                            onChange={(e) => updateParam(idx, "type", e.target.value)}
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="date">Date</option>
                            <option value="dropdown">Dropdown</option>
                          </select>

                          {/* Value input */}
                          {param.type === "dropdown" ? (
                            <>
                              <select
                                className="erp-input text-xs py-1.5 mb-2"
                                value={param.value}
                                onChange={(e) => updateParam(idx, "value", e.target.value)}
                              >
                                <option value="">Select...</option>
                                {param.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                              <input
                                className="erp-input text-xs py-1.5"
                                placeholder="Options (comma-separated)"
                                value={param.options?.join(", ") || ""}
                                onChange={(e) =>
                                  updateParam(
                                    idx,
                                    "options",
                                    e.target.value
                                      .split(",")
                                      .map((s) => s.trim())
                                      .filter(Boolean)
                                  )
                                }
                              />
                            </>
                          ) : param.type === "date" ? (
                            <input
                              type="date"
                              className="erp-input text-xs py-1.5"
                              value={param.value}
                              onChange={(e) => updateParam(idx, "value", e.target.value)}
                            />
                          ) : param.type === "number" ? (
                            <input
                              type="number"
                              className="erp-input text-xs py-1.5"
                              value={param.value}
                              placeholder={`Value for :${param.name}`}
                              onChange={(e) => updateParam(idx, "value", e.target.value)}
                            />
                          ) : (
                            <input
                              type="text"
                              className="erp-input text-xs py-1.5"
                              value={param.value}
                              placeholder={`Value for :${param.name}`}
                              onChange={(e) => updateParam(idx, "value", e.target.value)}
                            />
                          )}

                          {/* Default */}
                          <input
                            type="text"
                            className="erp-input text-xs py-1.5 mt-2"
                            placeholder="Default value"
                            value={param.defaultValue}
                            onChange={(e) => updateParam(idx, "defaultValue", e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---- SCHEMA PANEL ---- */}
              {activePanel === "schema" && (
                <div>
                  {schemaLoading ? (
                    <div className="text-sm text-center py-4" style={{ color: "#94a3b8" }}>
                      Loading schema...
                    </div>
                  ) : schema.length === 0 ? (
                    <div className="text-sm p-3 rounded-lg" style={{ background: "#fef3c7", color: "#92400e" }}>
                      Could not load schema. Make sure the database is connected and migrations have run.
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {schema.map((table) => (
                        <div key={table.name}>
                          <button
                            onClick={() => toggleTable(table.name)}
                            className="flex items-center gap-2 w-full text-left py-1.5 px-2 rounded text-sm transition-colors"
                            style={{ color: "#0f172a" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            <span style={{ fontSize: "10px", color: "#64748b" }}>
                              {expandedTables.has(table.name) ? "▼" : "▶"}
                            </span>
                            <span className="font-mono text-xs font-medium">{table.name}</span>
                            <span className="text-xs ml-auto" style={{ color: "#94a3b8" }}>
                              {table.columns.length} cols
                            </span>
                          </button>
                          {expandedTables.has(table.name) && (
                            <div className="ml-5 border-l pl-2 space-y-0.5 mb-1" style={{ borderColor: "#e2e8f0" }}>
                              {table.columns.map((col) => (
                                <div
                                  key={col.name}
                                  className="flex items-center gap-2 py-0.5 px-1 rounded text-xs cursor-pointer transition-colors"
                                  onClick={() => insertAtCursor(`"${table.name}"."${col.name}"`)}
                                  title={`Click to insert "${table.name}"."${col.name}"`}
                                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0f9ff")}
                                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                >
                                  <span className="font-mono" style={{ color: "#374151" }}>
                                    {col.name}
                                  </span>
                                  <span style={{ color: "#94a3b8" }}>{col.type}</span>
                                  {col.nullable && (
                                    <span style={{ color: "#d97706", fontSize: "10px" }}>NULL</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---- SAVED QUERIES PANEL ---- */}
              {activePanel === "saved" && (
                <div className="space-y-2">
                  {savedQueries.length === 0 ? (
                    <div className="text-sm" style={{ color: "#94a3b8" }}>No saved queries yet.</div>
                  ) : (
                    savedQueries.map((q) => (
                      <div
                        key={q.id}
                        className="p-3 rounded-lg cursor-pointer transition-colors"
                        style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f1f5f9")}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium" style={{ color: "#0f172a" }}>
                            {q.name}
                          </span>
                          <div className="flex gap-1">
                            {q.isTemplate && (
                              <span
                                className="badge text-xs"
                                style={{ background: "#ede9fe", color: "#7c3aed", fontSize: "10px", padding: "1px 6px" }}
                              >
                                Template
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className="font-mono text-xs mb-2 overflow-hidden"
                          style={{ color: "#64748b", maxHeight: "40px", lineHeight: "1.4" }}
                        >
                          {q.sql.split("\n").slice(0, 2).join(" ").substring(0, 80)}...
                        </div>
                        <div className="flex gap-2">
                          <button
                            className="erp-btn erp-btn-primary text-xs py-1 px-3"
                            onClick={(e) => {
                              e.stopPropagation();
                              loadQuery(q);
                            }}
                          >
                            Load
                          </button>
                          {!q.isTemplate && (
                            <button
                              className="text-xs px-2 py-1 rounded"
                              style={{ color: "#dc2626" }}
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteQuery(q.id);
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* ---- HISTORY PANEL ---- */}
              {activePanel === "history" && (
                <div className="space-y-2">
                  {queryHistory.length === 0 ? (
                    <div className="text-sm" style={{ color: "#94a3b8" }}>
                      No queries executed yet.
                    </div>
                  ) : (
                    queryHistory.map((h) => (
                      <div
                        key={h.id}
                        className="p-2.5 rounded-lg cursor-pointer transition-colors"
                        style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}
                        onClick={() => {
                          setSql(h.sql);
                          setActivePanel("params");
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#2563eb")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#f1f5f9")}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs" style={{ color: "#64748b" }}>
                            {new Date(h.executedAt).toLocaleTimeString()}
                          </span>
                          {h.error ? (
                            <span
                              className="badge text-xs"
                              style={{ background: "#fee2e2", color: "#991b1b", fontSize: "10px", padding: "1px 6px" }}
                            >
                              Error
                            </span>
                          ) : (
                            <span className="text-xs" style={{ color: "#16a34a" }}>
                              {h.rowCount} rows · {h.executionTimeMs}ms
                            </span>
                          )}
                        </div>
                        <div
                          className="font-mono text-xs overflow-hidden"
                          style={{ color: "#374151", maxHeight: "32px", lineHeight: "1.3" }}
                        >
                          {h.sql.split("\n").slice(0, 2).join(" ").substring(0, 80)}
                        </div>
                      </div>
                    ))
                  )}
                  {queryHistory.length > 0 && (
                    <button
                      className="text-xs w-full text-center py-2"
                      style={{ color: "#dc2626" }}
                      onClick={() => {
                        setQueryHistory([]);
                        localStorage.removeItem("erp-sql-history");
                      }}
                    >
                      Clear History
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            className="erp-card mb-6"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "16px" }}
          >
            <div className="flex items-start gap-3">
              <span style={{ color: "#dc2626", fontSize: "18px" }}>⚠</span>
              <div>
                <div className="text-sm font-medium mb-1" style={{ color: "#991b1b" }}>
                  Query Error
                </div>
                <div className="text-sm font-mono" style={{ color: "#b91c1c", wordBreak: "break-word" }}>
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="erp-card p-0 overflow-hidden">
            {/* Results Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: "#e2e8f0", background: "#f8fafc" }}
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-semibold" style={{ color: "#374151" }}>
                  Results
                </span>
                <span
                  className="badge text-xs"
                  style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px" }}
                >
                  {results.rowCount} row{results.rowCount !== 1 ? "s" : ""}
                  {results.limited ? " (limited)" : ""}
                </span>
                <span className="text-xs" style={{ color: "#64748b" }}>
                  Executed in {results.executionTimeMs}ms
                </span>
                <span className="text-xs" style={{ color: "#94a3b8" }}>
                  {results.columns.length} column{results.columns.length !== 1 ? "s" : ""}
                </span>
              </div>
              <button className="erp-btn erp-btn-secondary text-xs py-1.5" onClick={exportCSV}>
                Export CSV
              </button>
            </div>

            {/* Results Table */}
            {results.rowCount > 0 ? (
              <div style={{ maxHeight: "500px", overflow: "auto" }}>
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px", padding: "10px 8px" }}>#</th>
                      {results.columns.map((col) => (
                        <th
                          key={col}
                          style={{ cursor: "pointer", userSelect: "none" }}
                          onClick={() => handleSort(col)}
                        >
                          <div className="flex items-center gap-1">
                            {col}
                            {sortColumn === col && (
                              <span style={{ color: "#2563eb" }}>
                                {sortDirection === "asc" ? "↑" : "↓"}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map((row, idx) => (
                      <tr key={idx}>
                        <td
                          className="text-xs"
                          style={{ color: "#94a3b8", padding: "10px 8px", textAlign: "center" }}
                        >
                          {idx + 1}
                        </td>
                        {results.columns.map((col) => {
                          const val = row[col];
                          const isNull = val === null || val === undefined;
                          return (
                            <td
                              key={col}
                              className="font-mono text-xs"
                              style={{
                                color: isNull ? "#94a3b8" : "#374151",
                                fontStyle: isNull ? "italic" : "normal",
                                maxWidth: "300px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={formatCellValue(val)}
                            >
                              {formatCellValue(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="text-sm" style={{ color: "#64748b" }}>
                  Query returned 0 rows.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state when no results and no error */}
        {!results && !error && !loading && (
          <div className="erp-card text-center py-12">
            <div className="text-4xl mb-3">🖥️</div>
            <div className="text-lg font-semibold mb-2" style={{ color: "#0f172a" }}>
              SQL Query Console
            </div>
            <div className="text-sm mb-4" style={{ color: "#64748b", maxWidth: "400px", margin: "0 auto" }}>
              Write a SQL query above and click{" "}
              <strong style={{ color: "#2563eb" }}>Run Query</strong> or press{" "}
              <kbd
                className="font-mono text-xs px-1.5 py-0.5 rounded"
                style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }}
              >
                Ctrl+Enter
              </kbd>{" "}
              to execute. Load a template query from the{" "}
              <strong style={{ color: "#7c3aed" }}>Saved</strong> tab to get started.
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <span className="badge text-xs" style={{ background: "#f0fdf4", color: "#166534" }}>
                Read-Only (SELECT)
              </span>
              <span className="badge text-xs" style={{ background: "#eff6ff", color: "#1e40af" }}>
                Parameterized Queries
              </span>
              <span className="badge text-xs" style={{ background: "#ede9fe", color: "#7c3aed" }}>
                CSV Export
              </span>
              <span className="badge text-xs" style={{ background: "#fff7ed", color: "#9a3412" }}>
                Up to 1000 rows
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SqlConsolePage() {
  return (
    <Suspense fallback={<div className="p-8">Loading SQL Console...</div>}>
      <SqlConsoleContent />
    </Suspense>
  );
}
