import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiResponse, apiError } from "@/lib/utils";

/**
 * Validate that a SQL query is read-only (SELECT/WITH only).
 * Strips comments and checks for dangerous keywords.
 */
function validateReadOnly(sql: string): { valid: boolean; error?: string } {
  // Remove line comments
  let cleaned = sql.replace(/--[^\n]*/g, "");
  // Remove block comments
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, "");
  cleaned = cleaned.trim();

  if (!cleaned) {
    return { valid: false, error: "Empty query" };
  }

  // Check first keyword is SELECT or WITH
  const firstWord = cleaned.split(/\s+/)[0]?.toUpperCase();
  if (firstWord !== "SELECT" && firstWord !== "WITH") {
    return { valid: false, error: "Only SELECT queries are allowed. Query must start with SELECT or WITH." };
  }

  // Reject dangerous keywords (word-boundary to avoid false positives on column names)
  const dangerous = /\b(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|EXEC|EXECUTE|COPY|CALL)\b/i;
  if (dangerous.test(cleaned)) {
    return { valid: false, error: "Query contains prohibited keywords (INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, etc. are not allowed)" };
  }

  // Reject SELECT INTO
  if (/\bSELECT\b[\s\S]*\bINTO\b[\s\S]*\bFROM\b/i.test(cleaned)) {
    return { valid: false, error: "SELECT INTO is not allowed" };
  }

  return { valid: true };
}

/**
 * POST /api/sql
 * Execute a parameterized read-only SQL query
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, params = [], limit = 100 } = body;

    // 1. Validate presence
    if (!sql || typeof sql !== "string") {
      return apiError("SQL query is required");
    }

    // 2. Validate read-only
    const validation = validateReadOnly(sql);
    if (!validation.valid) {
      return apiError(validation.error!, 403);
    }

    // 3. Enforce row limit (max 1000)
    const safeLimit = Math.min(Math.max(1, Number(limit) || 100), 1000);

    // Strip trailing semicolons and wrap with LIMIT
    const trimmedSql = sql.trim().replace(/;+$/, "");
    const limitedSql = `SELECT * FROM (${trimmedSql}) AS __erp_subq LIMIT ${safeLimit + 1}`;

    // 4. Execute with timing
    const start = performance.now();
    const rawRows = await prisma.$queryRawUnsafe(limitedSql, ...params);
    const executionTimeMs = Math.round(performance.now() - start);

    // 5. Serialize BigInt values to strings for JSON compatibility
    const resultArray = JSON.parse(
      JSON.stringify(rawRows, (_key, value) =>
        typeof value === "bigint" ? value.toString() : value
      )
    ) as Record<string, unknown>[];

    // 6. Detect if results were limited
    const limited = resultArray.length > safeLimit;
    const finalRows = limited ? resultArray.slice(0, safeLimit) : resultArray;

    // 7. Extract columns from first row
    const columns = finalRows.length > 0 ? Object.keys(finalRows[0]) : [];

    return apiResponse({
      rows: finalRows,
      columns,
      rowCount: finalRows.length,
      executionTimeMs,
      limited,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Query execution failed";
    // Clean up Prisma error messages
    const cleanMessage = message
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return apiError(cleanMessage, 500);
  }
}
