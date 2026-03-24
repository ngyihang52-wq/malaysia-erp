/**
 * Report Builder — Secure Query API
 *
 * POST /api/reports/query
 *
 * Accepts a JSON body with:
 *   source   — data source key (orders, products, customers, inventory)
 *   columns  — array of whitelisted column keys
 *   filters  — optional: dateRange, status, platform, search
 *   sort     — optional: { column, direction }
 *   limit    — optional: max rows (capped at 1000)
 *
 * All columns are validated against the whitelist in report-definitions.ts.
 * All queries are scoped by orgId from JWT — no cross-tenant data access.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { aj } from "@/lib/arcjet";
import {
  getSourceDef,
  validateColumns,
  getColumnDef,
  type ColumnDef,
} from "@/lib/report-definitions";

interface ReportRequest {
  source: string;
  columns: string[];
  filters?: {
    dateRange?: { field: string; from?: string; to?: string };
    status?: string;
    paymentStatus?: string;
    fulfillmentStatus?: string;
    platform?: string;
    search?: string;
  };
  sort?: { column: string; direction: "asc" | "desc" };
  limit?: number;
}

const MAX_ROWS = 1000;
const DEFAULT_LIMIT = 500;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    // Auth
    const auth = await requireAuth(request);

    // Parse body
    const body: ReportRequest = await request.json();
    const { source, columns, filters, sort } = body;
    const limit = Math.min(body.limit || DEFAULT_LIMIT, MAX_ROWS);

    // Validate source
    const sourceDef = getSourceDef(source);
    if (!sourceDef) {
      return NextResponse.json(
        { error: `Invalid data source: ${source}` },
        { status: 400 }
      );
    }

    // Validate columns
    if (!columns || columns.length === 0) {
      return NextResponse.json(
        { error: "At least one column is required" },
        { status: 400 }
      );
    }
    if (!validateColumns(source, columns)) {
      return NextResponse.json(
        { error: "One or more invalid columns" },
        { status: 400 }
      );
    }

    // Validate sort column if provided
    if (sort && !validateColumns(source, [sort.column])) {
      return NextResponse.json(
        { error: `Invalid sort column: ${sort.column}` },
        { status: 400 }
      );
    }

    // Validate date range field if provided
    if (filters?.dateRange?.field && !validateColumns(source, [filters.dateRange.field])) {
      return NextResponse.json(
        { error: `Invalid date range field: ${filters.dateRange.field}` },
        { status: 400 }
      );
    }

    // Build and execute query based on source
    const result = await executeQuery(
      sourceDef.prismaModel,
      source,
      columns,
      filters,
      sort,
      limit,
      auth.orgId
    );

    // Get column definitions for the response
    const columnDefs = columns
      .map((col) => getColumnDef(source, col))
      .filter(Boolean) as ColumnDef[];

    return NextResponse.json({
      success: true,
      data: {
        columns: columnDefs.map((c) => ({
          key: c.key,
          label: c.label,
          type: c.type,
        })),
        rows: result.rows,
        rowCount: result.rows.length,
        totalCount: result.totalCount,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Reports API]", error);
    return NextResponse.json(
      { error: `Query failed: ${message}` },
      { status: 500 }
    );
  }
}

/* ─────────────────── QUERY BUILDER ─────────────────── */

async function executeQuery(
  prismaModel: string,
  sourceKey: string,
  columns: string[],
  filters: ReportRequest["filters"],
  sort: ReportRequest["sort"],
  limit: number,
  orgId: string
): Promise<{ rows: Record<string, unknown>[]; totalCount: number }> {
  // Build the where clause (always org-scoped)
  const where = buildWhere(sourceKey, filters, orgId);

  // Build select + include from column definitions
  const { select, include } = buildSelect(sourceKey, columns);

  // Build orderBy
  const orderBy = buildOrderBy(sourceKey, sort);

  // Determine which Prisma model to query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const model = (prisma as any)[prismaModel];
  if (!model) {
    throw new Error(`Unknown Prisma model: ${prismaModel}`);
  }

  // Execute count + findMany in parallel
  const [totalCount, rawRows] = await Promise.all([
    model.count({ where }),
    model.findMany({
      where,
      ...(Object.keys(select).length > 0 ? { select: { ...select, ...flattenIncludeToSelect(include) } } : {}),
      ...(Object.keys(include).length > 0 && Object.keys(select).length === 0 ? { include } : {}),
      orderBy,
      take: limit,
    }),
  ]);

  // Transform rows — flatten relations and compute calculated fields
  const rows = rawRows.map((row: Record<string, unknown>) =>
    transformRow(sourceKey, columns, row)
  );

  return { rows, totalCount };
}

/* ─────────────────── WHERE BUILDER ─────────────────── */

function buildWhere(
  sourceKey: string,
  filters: ReportRequest["filters"],
  orgId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {};

  // Org scoping
  if (sourceKey === "inventory") {
    where.product = { orgId };
  } else {
    where.orgId = orgId;
  }

  if (!filters) return where;

  // Date range filter
  if (filters.dateRange) {
    const colDef = getColumnDef(sourceKey, filters.dateRange.field);
    if (colDef && !colDef.computed) {
      const fieldPath = colDef.prismaField;
      // Only handle direct fields (no relation paths for date filtering)
      if (!fieldPath.includes(".")) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateFilter: Record<string, any> = {};
        if (filters.dateRange.from) dateFilter.gte = new Date(filters.dateRange.from);
        if (filters.dateRange.to) dateFilter.lte = new Date(filters.dateRange.to);
        if (Object.keys(dateFilter).length > 0) {
          where[fieldPath] = dateFilter;
        }
      }
    }
  }

  // Status filter (orders)
  if (filters.status && sourceKey === "orders") {
    where.status = filters.status;
  }

  // Payment status filter (orders)
  if (filters.paymentStatus && sourceKey === "orders") {
    where.paymentStatus = filters.paymentStatus;
  }

  // Fulfillment status filter (orders)
  if (filters.fulfillmentStatus && sourceKey === "orders") {
    where.fulfillmentStatus = filters.fulfillmentStatus;
  }

  // Platform filter
  if (filters.platform) {
    if (sourceKey === "orders") {
      where.integration = { platform: filters.platform };
    } else if (sourceKey === "customers") {
      where.platform = filters.platform;
    }
  }

  // Search filter
  if (filters.search) {
    const searchTerm = filters.search;
    switch (sourceKey) {
      case "orders":
        where.OR = [
          { orderNumber: { contains: searchTerm, mode: "insensitive" } },
          { customer: { name: { contains: searchTerm, mode: "insensitive" } } },
        ];
        break;
      case "products":
        where.OR = [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { sku: { contains: searchTerm, mode: "insensitive" } },
          { category: { contains: searchTerm, mode: "insensitive" } },
        ];
        break;
      case "customers":
        where.OR = [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ];
        break;
      case "inventory":
        where.product = {
          ...where.product,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { sku: { contains: searchTerm, mode: "insensitive" } },
          ],
        };
        break;
    }
  }

  return where;
}

/* ─────────────────── SELECT BUILDER ─────────────────── */

function buildSelect(
  sourceKey: string,
  columns: string[]
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  include: Record<string, any>;
} {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const select: Record<string, any> = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const include: Record<string, any> = {};
  const relations = new Set<string>();

  for (const colKey of columns) {
    const colDef = getColumnDef(sourceKey, colKey);
    if (!colDef) continue;

    if (colDef.computed) {
      // For computed fields, we need to include the necessary data
      if (colKey === "totalStock" && sourceKey === "products") {
        include.inventoryItems = { select: { quantity: true } };
      } else if (colKey === "channelCount" && sourceKey === "products") {
        include._count = { select: { channelProducts: true } };
      } else if (colKey === "available" && sourceKey === "inventory") {
        select.quantity = true;
        select.reservedQty = true;
      }
      continue;
    }

    const field = colDef.prismaField;
    if (field.includes(".")) {
      // Relation field — e.g. "customer.name"
      const [relation, subField] = field.split(".");
      relations.add(relation);
      if (!include[relation]) {
        include[relation] = { select: {} };
      }
      include[relation].select[subField] = true;
    } else {
      select[field] = true;
    }
  }

  // Always include id for row identity
  select.id = true;

  return { select, include };
}

function flattenIncludeToSelect(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  include: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> {
  // When using select, relations must be specified within select, not include
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(include)) {
    result[key] = value;
  }
  return result;
}

/* ─────────────────── ORDER BY BUILDER ─────────────────── */

function buildOrderBy(
  sourceKey: string,
  sort?: ReportRequest["sort"]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Record<string, any> | Record<string, any>[] | undefined {
  if (!sort) return undefined;

  const colDef = getColumnDef(sourceKey, sort.column);
  if (!colDef || colDef.computed) return undefined;

  const dir = sort.direction === "desc" ? "desc" : "asc";
  const field = colDef.prismaField;

  if (field.includes(".")) {
    const [relation, subField] = field.split(".");
    return { [relation]: { [subField]: dir } };
  }

  return { [field]: dir };
}

/* ─────────────────── ROW TRANSFORMER ─────────────────── */

function transformRow(
  sourceKey: string,
  columns: string[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>
): Record<string, unknown> {
  const row: Record<string, unknown> = {};

  for (const colKey of columns) {
    const colDef = getColumnDef(sourceKey, colKey);
    if (!colDef) continue;

    if (colDef.computed) {
      row[colKey] = computeField(sourceKey, colKey, raw);
      continue;
    }

    const field = colDef.prismaField;
    if (field.includes(".")) {
      const [relation, subField] = field.split(".");
      row[colKey] = raw[relation]?.[subField] ?? null;
    } else {
      // Convert Decimal to number for JSON serialization
      const val = raw[field];
      row[colKey] = val !== null && val !== undefined && typeof val === "object" && "toNumber" in val
        ? val.toNumber()
        : val;
    }
  }

  return row;
}

function computeField(
  sourceKey: string,
  colKey: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>
): unknown {
  switch (`${sourceKey}.${colKey}`) {
    case "products.totalStock": {
      const items = raw.inventoryItems as Array<{ quantity: number }> | undefined;
      return items ? items.reduce((sum, i) => sum + i.quantity, 0) : 0;
    }
    case "products.channelCount":
      return raw._count?.channelProducts ?? 0;
    case "inventory.available":
      return (raw.quantity ?? 0) - (raw.reservedQty ?? 0);
    default:
      return null;
  }
}
