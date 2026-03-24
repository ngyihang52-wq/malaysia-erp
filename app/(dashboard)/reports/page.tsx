"use client";

import { useState, useCallback, useEffect, useRef, DragEvent } from "react";
import {
  BarChart3,
  Play,
  Download,
  Save,
  FolderOpen,
  Trash2,
  Plus,
  X,
  GripVertical,
  Table,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Loader2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ─────────────────── TYPES ─────────────────── */

interface ColumnInfo {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "boolean" | "enum";
  enumValues?: string[];
}

interface DataSourceOption {
  key: string;
  label: string;
  columns: ColumnInfo[];
}

interface CalcField {
  id: string;
  name: string;
  columnA: string;
  operator: "+" | "-" | "*" | "/";
  columnBType: "column" | "constant";
  columnB: string;
  constant: number;
}

interface SavedReport {
  name: string;
  source: string;
  columns: string[];
  filters: Filters;
  calcFields: CalcField[];
  savedAt: string;
}

interface Filters {
  dateField: string;
  dateFrom: string;
  dateTo: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  platform: string;
  search: string;
}

type ChartView = "table" | "bar" | "line" | "pie";

/* ─────────────────── DATA SOURCES (mirror server definitions) ─────────────────── */

const DATA_SOURCES: DataSourceOption[] = [
  {
    key: "orders",
    label: "Orders",
    columns: [
      { key: "orderNumber", label: "Order Number", type: "string" },
      { key: "status", label: "Status", type: "enum", enumValues: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] },
      { key: "paymentStatus", label: "Payment Status", type: "enum", enumValues: ["PENDING", "PAID", "PARTIAL", "REFUNDED", "FAILED"] },
      { key: "fulfillmentStatus", label: "Fulfillment", type: "enum", enumValues: ["UNFULFILLED", "PARTIAL", "FULFILLED", "RETURNED"] },
      { key: "customerName", label: "Customer Name", type: "string" },
      { key: "platform", label: "Platform", type: "string" },
      { key: "subtotal", label: "Subtotal", type: "number" },
      { key: "shippingFee", label: "Shipping", type: "number" },
      { key: "discount", label: "Discount", type: "number" },
      { key: "tax", label: "Tax", type: "number" },
      { key: "total", label: "Total", type: "number" },
      { key: "currency", label: "Currency", type: "string" },
      { key: "placedAt", label: "Placed Date", type: "date" },
      { key: "shippedAt", label: "Shipped Date", type: "date" },
      { key: "deliveredAt", label: "Delivered Date", type: "date" },
    ],
  },
  {
    key: "products",
    label: "Products",
    columns: [
      { key: "sku", label: "SKU", type: "string" },
      { key: "name", label: "Name", type: "string" },
      { key: "category", label: "Category", type: "string" },
      { key: "brand", label: "Brand", type: "string" },
      { key: "costPrice", label: "Cost Price", type: "number" },
      { key: "isActive", label: "Active", type: "boolean" },
      { key: "totalStock", label: "Total Stock", type: "number" },
      { key: "channelCount", label: "Channel Count", type: "number" },
      { key: "createdAt", label: "Created Date", type: "date" },
    ],
  },
  {
    key: "customers",
    label: "Customers",
    columns: [
      { key: "name", label: "Name", type: "string" },
      { key: "email", label: "Email", type: "string" },
      { key: "phone", label: "Phone", type: "string" },
      { key: "city", label: "City", type: "string" },
      { key: "state", label: "State", type: "string" },
      { key: "country", label: "Country", type: "string" },
      { key: "platform", label: "Platform", type: "enum", enumValues: ["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"] },
      { key: "totalOrders", label: "Total Orders", type: "number" },
      { key: "totalSpent", label: "Total Spent", type: "number" },
      { key: "createdAt", label: "Joined Date", type: "date" },
    ],
  },
  {
    key: "inventory",
    label: "Inventory",
    columns: [
      { key: "productName", label: "Product Name", type: "string" },
      { key: "productSku", label: "SKU", type: "string" },
      { key: "warehouseName", label: "Warehouse", type: "string" },
      { key: "quantity", label: "Quantity", type: "number" },
      { key: "reservedQty", label: "Reserved", type: "number" },
      { key: "reorderPoint", label: "Reorder Point", type: "number" },
      { key: "reorderQty", label: "Reorder Qty", type: "number" },
      { key: "available", label: "Available", type: "number" },
    ],
  },
];

const CHART_COLORS = ["#000080", "#6D8196", "#ADD8E6", "#4A6FA5", "#8BA7C2", "#2C4A8A", "#5B7DA8", "#9CC0D8"];

const emptyFilters: Filters = {
  dateField: "",
  dateFrom: "",
  dateTo: "",
  status: "",
  paymentStatus: "",
  fulfillmentStatus: "",
  platform: "",
  search: "",
};

/* ─────────────────── PAGE COMPONENT ─────────────────── */

export default function ReportsPage() {
  // Data source
  const [source, setSource] = useState("orders");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters });

  // Calculated fields
  const [calcFields, setCalcFields] = useState<CalcField[]>([]);

  // Results
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columnDefs, setColumnDefs] = useState<ColumnInfo[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasRun, setHasRun] = useState(false);

  // Chart
  const [chartView, setChartView] = useState<ChartView>("table");

  // Saved reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Drag state
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);

  // Current source definition
  const sourceDef = DATA_SOURCES.find((s) => s.key === source)!;
  const availableColumns = sourceDef.columns.filter(
    (c) => !selectedColumns.includes(c.key)
  );
  const selectedColumnDefs = selectedColumns
    .map((k) => sourceDef.columns.find((c) => c.key === k))
    .filter(Boolean) as ColumnInfo[];

  // Number columns for calc fields
  const numberColumns = selectedColumnDefs.filter((c) => c.type === "number");

  // Date columns for date filter
  const dateColumns = sourceDef.columns.filter((c) => c.type === "date");

  // Load saved reports from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("erp_saved_reports");
      if (saved) setSavedReports(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  /* ─── Source Change ─── */
  const handleSourceChange = (newSource: string) => {
    setSource(newSource);
    setSelectedColumns([]);
    setCalcFields([]);
    setFilters({ ...emptyFilters });
    setRows([]);
    setColumnDefs([]);
    setHasRun(false);
    setError("");
  };

  /* ─── Drag & Drop (Available → Selected) ─── */
  const onDragStartAvailable = (e: DragEvent, key: string) => {
    e.dataTransfer.setData("text/plain", key);
    e.dataTransfer.effectAllowed = "move";
    dragItem.current = key;
  };

  const onDropSelected = (e: DragEvent) => {
    e.preventDefault();
    const key = e.dataTransfer.getData("text/plain");
    if (key && !selectedColumns.includes(key)) {
      setSelectedColumns((prev) => [...prev, key]);
    }
    dragItem.current = null;
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  /* ─── Reorder Selected Columns ─── */
  const onDragStartSelected = (e: DragEvent, key: string) => {
    e.dataTransfer.setData("text/plain", key);
    dragItem.current = key;
  };

  const onDragOverSelected = (e: DragEvent, key: string) => {
    e.preventDefault();
    dragOverItem.current = key;
  };

  const onDropReorder = (e: DragEvent) => {
    e.preventDefault();
    const fromKey = dragItem.current;
    const toKey = dragOverItem.current;
    if (!fromKey || !toKey || fromKey === toKey) return;

    setSelectedColumns((prev) => {
      const updated = [...prev];
      const fromIdx = updated.indexOf(fromKey);
      const toIdx = updated.indexOf(toKey);
      if (fromIdx === -1 || toIdx === -1) return prev;
      updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, fromKey);
      return updated;
    });

    dragItem.current = null;
    dragOverItem.current = null;
  };

  const removeColumn = (key: string) => {
    setSelectedColumns((prev) => prev.filter((k) => k !== key));
    // Remove calc fields that reference this column
    setCalcFields((prev) =>
      prev.filter((f) => f.columnA !== key && (f.columnBType !== "column" || f.columnB !== key))
    );
  };

  const addAllColumns = () => {
    setSelectedColumns(sourceDef.columns.map((c) => c.key));
  };

  const clearColumns = () => {
    setSelectedColumns([]);
    setCalcFields([]);
  };

  /* ─── Calculated Fields ─── */
  const addCalcField = () => {
    if (numberColumns.length === 0) return;
    setCalcFields((prev) => [
      ...prev,
      {
        id: `calc_${Date.now()}`,
        name: `Calculated ${prev.length + 1}`,
        columnA: numberColumns[0]?.key || "",
        operator: "+",
        columnBType: "column",
        columnB: numberColumns[0]?.key || "",
        constant: 0,
      },
    ]);
  };

  const updateCalcField = (id: string, updates: Partial<CalcField>) => {
    setCalcFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const removeCalcField = (id: string) => {
    setCalcFields((prev) => prev.filter((f) => f.id !== id));
  };

  /* ─── Run Report ─── */
  const runReport = useCallback(async () => {
    if (selectedColumns.length === 0) {
      setError("Select at least one column");
      return;
    }

    setLoading(true);
    setError("");
    setHasRun(true);

    try {
      // Build filter payload
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const filterPayload: Record<string, any> = {};
      if (filters.dateField && (filters.dateFrom || filters.dateTo)) {
        filterPayload.dateRange = {
          field: filters.dateField,
          ...(filters.dateFrom && { from: filters.dateFrom }),
          ...(filters.dateTo && { to: filters.dateTo }),
        };
      }
      if (filters.status) filterPayload.status = filters.status;
      if (filters.paymentStatus) filterPayload.paymentStatus = filters.paymentStatus;
      if (filters.fulfillmentStatus) filterPayload.fulfillmentStatus = filters.fulfillmentStatus;
      if (filters.platform) filterPayload.platform = filters.platform;
      if (filters.search) filterPayload.search = filters.search;

      const res = await fetch("/api/reports/query", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          columns: selectedColumns,
          filters: Object.keys(filterPayload).length > 0 ? filterPayload : undefined,
          limit: 1000,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Query failed");

      setColumnDefs(json.data.columns);
      setRows(json.data.rows);
      setTotalCount(json.data.totalCount);
    } catch (err) {
      setError((err as Error).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [source, selectedColumns, filters]);

  /* ─── Apply Calculated Fields ─── */
  const computedRows = rows.map((row) => {
    const r = { ...row };
    for (const cf of calcFields) {
      const a = Number(r[cf.columnA]) || 0;
      const b = cf.columnBType === "column" ? Number(r[cf.columnB]) || 0 : cf.constant;
      switch (cf.operator) {
        case "+": r[cf.id] = a + b; break;
        case "-": r[cf.id] = a - b; break;
        case "*": r[cf.id] = a * b; break;
        case "/": r[cf.id] = b !== 0 ? a / b : 0; break;
      }
    }
    return r;
  });

  // All display columns (selected + calc fields)
  const displayColumns: { key: string; label: string; type: string }[] = [
    ...columnDefs,
    ...calcFields.map((f) => ({ key: f.id, label: f.name, type: "number" as const })),
  ];

  /* ─── Export CSV ─── */
  const exportCSV = () => {
    if (computedRows.length === 0) return;

    const headers = displayColumns.map((c) => c.label);
    const csvRows = computedRows.map((row) =>
      displayColumns.map((c) => {
        const val = row[c.key];
        if (val === null || val === undefined) return "";
        if (typeof val === "number") return val.toFixed(2);
        const str = String(val);
        // Escape CSV
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
    );

    const csv = [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${source}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Save / Load Templates ─── */
  const saveReport = () => {
    if (!saveName.trim()) return;
    const report: SavedReport = {
      name: saveName.trim(),
      source,
      columns: selectedColumns,
      filters,
      calcFields,
      savedAt: new Date().toISOString(),
    };
    const updated = [...savedReports.filter((r) => r.name !== report.name), report];
    setSavedReports(updated);
    localStorage.setItem("erp_saved_reports", JSON.stringify(updated));
    setSaveName("");
    setShowSaveDialog(false);
  };

  const loadReport = (report: SavedReport) => {
    setSource(report.source);
    setSelectedColumns(report.columns);
    setFilters(report.filters);
    setCalcFields(report.calcFields);
    setRows([]);
    setHasRun(false);
    setError("");
  };

  const deleteReport = (name: string) => {
    const updated = savedReports.filter((r) => r.name !== name);
    setSavedReports(updated);
    localStorage.setItem("erp_saved_reports", JSON.stringify(updated));
  };

  /* ─── Chart Data Prep ─── */
  const chartData = (() => {
    if (computedRows.length === 0) return [];
    const labelCol = displayColumns.find((c) => c.type === "string" || c.type === "date" || c.type === "enum");
    const numCols = displayColumns.filter((c) => c.type === "number");
    if (!labelCol || numCols.length === 0) return [];

    return computedRows.slice(0, 20).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const item: Record<string, any> = {
        label: row[labelCol.key] != null
          ? labelCol.type === "date"
            ? new Date(row[labelCol.key] as string).toLocaleDateString()
            : String(row[labelCol.key])
          : "N/A",
      };
      for (const nc of numCols) {
        item[nc.label] = Number(row[nc.key]) || 0;
      }
      return item;
    });
  })();

  const numColLabels = displayColumns.filter((c) => c.type === "number").map((c) => c.label);

  /* ─── Render ─── */
  return (
    <div className="h-full flex flex-col" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid #E2E8F0" }}
      >
        <div className="flex items-center gap-3">
          <BarChart3 size={20} style={{ color: "#000080" }} />
          <h1 className="text-lg font-semibold" style={{ color: "#0F172A" }}>
            Report Builder
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            disabled={computedRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded disabled:opacity-40 transition-colors"
            style={{ background: "#F1F5F9", color: "#334155" }}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={selectedColumns.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded disabled:opacity-40 transition-colors"
            style={{ background: "#F1F5F9", color: "#334155" }}
          >
            <Save size={13} /> Save
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Sources & Saved */}
        <div
          className="w-[200px] flex-shrink-0 overflow-y-auto p-4"
          style={{ borderRight: "1px solid #E2E8F0", background: "#F8FAFC" }}
        >
          {/* Data Sources */}
          <p className="text-[9px] tracking-[0.25em] uppercase mb-2" style={{ color: "#64748B" }}>
            Data Sources
          </p>
          <div className="space-y-1 mb-6">
            {DATA_SOURCES.map((ds) => (
              <button
                key={ds.key}
                onClick={() => handleSourceChange(ds.key)}
                className="w-full text-left px-3 py-2 text-xs rounded transition-colors"
                style={{
                  background: source === ds.key ? "#000080" : "transparent",
                  color: source === ds.key ? "#FFFFFF" : "#334155",
                }}
              >
                {ds.label}
              </button>
            ))}
          </div>

          {/* Saved Reports */}
          <p className="text-[9px] tracking-[0.25em] uppercase mb-2" style={{ color: "#64748B" }}>
            Saved Reports
          </p>
          {savedReports.length === 0 ? (
            <p className="text-[10px] px-3" style={{ color: "#94A3B8" }}>
              No saved reports yet
            </p>
          ) : (
            <div className="space-y-1">
              {savedReports.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center gap-1 group"
                >
                  <button
                    onClick={() => loadReport(r)}
                    className="flex-1 text-left px-2 py-1.5 text-[11px] rounded truncate hover:bg-gray-100 transition-colors"
                    style={{ color: "#334155" }}
                    title={`${r.source} — ${r.columns.length} columns`}
                  >
                    <FolderOpen size={10} className="inline mr-1" style={{ color: "#6D8196" }} />
                    {r.name}
                  </button>
                  <button
                    onClick={() => deleteReport(r.name)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
                    style={{ color: "#94A3B8" }}
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel — Builder */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Column Picker */}
          <div
            className="rounded-lg p-4"
            style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "#0F172A" }}>
                Column Picker
              </p>
              <div className="flex gap-2">
                <button
                  onClick={addAllColumns}
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: "#F1F5F9", color: "#64748B" }}
                >
                  Add All
                </button>
                <button
                  onClick={clearColumns}
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{ background: "#F1F5F9", color: "#64748B" }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Available */}
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>
                  Available ({availableColumns.length})
                </p>
                <div
                  className="min-h-[120px] max-h-[200px] overflow-y-auto rounded p-2 space-y-1"
                  style={{ background: "#F8FAFC", border: "1px dashed #CBD5E1" }}
                >
                  {availableColumns.map((col) => (
                    <div
                      key={col.key}
                      draggable
                      onDragStart={(e) => onDragStartAvailable(e, col.key)}
                      className="flex items-center gap-2 px-2 py-1.5 text-[11px] rounded cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors"
                      style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#334155" }}
                    >
                      <GripVertical size={10} style={{ color: "#CBD5E1" }} />
                      <span className="flex-1">{col.label}</span>
                      <span
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: "#F1F5F9", color: "#94A3B8" }}
                      >
                        {col.type}
                      </span>
                    </div>
                  ))}
                  {availableColumns.length === 0 && (
                    <p className="text-[10px] text-center py-4" style={{ color: "#94A3B8" }}>
                      All columns selected
                    </p>
                  )}
                </div>
              </div>

              {/* Selected */}
              <div>
                <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: "#94A3B8" }}>
                  Selected ({selectedColumns.length})
                </p>
                <div
                  className="min-h-[120px] max-h-[200px] overflow-y-auto rounded p-2 space-y-1"
                  style={{
                    background: selectedColumns.length > 0 ? "#F0F4FF" : "#F8FAFC",
                    border: `1px dashed ${selectedColumns.length > 0 ? "#000080" : "#CBD5E1"}`,
                  }}
                  onDragOver={onDragOver}
                  onDrop={onDropSelected}
                >
                  {selectedColumnDefs.map((col) => (
                    <div
                      key={col.key}
                      draggable
                      onDragStart={(e) => onDragStartSelected(e, col.key)}
                      onDragOver={(e) => onDragOverSelected(e, col.key)}
                      onDrop={onDropReorder}
                      className="flex items-center gap-2 px-2 py-1.5 text-[11px] rounded cursor-grab active:cursor-grabbing transition-colors"
                      style={{ background: "#FFFFFF", border: "1px solid #C7D2FE", color: "#1E293B" }}
                    >
                      <GripVertical size={10} style={{ color: "#A5B4FC" }} />
                      <span className="flex-1">{col.label}</span>
                      <button onClick={() => removeColumn(col.key)} className="p-0.5" style={{ color: "#94A3B8" }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                  {selectedColumns.length === 0 && (
                    <p className="text-[10px] text-center py-4" style={{ color: "#94A3B8" }}>
                      Drag columns here
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div
            className="rounded-lg p-4"
            style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
          >
            <p className="text-xs font-medium mb-3" style={{ color: "#0F172A" }}>
              Filters
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Date Range */}
              {dateColumns.length > 0 && (
                <>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>Date Field</label>
                    <select
                      value={filters.dateField}
                      onChange={(e) => setFilters((f) => ({ ...f, dateField: e.target.value }))}
                      className="w-full px-2 py-1.5 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    >
                      <option value="">None</option>
                      {dateColumns.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>From</label>
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                      className="w-full px-2 py-1.5 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>To</label>
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                      className="w-full px-2 py-1.5 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    />
                  </div>
                </>
              )}

              {/* Status (orders only) */}
              {source === "orders" && (
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    className="w-full px-2 py-1.5 text-[11px] rounded"
                    style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                  >
                    <option value="">All</option>
                    {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Platform */}
              {(source === "orders" || source === "customers") && (
                <div>
                  <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>Platform</label>
                  <select
                    value={filters.platform}
                    onChange={(e) => setFilters((f) => ({ ...f, platform: e.target.value }))}
                    className="w-full px-2 py-1.5 text-[11px] rounded"
                    style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                  >
                    <option value="">All</option>
                    {["SHOPIFY", "TIKTOK", "SHOPEE", "LAZADA", "AMAZON"].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Search */}
              <div>
                <label className="text-[10px] block mb-1" style={{ color: "#64748B" }}>Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  placeholder="Search..."
                  className="w-full px-2 py-1.5 text-[11px] rounded"
                  style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                />
              </div>
            </div>
          </div>

          {/* Calculated Fields */}
          <div
            className="rounded-lg p-4"
            style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "#0F172A" }}>
                Calculated Fields
              </p>
              <button
                onClick={addCalcField}
                disabled={numberColumns.length === 0}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded disabled:opacity-40"
                style={{ background: "#F1F5F9", color: "#334155" }}
              >
                <Plus size={10} /> Add Field
              </button>
            </div>

            {calcFields.length === 0 ? (
              <p className="text-[10px]" style={{ color: "#94A3B8" }}>
                {numberColumns.length === 0
                  ? "Select number columns first to create calculations"
                  : "Add calculated fields to create custom math columns (e.g. Profit = Total - Cost)"}
              </p>
            ) : (
              <div className="space-y-2">
                {calcFields.map((cf) => (
                  <div
                    key={cf.id}
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <input
                      value={cf.name}
                      onChange={(e) => updateCalcField(cf.id, { name: e.target.value })}
                      className="w-[120px] px-2 py-1 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                      placeholder="Field name"
                    />
                    <span className="text-[10px]" style={{ color: "#94A3B8" }}>=</span>

                    <select
                      value={cf.columnA}
                      onChange={(e) => updateCalcField(cf.id, { columnA: e.target.value })}
                      className="px-2 py-1 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    >
                      {numberColumns.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                      {/* Also allow referencing previous calc fields */}
                      {calcFields.filter((f) => f.id !== cf.id).map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))}
                    </select>

                    <select
                      value={cf.operator}
                      onChange={(e) => updateCalcField(cf.id, { operator: e.target.value as CalcField["operator"] })}
                      className="w-[50px] px-1 py-1 text-[11px] rounded text-center"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    >
                      <option value="+">+</option>
                      <option value="-">-</option>
                      <option value="*">x</option>
                      <option value="/">/</option>
                    </select>

                    <select
                      value={cf.columnBType}
                      onChange={(e) => updateCalcField(cf.id, { columnBType: e.target.value as "column" | "constant" })}
                      className="px-2 py-1 text-[11px] rounded"
                      style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                    >
                      <option value="column">Column</option>
                      <option value="constant">Constant</option>
                    </select>

                    {cf.columnBType === "column" ? (
                      <select
                        value={cf.columnB}
                        onChange={(e) => updateCalcField(cf.id, { columnB: e.target.value })}
                        className="px-2 py-1 text-[11px] rounded"
                        style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                      >
                        {numberColumns.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                        {calcFields.filter((f) => f.id !== cf.id).map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        value={cf.constant}
                        onChange={(e) => updateCalcField(cf.id, { constant: parseFloat(e.target.value) || 0 })}
                        className="w-[80px] px-2 py-1 text-[11px] rounded"
                        style={{ border: "1px solid #E2E8F0", color: "#334155" }}
                      />
                    )}

                    <button onClick={() => removeCalcField(cf.id)} className="p-0.5" style={{ color: "#94A3B8" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={runReport}
              disabled={loading || selectedColumns.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium rounded text-white disabled:opacity-50 transition-colors"
              style={{ background: "#000080" }}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
              {loading ? "Running..." : "Run Report"}
            </button>
            {hasRun && !loading && !error && (
              <span className="text-[11px]" style={{ color: "#64748B" }}>
                Showing {computedRows.length} of {totalCount} rows
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded text-xs"
              style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA" }}
            >
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Results */}
          {hasRun && !error && (
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: "1px solid #E2E8F0", background: "#FFFFFF" }}
            >
              {/* View Toggle */}
              <div
                className="flex items-center gap-1 px-4 py-2"
                style={{ borderBottom: "1px solid #E2E8F0", background: "#F8FAFC" }}
              >
                {([
                  { key: "table", icon: Table, label: "Table" },
                  { key: "bar", icon: BarChartIcon, label: "Bar" },
                  { key: "line", icon: TrendingUp, label: "Line" },
                  { key: "pie", icon: PieChartIcon, label: "Pie" },
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setChartView(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] rounded transition-colors"
                    style={{
                      background: chartView === key ? "#000080" : "transparent",
                      color: chartView === key ? "#FFFFFF" : "#64748B",
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-4">
                {computedRows.length === 0 ? (
                  <div className="flex flex-col items-center py-10 gap-2">
                    <FileSpreadsheet size={32} style={{ color: "#CBD5E1" }} />
                    <p className="text-xs" style={{ color: "#94A3B8" }}>No data found</p>
                  </div>
                ) : chartView === "table" ? (
                  /* Table View */
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-[11px]">
                      <thead>
                        <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                          <th className="text-left px-3 py-2 font-medium" style={{ color: "#64748B" }}>
                            #
                          </th>
                          {displayColumns.map((col) => (
                            <th
                              key={col.key}
                              className="text-left px-3 py-2 font-medium whitespace-nowrap"
                              style={{ color: "#64748B" }}
                            >
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {computedRows.map((row, idx) => (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid #F1F5F9" }}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-2" style={{ color: "#94A3B8" }}>
                              {idx + 1}
                            </td>
                            {displayColumns.map((col) => (
                              <td key={col.key} className="px-3 py-2 whitespace-nowrap" style={{ color: "#1E293B" }}>
                                {formatCell(row[col.key], col.type)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : chartView === "bar" ? (
                  /* Bar Chart */
                  <div className="h-[350px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: "#64748B" }}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          {numColLabels.slice(0, 4).map((label, i) => (
                            <Bar key={label} dataKey={label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-center py-10" style={{ color: "#94A3B8" }}>
                        Need at least one text/date column and one number column for charts
                      </p>
                    )}
                  </div>
                ) : chartView === "line" ? (
                  /* Line Chart */
                  <div className="h-[350px]">
                    {chartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: "#64748B" }}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis tick={{ fontSize: 10, fill: "#64748B" }} />
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          {numColLabels.slice(0, 4).map((label, i) => (
                            <Line
                              key={label}
                              type="monotone"
                              dataKey={label}
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 3 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-center py-10" style={{ color: "#94A3B8" }}>
                        Need at least one text/date column and one number column for charts
                      </p>
                    )}
                  </div>
                ) : (
                  /* Pie Chart */
                  <div className="h-[350px]">
                    {chartData.length > 0 && numColLabels.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            dataKey={numColLabels[0]}
                            nameKey="label"
                            cx="50%"
                            cy="50%"
                            outerRadius={120}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            label={(props: any) =>
                              `${props.name ?? ""}: ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
                            }
                            labelLine={{ stroke: "#94A3B8" }}
                          >
                            {chartData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 11 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-xs text-center py-10" style={{ color: "#94A3B8" }}>
                        Need at least one text/date column and one number column for charts
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div
            className="rounded-lg p-5 w-[340px] shadow-lg"
            style={{ background: "#FFFFFF" }}
          >
            <p className="text-sm font-medium mb-3" style={{ color: "#0F172A" }}>
              Save Report Template
            </p>
            <input
              autoFocus
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveReport()}
              placeholder="Report name..."
              className="w-full px-3 py-2 text-xs rounded mb-3"
              style={{ border: "1px solid #E2E8F0", color: "#334155" }}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowSaveDialog(false); setSaveName(""); }}
                className="px-3 py-1.5 text-xs rounded"
                style={{ background: "#F1F5F9", color: "#64748B" }}
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                disabled={!saveName.trim()}
                className="px-3 py-1.5 text-xs rounded text-white disabled:opacity-40"
                style={{ background: "#000080" }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── CELL FORMATTER ─────────────────── */

function formatCell(value: unknown, type: string): string {
  if (value === null || value === undefined) return "—";
  if (type === "date") {
    try {
      return new Date(value as string).toLocaleDateString("en-MY", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return String(value);
    }
  }
  if (type === "number") {
    const num = Number(value);
    if (isNaN(num)) return String(value);
    return num % 1 === 0 ? num.toLocaleString() : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  if (type === "boolean") return value ? "Yes" : "No";
  return String(value);
}
